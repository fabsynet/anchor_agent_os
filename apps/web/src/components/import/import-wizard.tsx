'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { ImportResult } from '@anchor/shared';
import { FileUploadStep } from './file-upload-step';
import { ColumnMappingStep } from './column-mapping-step';
import { PreviewStep } from './preview-step';
import { ImportSummary } from './import-summary';

const STEPS = [
  { number: 1, label: 'Upload' },
  { number: 2, label: 'Map Columns' },
  { number: 3, label: 'Preview' },
  { number: 4, label: 'Summary' },
];

export function ImportWizard() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>(
    {}
  );
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleFileUploaded = (
    parsedRows: Record<string, string>[],
    parsedHeaders: string[]
  ) => {
    setRawRows(parsedRows);
    setHeaders(parsedHeaders);
    setStep(2);
  };

  const handleMappingComplete = (mapping: Record<string, string>) => {
    setColumnMapping(mapping);
    setStep(3);
  };

  const handleImportComplete = (result: ImportResult) => {
    setImportResult(result);
    setStep(4);
  };

  const handleReset = () => {
    setStep(1);
    setRawRows([]);
    setHeaders([]);
    setColumnMapping({});
    setImportResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {STEPS.map((s, idx) => (
          <div key={s.number} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex size-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                  step === s.number
                    ? 'bg-primary text-primary-foreground'
                    : step > s.number
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                )}
              >
                {step > s.number ? (
                  <svg
                    className="size-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  s.number
                )}
              </div>
              <span
                className={cn(
                  'text-sm font-medium hidden sm:inline',
                  step === s.number
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {s.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  'mx-3 h-px flex-1',
                  step > s.number ? 'bg-primary/40' : 'bg-muted'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {step === 1 && <FileUploadStep onComplete={handleFileUploaded} />}
      {step === 2 && (
        <ColumnMappingStep
          headers={headers}
          initialMapping={{}}
          onComplete={handleMappingComplete}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <PreviewStep
          rawRows={rawRows}
          columnMapping={columnMapping}
          onComplete={handleImportComplete}
          onBack={() => setStep(2)}
        />
      )}
      {step === 4 && importResult && (
        <ImportSummary result={importResult} onReset={handleReset} />
      )}
    </div>
  );
}
