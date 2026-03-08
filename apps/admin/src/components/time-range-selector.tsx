'use client';

import { useState } from 'react';
import { subDays, formatISO } from 'date-fns';
import { Calendar } from 'lucide-react';

interface TimeRangeSelectorProps {
  onChange: (params: { startDate?: string; endDate?: string }) => void;
}

type Preset = '7d' | '30d' | '90d' | 'all';

const presets: { key: Preset; label: string }[] = [
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' },
  { key: '90d', label: '90d' },
  { key: 'all', label: 'All Time' },
];

function getPresetDates(preset: Preset): { startDate?: string; endDate?: string } {
  if (preset === 'all') return {};
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
  return {
    startDate: formatISO(subDays(new Date(), days), { representation: 'date' }),
    endDate: formatISO(new Date(), { representation: 'date' }),
  };
}

export function TimeRangeSelector({ onChange }: TimeRangeSelectorProps) {
  const [activePreset, setActivePreset] = useState<Preset | 'custom'>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  function handlePresetClick(preset: Preset) {
    setActivePreset(preset);
    onChange(getPresetDates(preset));
  }

  function handleCustomApply() {
    if (customStart || customEnd) {
      setActivePreset('custom');
      onChange({
        startDate: customStart || undefined,
        endDate: customEnd || undefined,
      });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex rounded-lg border border-[#334155] bg-[#0f172a] p-1">
        {presets.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handlePresetClick(key)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activePreset === key
                ? 'bg-[#2563eb] text-white'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-[#64748b]" />
        <input
          type="date"
          value={customStart}
          onChange={(e) => setCustomStart(e.target.value)}
          className="rounded-md border border-[#334155] bg-[#0f172a] px-2 py-1.5 text-xs text-[#e2e8f0] focus:border-[#2563eb] focus:outline-none"
          placeholder="Start"
        />
        <span className="text-xs text-[#64748b]">to</span>
        <input
          type="date"
          value={customEnd}
          onChange={(e) => setCustomEnd(e.target.value)}
          className="rounded-md border border-[#334155] bg-[#0f172a] px-2 py-1.5 text-xs text-[#e2e8f0] focus:border-[#2563eb] focus:outline-none"
          placeholder="End"
        />
        <button
          onClick={handleCustomApply}
          disabled={!customStart && !customEnd}
          className="rounded-md bg-[#334155] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#475569] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
