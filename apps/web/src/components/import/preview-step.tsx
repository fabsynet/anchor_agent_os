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

interface PreviewStepProps {
  rawRows: Record<string, string>[];
  columnMapping: Record<string, string>;
  onComplete: (result: ImportResult) => void;
  onBack: () => void;
}

/**
 * Stub: Preview step for import wizard.
 * Will be fully implemented by plan 07-04.
 */
export function PreviewStep({
  rawRows,
  onBack,
}: PreviewStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview Import</CardTitle>
        <CardDescription>
          Review {rawRows.length} rows before importing.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Import preview will be available soon.
        </p>
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
