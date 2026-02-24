'use client';

import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExportButtonsProps {
  onExportCsv: () => void;
  onExportPdf: () => void;
  loading?: boolean;
}

export function ExportButtons({
  onExportCsv,
  onExportPdf,
  loading,
}: ExportButtonsProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onExportCsv}
        disabled={loading}
      >
        <Download className="size-4" />
        Export CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onExportPdf}
        disabled={loading}
      >
        <FileText className="size-4" />
        Export PDF
      </Button>
    </div>
  );
}
