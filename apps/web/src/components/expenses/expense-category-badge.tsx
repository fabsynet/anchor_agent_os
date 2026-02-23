"use client";

import { EXPENSE_CATEGORIES } from "@anchor/shared";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const categoryColors: Record<string, string> = {
  office_rent: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  office_supplies: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
  technology: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  marketing: "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300",
  licensing: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  eo_insurance: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  travel: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
  professional_development: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
  salaries: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  client_entertainment: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
  telephone: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300",
  postage: "bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-300",
  utilities: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300",
};

const DEFAULT_COLOR = "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300";

interface ExpenseCategoryBadgeProps {
  category: string;
}

export function ExpenseCategoryBadge({ category }: ExpenseCategoryBadgeProps) {
  const presetLabel =
    EXPENSE_CATEGORIES.find((c) => c.value === category)?.label ?? null;
  const label = presetLabel ?? category;
  const colorClass = categoryColors[category] ?? DEFAULT_COLOR;

  return (
    <Badge
      variant="outline"
      className={cn("border-transparent text-[10px] font-medium", colorClass)}
    >
      {label}
    </Badge>
  );
}
