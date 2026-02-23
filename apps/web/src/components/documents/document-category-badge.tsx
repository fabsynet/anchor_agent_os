"use client";

import type { DocumentCategory } from "@anchor/shared";
import { DOCUMENT_CATEGORIES } from "@anchor/shared";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const categoryColors: Record<DocumentCategory, string> = {
  policy_document: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  application: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  id_license: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  claim_form: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  proof_of_insurance: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  endorsement: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
  cancellation_notice: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  correspondence: "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300",
};

interface DocumentCategoryBadgeProps {
  category: DocumentCategory;
}

export function DocumentCategoryBadge({ category }: DocumentCategoryBadgeProps) {
  const label =
    DOCUMENT_CATEGORIES.find((c) => c.value === category)?.label ?? category;
  const colorClass = categoryColors[category] ?? categoryColors.correspondence;

  return (
    <Badge
      variant="outline"
      className={cn("border-transparent text-[10px] font-medium", colorClass)}
    >
      {label}
    </Badge>
  );
}
