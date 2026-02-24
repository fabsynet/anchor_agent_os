'use client';

import type { ImportResult } from '@anchor/shared';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface ImportSummaryProps {
  result: ImportResult;
  onReset: () => void;
}

/**
 * Stub: Import summary step for import wizard.
 * Will be fully implemented by plan 07-04.
 */
export function ImportSummary({ result, onReset }: ImportSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Complete</CardTitle>
        <CardDescription>
          {result.clientsCreated} clients and {result.policiesCreated} policies
          imported.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {result.duplicatesSkipped > 0 && (
          <p className="text-sm text-muted-foreground">
            {result.duplicatesSkipped} duplicate(s) skipped.
          </p>
        )}
        {result.errors.length > 0 && (
          <p className="text-sm text-destructive">
            {result.errors.length} error(s) occurred.
          </p>
        )}
        <Button onClick={onReset}>Import Another File</Button>
      </CardContent>
    </Card>
  );
}
