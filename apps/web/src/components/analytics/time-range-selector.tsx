'use client';

import { Button } from '@/components/ui/button';

const TIME_RANGES = [
  { value: '3mo', label: '3 Months' },
  { value: '6mo', label: '6 Months' },
  { value: 'ytd', label: 'YTD' },
  { value: '12mo', label: '12 Months' },
  { value: 'all', label: 'All Time' },
] as const;

interface TimeRangeSelectorProps {
  value: string;
  onChange: (range: string) => void;
}

/**
 * Compute startDate / endDate from a time range preset.
 * Returns null for 'all' (no date filter).
 */
export function getDateRange(
  range: string,
): { startDate: string; endDate: string } | null {
  if (range === 'all') return null;

  const now = new Date();
  const endDate = now.toISOString().split('T')[0]; // YYYY-MM-DD

  let start: Date;
  switch (range) {
    case '3mo':
      start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      break;
    case '6mo':
      start = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      break;
    case 'ytd':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    case '12mo':
    default:
      start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
  }

  const startDate = start.toISOString().split('T')[0];
  return { startDate, endDate };
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="overflow-x-auto">
      <div className="flex flex-nowrap gap-1">
        {TIME_RANGES.map((range) => (
          <Button
            key={range.value}
            variant={value === range.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(range.value)}
          >
            {range.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
