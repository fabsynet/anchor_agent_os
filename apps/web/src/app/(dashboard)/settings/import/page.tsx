'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SettingsNav } from '@/components/settings/settings-nav';
import { ImportWizard } from '@/components/import/import-wizard';
import { createClient } from '@/lib/supabase/client';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ImportSettingsPage() {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadTemplate = async () => {
    setDownloading(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`${API_BASE_URL}/import/template`, { headers });
      if (!res.ok) throw new Error('Failed to download template');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'import-template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Template downloaded');
    } catch {
      toast.error('Failed to download template. Make sure the API is running.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, team, and public badge page.
        </p>
      </div>

      {/* Settings sub-nav */}
      <SettingsNav />

      {/* Page Title */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Import Clients &amp; Policies
        </h2>
        <p className="text-sm text-muted-foreground">
          Import your existing book of business from a CSV file.
        </p>
      </div>

      {/* Template Download Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="size-5" />
            CSV Template
          </CardTitle>
          <CardDescription>
            Download a template with the expected column headers and example
            data. Fill it in and upload below to import your clients and
            policies.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            disabled={downloading}
          >
            <Download className="size-4" />
            {downloading ? 'Downloading...' : 'Download Template'}
          </Button>
        </CardContent>
      </Card>

      {/* Import Wizard */}
      <ImportWizard />
    </div>
  );
}
