'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CircleX,
  Loader2,
  SkipForward,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  IMPORT_EXPECTED_FIELDS,
  IMPORT_POLICY_TYPE_MAP,
} from '@anchor/shared';
import type { ImportResult, ImportRow } from '@anchor/shared';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface PreviewStepProps {
  rawRows: Record<string, string>[];
  columnMapping: Record<string, string>;
  onComplete: (result: ImportResult) => void;
  onBack: () => void;
}

const SKIP_VALUE = '__skip__';

interface MappedRow extends ImportRow {
  _rowIndex: number;
  _errors: string[];
  _warnings: string[];
  _skipped: boolean;
  _editing: boolean;
}

// Email regex - simple validation
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Map raw CSV rows to ImportRow using the column mapping,
 * normalize policy types, and validate each row.
 */
function mapAndValidate(
  rawRows: Record<string, string>[],
  columnMapping: Record<string, string>
): MappedRow[] {
  return rawRows.map((raw, idx) => {
    const mapped: Record<string, string> = {};

    // Apply column mapping
    for (const field of IMPORT_EXPECTED_FIELDS) {
      const csvHeader = columnMapping[field.key];
      if (csvHeader && csvHeader !== SKIP_VALUE) {
        const val = raw[csvHeader]?.trim() || '';
        if (val) mapped[field.key] = val;
      }
    }

    // Normalize policy type using lenient mapping
    if (mapped.policyType) {
      const normalized = mapped.policyType.toLowerCase().trim();
      const canonicalTypes = [
        'auto',
        'home',
        'life',
        'health',
        'commercial',
        'travel',
        'umbrella',
        'other',
      ];
      if (canonicalTypes.includes(normalized)) {
        mapped.policyType = normalized;
      } else if (IMPORT_POLICY_TYPE_MAP[normalized]) {
        mapped.policyType = IMPORT_POLICY_TYPE_MAP[normalized];
      }
      // If not matched, leave as-is -- backend will handle with 'other' fallback
    }

    // Validate
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!mapped.firstName) errors.push('First name is required');
    if (!mapped.lastName) errors.push('Last name is required');
    if (!mapped.policyType) errors.push('Policy type is required');

    if (mapped.email && !EMAIL_RE.test(mapped.email)) {
      warnings.push('Invalid email format');
    }

    if (mapped.premium) {
      const num = parseFloat(mapped.premium.replace(/[,$]/g, ''));
      if (isNaN(num)) {
        warnings.push('Premium is not a valid number');
      } else {
        mapped.premium = String(num);
      }
    }

    return {
      firstName: mapped.firstName || '',
      lastName: mapped.lastName || '',
      email: mapped.email,
      phone: mapped.phone,
      address: mapped.address,
      city: mapped.city,
      province: mapped.province,
      postalCode: mapped.postalCode,
      policyType: mapped.policyType || '',
      carrier: mapped.carrier,
      policyNumber: mapped.policyNumber,
      premium: mapped.premium,
      startDate: mapped.startDate,
      endDate: mapped.endDate,
      status: mapped.status,
      _rowIndex: idx + 1,
      _errors: errors,
      _warnings: warnings,
      _skipped: false,
      _editing: false,
    };
  });
}

/** Visible columns in the preview table */
const PREVIEW_COLUMNS = [
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'email', label: 'Email' },
  { key: 'policyType', label: 'Policy Type' },
  { key: 'carrier', label: 'Carrier' },
  { key: 'premium', label: 'Premium' },
] as const;

