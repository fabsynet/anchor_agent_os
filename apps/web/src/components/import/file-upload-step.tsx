'use client';

import { useCallback, useRef, useState } from 'react';
import Papa from 'papaparse';
import { Upload, FileText, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FileUploadStepProps {
  onComplete: (rows: Record<string, string>[], headers: string[]) => void;
}

export function FileUploadStep({ onComplete }: FileUploadStepProps) {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const parseFile = useCallback(
    (selectedFile: File) => {
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File is too large. Maximum size is 10MB.');
        return;
      }

      Papa.parse<Record<string, string>>(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          if (result.errors.length > 0) {
            const firstError = result.errors[0];
            toast.error(
              `CSV parsing error (row ${firstError.row}): ${firstError.message}`
            );
          }

          if (result.data.length === 0) {
            toast.error('CSV file is empty or has no data rows');
            return;
          }

          const parsedHeaders = result.meta.fields || [];
          if (parsedHeaders.length === 0) {
            toast.error('CSV file has no column headers');
            return;
          }

          setFile(selectedFile);
          setRows(result.data);
          setHeaders(parsedHeaders);
          toast.success(
            `Parsed ${result.data.length} rows with ${parsedHeaders.length} columns`
          );
        },
        error: (error) => {
          toast.error(`Failed to parse CSV: ${error.message}`);
        },
      });
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) parseFile(droppedFile);
    },
    [parseFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) parseFile(selectedFile);
    },
    [parseFile]
  );

  const handleClear = useCallback(() => {
    setFile(null);
    setRows([]);
    setHeaders([]);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload CSV File</CardTitle>
        <CardDescription>
          Upload a CSV file with your client and policy data. Each row should
          represent one policy. Clients with multiple policies will appear on
          multiple rows.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          )}
        >
          <Upload className="mb-3 size-10 text-muted-foreground" />
          <p className="text-sm font-medium">
            Drop your CSV file here, or click to browse
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            CSV files only, up to 10MB (max 5,000 rows)
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* File Info */}
        {file && (
          <div className="flex items-center justify-between rounded-md border bg-muted/50 p-3">
            <div className="flex items-center gap-3">
              <FileText className="size-5 text-primary" />
              <div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {rows.length} rows, {headers.length} columns (
                  {(file.size / 1024).toFixed(1)} KB)
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon-xs" onClick={handleClear}>
              <X className="size-4" />
            </Button>
          </div>
        )}

        {/* Next Button */}
        {rows.length > 0 && (
          <div className="flex justify-end">
            <Button onClick={() => onComplete(rows, headers)}>
              Next: Map Columns
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
