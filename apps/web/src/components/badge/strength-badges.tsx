'use client';

import { STRENGTH_CATEGORIES } from '@anchor/shared';
import { cn } from '@/lib/utils';

// ─── Display Component ───────────────────────────────────

interface StrengthBadgesProps {
  strengths: string[];
  size?: 'sm' | 'md';
}

const strengthLabelMap = new Map<string, string>(
  STRENGTH_CATEGORIES.map((c) => [c.value, c.label])
);

export function StrengthBadges({ strengths, size = 'sm' }: StrengthBadgesProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {strengths.map((strength) => (
        <span
          key={strength}
          className={cn(
            'inline-flex items-center rounded-full bg-secondary text-secondary-foreground font-medium',
            size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
          )}
        >
          {strengthLabelMap.get(strength) || strength}
        </span>
      ))}
    </div>
  );
}

// ─── Picker Component (for forms) ────────────────────────

interface StrengthPickerProps {
  selected: string[];
  onChange: (selected: string[]) => void;
  max?: number;
}

export function StrengthPicker({
  selected,
  onChange,
  max = 5,
}: StrengthPickerProps) {
  const toggleStrength = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value));
    } else if (selected.length < max) {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {STRENGTH_CATEGORIES.map((category) => {
        const isSelected = selected.includes(category.value);
        const isDisabled = !isSelected && selected.length >= max;
        return (
          <button
            key={category.value}
            type="button"
            onClick={() => toggleStrength(category.value)}
            disabled={isDisabled}
            className={cn(
              'inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors border',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isSelected
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-foreground border-border hover:bg-accent',
              isDisabled && 'opacity-40 cursor-not-allowed'
            )}
            aria-pressed={isSelected}
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
}