export function PreviewStep({
  rawRows,
  columnMapping,
  onComplete,
  onBack,
}: PreviewStepProps) {
  const initialRows = useMemo(
    () => mapAndValidate(rawRows, columnMapping),
    [rawRows, columnMapping]
  );

  const [rows, setRows] = useState<MappedRow[]>(initialRows);
  const [importing, setImporting] = useState(false);

  // Stats
  const validCount = rows.filter(
    (r) => !r._skipped && r._errors.length === 0
  ).length;
  const warningCount = rows.filter(
    (r) => !r._skipped && r._warnings.length > 0 && r._errors.length === 0
  ).length;
  const errorCount = rows.filter(
    (r) => !r._skipped && r._errors.length > 0
  ).length;
  const skippedCount = rows.filter((r) => r._skipped).length;

  const handleSkip = useCallback((rowIndex: number) => {
    setRows((prev) =>
      prev.map((r) =>
        r._rowIndex === rowIndex ? { ...r, _skipped: !r._skipped } : r
      )
    );
  }, []);

  const handleEditToggle = useCallback((rowIndex: number) => {
    setRows((prev) =>
      prev.map((r) =>
        r._rowIndex === rowIndex ? { ...r, _editing: !r._editing } : r
      )
    );
  }, []);

  const handleFieldChange = useCallback(
    (rowIndex: number, field: string, value: string) => {
      setRows((prev) =>
        prev.map((r) => {
          if (r._rowIndex !== rowIndex) return r;
          const updated = { ...r, [field]: value };

          // Re-validate
          const errors: string[] = [];
          const warnings: string[] = [];
          if (!updated.firstName) errors.push('First name is required');
          if (!updated.lastName) errors.push('Last name is required');
          if (!updated.policyType) errors.push('Policy type is required');
          if (updated.email && !EMAIL_RE.test(updated.email))
            warnings.push('Invalid email format');
          if (updated.premium) {
            const num = parseFloat(
              updated.premium.replace(/[,$]/g, '')
            );
            if (isNaN(num)) warnings.push('Premium is not a valid number');
          }

          return { ...updated, _errors: errors, _warnings: warnings };
        })
      );
    },
    []
  );

  const handleImport = async () => {
    const validRows = rows.filter(
      (r) => !r._skipped && r._errors.length === 0
    );

    if (validRows.length === 0) {
      toast.error('No valid rows to import');
      return;
    }

    setImporting(true);
    try {
      // Strip internal fields before sending
      const importRows: ImportRow[] = validRows.map((r) => ({
        firstName: r.firstName,
        lastName: r.lastName,
        email: r.email || undefined,
        phone: r.phone || undefined,
        address: r.address || undefined,
        city: r.city || undefined,
        province: r.province || undefined,
        postalCode: r.postalCode || undefined,
        policyType: r.policyType,
        carrier: r.carrier || undefined,
        policyNumber: r.policyNumber || undefined,
        premium: r.premium || undefined,
        startDate: r.startDate || undefined,
        endDate: r.endDate || undefined,
        status: r.status || undefined,
      }));

      const result = await api.post<ImportResult>('/import/clients-policies', {
        rows: importRows,
      });

      toast.success(
        `Imported ${result.clientsCreated} clients and ${result.policiesCreated} policies`
      );
      onComplete(result);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Import failed'
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview Import</CardTitle>
        <CardDescription>
          Review your data before importing. You can skip rows with errors or
          edit them inline.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Bar */}
        <div className="flex flex-wrap gap-4 rounded-md border bg-muted/50 p-3 text-sm">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-green-600" />
            <span className="font-medium">{validCount}</span> valid
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="size-4 text-yellow-500" />
            <span className="font-medium">{warningCount}</span> warnings
          </div>
          <div className="flex items-center gap-1.5">
            <CircleX className="size-4 text-destructive" />
            <span className="font-medium">{errorCount}</span> errors
          </div>
          <div className="flex items-center gap-1.5">
            <SkipForward className="size-4 text-muted-foreground" />
            <span className="font-medium">{skippedCount}</span> skipped
          </div>
        </div>

        {/* Preview Table */}
        <div className="max-h-[400px] overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                {PREVIEW_COLUMNS.map((col) => (
                  <TableHead key={col.key}>{col.label}</TableHead>
                ))}
                <TableHead className="w-16">Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row._rowIndex}
                  className={cn(
                    row._skipped && 'opacity-40 line-through',
                    row._errors.length > 0 &&
                      !row._skipped &&
                      'bg-destructive/5',
                    row._warnings.length > 0 &&
                      row._errors.length === 0 &&
                      !row._skipped &&
                      'bg-yellow-500/5'
                  )}
                >
                  <TableCell className="text-muted-foreground text-xs">
                    {row._rowIndex}
                  </TableCell>
                  {PREVIEW_COLUMNS.map((col) => (
                    <TableCell key={col.key}>
                      {row._editing && !row._skipped ? (
                        <Input
                          value={
                            (row[col.key as keyof ImportRow] as string) || ''
                          }
                          onChange={(e) =>
                            handleFieldChange(
                              row._rowIndex,
                              col.key,
                              e.target.value
                            )
                          }
                          className="h-7 text-xs"
                        />
                      ) : (
                        <span className="text-sm">
                          {(row[col.key as keyof ImportRow] as string) || (
                            <span className="text-muted-foreground">--</span>
                          )}
                        </span>
                      )}
                    </TableCell>
                  ))}
                  <TableCell>
                    {row._skipped ? (
                      <span className="text-xs text-muted-foreground">
                        Skipped
                      </span>
                    ) : row._errors.length > 0 ? (
                      <span
                        className="text-xs text-destructive"
                        title={row._errors.join(', ')}
                      >
                        Error
                      </span>
                    ) : row._warnings.length > 0 ? (
                      <span
                        className="text-xs text-yellow-600"
                        title={row._warnings.join(', ')}
                      >
                        Warning
                      </span>
                    ) : (
                      <span className="text-xs text-green-600">OK</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleSkip(row._rowIndex)}
                        title={row._skipped ? 'Unskip' : 'Skip'}
                      >
                        <SkipForward className="size-3" />
                      </Button>
                      {!row._skipped && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleEditToggle(row._rowIndex)}
                          title={row._editing ? 'Done' : 'Edit'}
                        >
                          <Pencil className="size-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack} disabled={importing}>
            Back
          </Button>
          <Button
            onClick={handleImport}
            disabled={importing || validCount === 0}
          >
            {importing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Importing...
              </>
            ) : (
              `Import ${validCount} Row${validCount !== 1 ? 's' : ''}`
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
