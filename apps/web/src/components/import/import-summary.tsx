'use client';

import Link from 'next/link';
import {
  CheckCircle2,
  Copy,
  AlertTriangle,
  CircleX,
  Users,
  FileText,
} from 'lucide-react';
import type { ImportResult } from '@anchor/shared';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ImportSummaryProps {
  result: ImportResult;
  onReset: () => void;
}

export function ImportSummary({ result, onReset }: ImportSummaryProps) {
  const hasErrors = result.errors.length > 0;
  const hasDuplicates = result.duplicates.length > 0;
  const totalProcessed =
    result.clientsCreated +
    result.policiesCreated +
    result.duplicatesSkipped +
    result.errors.length;

  return (
    <div className="space-y-6">
      {/* Success/Partial Success Banner */}
      <Card
        className={cn(
          hasErrors ? 'border-yellow-500/50' : 'border-green-500/50'
        )}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {hasErrors ? (
              <AlertTriangle className="size-5 text-yellow-500" />
            ) : (
              <CheckCircle2 className="size-5 text-green-600" />
            )}
            {hasErrors ? 'Import Completed with Errors' : 'Import Successful'}
          </CardTitle>
          <CardDescription>
            {result.clientsCreated} client{result.clientsCreated !== 1 ? 's' : ''}{' '}
            and {result.policiesCreated} polic
            {result.policiesCreated !== 1 ? 'ies' : 'y'} imported successfully.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={<Users className="size-5 text-primary" />}
          label="Clients Created"
          value={result.clientsCreated}
        />
        <SummaryCard
          icon={<FileText className="size-5 text-primary" />}
          label="Policies Created"
          value={result.policiesCreated}
        />
        <SummaryCard
          icon={<Copy className="size-5 text-yellow-500" />}
          label="Duplicates Skipped"
          value={result.duplicatesSkipped}
        />
        <SummaryCard
          icon={<CircleX className="size-5 text-destructive" />}
          label="Errors"
          value={result.errors.length}
        />
      </div>

      {/* Duplicates Section */}
      {hasDuplicates && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Duplicate Clients</CardTitle>
            <CardDescription>
              These clients already exist in your database and were skipped
              during import.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {result.duplicates.map((dup, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div className="text-sm">
                    <span className="font-medium">
                      {dup.firstName} {dup.lastName}
                    </span>
                    {dup.email && (
                      <span className="ml-2 text-muted-foreground">
                        ({dup.email})
                      </span>
                    )}
                  </div>
                  <Button variant="outline" size="xs" asChild>
                    <Link href={`/clients/${dup.existingId}`}>
                      View Client
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Errors Section */}
      {hasErrors && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Import Errors</CardTitle>
            <CardDescription>
              These rows could not be imported. Review the errors below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {result.errors.map((err, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm"
                >
                  <CircleX className="mt-0.5 size-4 shrink-0 text-destructive" />
                  <div>
                    <span className="font-medium">Row {err.row}:</span>{' '}
                    <span className="text-muted-foreground">{err.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={onReset} variant="outline">
          Import Another File
        </Button>
        <Button asChild>
          <Link href="/clients">Go to Clients</Link>
        </Button>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-0">
        {icon}
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
