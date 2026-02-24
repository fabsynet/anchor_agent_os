'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface ColumnMappingStepProps {
  headers: string[];
  initialMapping: Record<string, string>;
  onComplete: (mapping: Record<string, string>) => void;
  onBack: () => void;
}

/**
 * Stub: Column mapping step for import wizard.
 * Will be fully implemented by plan 07-04.
 */
export function ColumnMappingStep({
  headers,
  onComplete,
  onBack,
}: ColumnMappingStepProps) {
  // Auto-map headers 1:1 as stub behavior
  const handleContinue = () => {
    const mapping: Record<string, string> = {};
    headers.forEach((h) => {
      mapping[h] = h;
    });
    onComplete(mapping);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Map Columns</CardTitle>
        <CardDescription>
          Map your CSV columns to the expected fields.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Column mapping will be available soon.
        </p>
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={handleContinue}>Next: Preview</Button>
        </div>
      </CardContent>
    </Card>
  );
}
