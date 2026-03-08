'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import Papa from 'papaparse';
import { api } from '@/lib/api';

interface ExportButtonProps {
  agencyId: string;
  agencyName: string;
}

interface ExportData {
  agency: Record<string, unknown>;
  users: Record<string, unknown>[];
  clients: Record<string, unknown>[];
  tasks: Record<string, unknown>[];
  documents: Record<string, unknown>[];
  expenses: Record<string, unknown>[];
  exportedAt: string;
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ExportButton({ agencyId, agencyName }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleExport(format: 'json' | 'csv') {
    setLoading(true);
    setIsOpen(false);
    try {
      const data = await api.get<ExportData>(
        `/admin/agencies/${agencyId}/export`,
      );
      const safeName = agencyName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

      if (format === 'json') {
        downloadBlob(
          JSON.stringify(data, null, 2),
          `${safeName}_export.json`,
          'application/json',
        );
      } else {
        // Flatten data for CSV: combine all entities into a summary sheet
        const rows: Record<string, unknown>[] = [];

        // Users
        for (const user of data.users) {
          rows.push({ entity: 'user', ...user });
        }

        // Clients (without nested policies)
        for (const client of data.clients) {
          const { policies: _policies, ...clientData } = client as Record<string, unknown> & { policies?: unknown };
          rows.push({ entity: 'client', ...clientData });
        }

        // Tasks
        for (const task of data.tasks) {
          rows.push({ entity: 'task', ...task });
        }

        // Documents
        for (const doc of data.documents) {
          rows.push({ entity: 'document', ...doc });
        }

        // Expenses
        for (const expense of data.expenses) {
          rows.push({ entity: 'expense', ...expense });
        }

        const csv = Papa.unparse(rows);
        downloadBlob(csv, `${safeName}_export.csv`, 'text/csv');
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center gap-2 rounded-md border border-[#334155] bg-[#1e293b] px-3 py-2 text-sm font-medium text-[#e2e8f0] hover:bg-[#334155] disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
        {loading ? 'Exporting...' : 'Export'}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-1 w-36 rounded-md border border-[#334155] bg-[#1e293b] py-1 shadow-lg">
          <button
            type="button"
            onClick={() => handleExport('json')}
            className="block w-full px-4 py-2 text-left text-sm text-[#e2e8f0] hover:bg-[#334155]"
          >
            Export as JSON
          </button>
          <button
            type="button"
            onClick={() => handleExport('csv')}
            className="block w-full px-4 py-2 text-left text-sm text-[#e2e8f0] hover:bg-[#334155]"
          >
            Export as CSV
          </button>
        </div>
      )}
    </div>
  );
}
