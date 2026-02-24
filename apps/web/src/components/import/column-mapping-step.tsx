'use client';

import { useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { IMPORT_EXPECTED_FIELDS } from '@anchor/shared';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ColumnMappingStepProps {
  headers: string[];
  initialMapping: Record<string, string>;
  onComplete: (mapping: Record<string, string>) => void;
  onBack: () => void;
}

const SKIP_VALUE = '__skip__';

/**
 * Normalize a header string for fuzzy matching:
 * lowercase, remove underscores/hyphens/spaces, trim
 */
function normalize(str: string): string {
  return str.toLowerCase().replace(/[_\-\s]/g, '').trim();
}

/**
 * Auto-detect mapping by fuzzy matching CSV headers to expected field keys/labels
 */
function autoDetectMapping(
  csvHeaders: string[],
  expectedFields: typeof IMPORT_EXPECTED_FIELDS
): Record<string, string> {
  const mapping: Record<string, string> = {};
  const usedHeaders = new Set<string>();

  for (const field of expectedFields) {
    const normalizedKey = normalize(field.key);
    const normalizedLabel = normalize(field.label);

    // Try to find a matching CSV header
    const match = csvHeaders.find((h) => {
      if (usedHeaders.has(h)) return false;
      const nh = normalize(h);
      return (
        nh === normalizedKey ||
        nh === normalizedLabel ||
        // Field-specific fuzzy aliases
        (field.key === 'firstName' &&
          (nh === 'first' || nh === 'firstname' || nh === 'fname' || nh === 'givenname')) ||
        (field.key === 'lastName' &&
          (nh === 'last' || nh === 'lastname' || nh === 'lname' || nh === 'surname' || nh === 'familyname')) ||
        (field.key === 'email' &&
          (nh === 'emailaddress' || nh === 'mail' || nh === 'email')) ||
        (field.key === 'phone' &&
          (nh === 'phonenumber' || nh === 'tel' || nh === 'telephone' || nh === 'mobile' || nh === 'cell')) ||
        (field.key === 'postalCode' &&
          (nh === 'zip' || nh === 'zipcode' || nh === 'postcode' || nh === 'postalcode')) ||
        (field.key === 'policyType' &&
          (nh === 'type' || nh === 'insurancetype' || nh === 'product' || nh === 'producttype' || nh === 'lineofbusiness' || nh === 'lob')) ||
        (field.key === 'carrier' &&
          (nh === 'insurer' || nh === 'company' || nh === 'insurancecompany' || nh === 'provider')) ||
        (field.key === 'policyNumber' &&
          (nh === 'policynumber' || nh === 'policyno' || nh === 'policyid' || nh === 'polnumber')) ||
        (field.key === 'premium' &&
          (nh === 'annualpremium' || nh === 'premiumamount' || nh === 'amount')) ||
        (field.key === 'startDate' &&
          (nh === 'effectivedate' || nh === 'inceptiondate' || nh === 'start' || nh === 'policystart' || nh === 'startdate')) ||
        (field.key === 'endDate' &&
          (nh === 'expirydate' || nh === 'expirationdate' || nh === 'renewaldate' || nh === 'expiry' || nh === 'end' || nh === 'policyend' || nh === 'enddate')) ||
        (field.key === 'province' &&
          (nh === 'state' || nh === 'region' || nh === 'prov')) ||
        (field.key === 'status' &&
          (nh === 'policystatus'))
      );
    });

    if (match) {
      mapping[field.key] = match;
      usedHeaders.add(match);
    } else {
      mapping[field.key] = SKIP_VALUE;
    }
  }

  return mapping;
}

export function ColumnMappingStep({
  headers,
  initialMapping,
  onComplete,
  onBack,
}: ColumnMappingStepProps) {
  const autoMapping = useMemo(
    () => autoDetectMapping(headers, IMPORT_EXPECTED_FIELDS),
    [headers]
  );

  const [mapping, setMapping] = useState<Record<string, string>>(
    Object.keys(initialMapping).length > 0 ? initialMapping : autoMapping
  );

  // Count auto-detected
  const autoDetectedCount = useMemo(
    () => Object.values(autoMapping).filter((v) => v !== SKIP_VALUE).length,
    [autoMapping]
  );

  const handleChange = (fieldKey: string, csvHeader: string) => {
    setMapping((prev) => ({ ...prev, [fieldKey]: csvHeader }));
  };

  // Validation: required fields must be mapped
  const requiredFields = IMPORT_EXPECTED_FIELDS.filter((f) => f.required);
  const missingRequired = requiredFields.filter(
    (f) => !mapping[f.key] || mapping[f.key] === SKIP_VALUE
  );
  const isValid = missingRequired.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Map Columns</CardTitle>
        <CardDescription>
          Match your CSV columns to the expected fields. We auto-detected{' '}
          {autoDetectedCount} of {IMPORT_EXPECTED_FIELDS.length} fields.
          Required fields are marked with *.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mapping Table */}
        <div className="space-y-3">
          {IMPORT_EXPECTED_FIELDS.map((field) => (
            <div
              key={field.key}
              className="grid grid-cols-[1fr_1fr] items-center gap-4"
            >
              <div className="text-sm font-medium">
                {field.label}
                {field.required && (
                  <span className="ml-1 text-destructive">*</span>
                )}
              </div>
              <Select
                value={mapping[field.key] || SKIP_VALUE}
                onValueChange={(value) => handleChange(field.key, value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select column..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SKIP_VALUE}>-- Skip --</SelectItem>
                  {headers.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        {/* Validation Errors */}
        {missingRequired.length > 0 && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div>
              <p className="font-medium text-destructive">
                Required fields not mapped:
              </p>
              <p className="text-muted-foreground">
                {missingRequired.map((f) => f.label).join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button disabled={!isValid} onClick={() => onComplete(mapping)}>
            Next: Preview
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
