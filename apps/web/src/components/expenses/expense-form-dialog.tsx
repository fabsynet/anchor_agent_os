"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  createExpenseSchema,
  EXPENSE_CATEGORIES,
  RECURRENCE_FREQUENCIES,
} from "@anchor/shared";
import type {
  CreateExpenseInput,
  ExpenseListItem,
  ExpenseReceipt,
} from "@anchor/shared";

import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ExpenseReceiptUpload } from "./expense-receipt-upload";

// ─── Types ───────────────────────────────────────────────
type DialogMode = "create" | "edit" | "view";

interface CategoryOption {
  value: string;
  label: string;
}

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: ExpenseListItem | null;
  mode?: DialogMode;
  onSaved: () => void;
}

// ─── Helpers ─────────────────────────────────────────────
const cadFormatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
});

// ─── Component ───────────────────────────────────────────
export function ExpenseFormDialog({
  open,
  onOpenChange,
  expense,
  mode: modeProp,
  onSaved,
}: ExpenseFormDialogProps) {
  // Determine mode
  const mode: DialogMode = modeProp ?? (expense ? "edit" : "create");
  const isViewOnly =
    mode === "view" ||
    (expense &&
      expense.status !== "draft" &&
      expense.status !== "rejected");
  const isEditing = mode === "edit" && !isViewOnly;
  const isCreating = mode === "create";

  const [saving, setSaving] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const [receipts, setReceipts] = useState<ExpenseReceipt[]>([]);

  // Fetch categories
  useEffect(() => {
    api
      .get<CategoryOption[]>("/api/expenses/categories")
      .then(setCategories)
      .catch(() => {
        setCategories(
          EXPENSE_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))
        );
      });
  }, []);

  // Form setup - use createExpenseSchema for both create and edit
  const form = useForm<CreateExpenseInput>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      amount: 0,
      category: "",
      date: new Date(),
      description: "",
      isRecurring: false,
      recurrence: undefined,
    },
  });

  const isRecurring = form.watch("isRecurring");
  const selectedCategory = form.watch("category");

  // Reset form when expense changes (edit mode) or dialog opens
  useEffect(() => {
    if (!open) {
      setPendingFiles([]);
      setUseCustomCategory(false);
      return;
    }

    if (expense) {
      // Check if category is custom (not in presets)
      const isCustom = !EXPENSE_CATEGORIES.some(
        (c) => c.value === expense.category
      );
      setUseCustomCategory(isCustom);
      setReceipts(expense.receipts || []);

      form.reset({
        amount: parseFloat(expense.amount),
        category: expense.category,
        date: new Date(expense.date),
        description: expense.description || "",
        isRecurring: expense.isRecurring,
        recurrence: expense.recurrence ?? undefined,
      });
    } else {
      setReceipts([]);
      setUseCustomCategory(false);
      form.reset({
        amount: 0,
        category: "",
        date: new Date(),
        description: "",
        isRecurring: false,
        recurrence: undefined,
      });
    }
  }, [expense, open, form]);

  // Handle file selection from upload zone
  const handleFilesSelected = useCallback((files: File[]) => {
    setPendingFiles((prev) => [...prev, ...files]);
  }, []);

  const handleRemovePending = useCallback((index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleReceiptDeleted = useCallback(() => {
    // Refetch expense to update receipts list
    if (expense) {
      api
        .get<ExpenseListItem>(`/api/expenses/${expense.id}`)
        .then((updated) => {
          setReceipts(updated.receipts || []);
        })
        .catch(() => {
          // ignore
        });
    }
  }, [expense]);

  // Submit handler
  const onSubmit = async (data: CreateExpenseInput) => {
    setSaving(true);
    try {
      let expenseId: string;

      if (isEditing && expense) {
        // Update existing expense
        await api.patch(`/api/expenses/${expense.id}`, {
          ...data,
          date: data.date instanceof Date ? data.date.toISOString() : data.date,
        });
        expenseId = expense.id;
        toast.success("Expense updated");
      } else {
        // Create new expense
        const created = await api.post<{ id: string }>("/api/expenses", {
          ...data,
          date: data.date instanceof Date ? data.date.toISOString() : data.date,
        });
        expenseId = created.id;
        toast.success("Expense created");
      }

      // Upload pending receipt files
      if (pendingFiles.length > 0) {
        const formData = new FormData();
        for (const file of pendingFiles) {
          formData.append("files", file);
        }
        try {
          await api.upload(
            `/api/expenses/${expenseId}/receipts`,
            formData
          );
          toast.success(
            `${pendingFiles.length} receipt${pendingFiles.length > 1 ? "s" : ""} uploaded`
          );
        } catch (err) {
          toast.error(
            err instanceof Error
              ? err.message
              : "Failed to upload receipts"
          );
        }
      }

      setPendingFiles([]);
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save expense"
      );
    } finally {
      setSaving(false);
    }
  };

  // Close handler
  const handleClose = (nextOpen: boolean) => {
    if (!saving) {
      onOpenChange(nextOpen);
    }
  };

  // Title
  const dialogTitle = isViewOnly
    ? "Expense Details"
    : isEditing
      ? "Edit Expense"
      : "New Expense";

  const dialogDescription = isViewOnly
    ? "View expense details and receipts"
    : isEditing
      ? expense?.status === "rejected"
        ? "Edit and resubmit this rejected expense"
        : "Update expense details"
      : "Create a new expense entry";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        {/* Rejection note banner */}
        {expense?.status === "rejected" && expense.rejectionNote && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/20">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              Rejection reason:
            </p>
            <p className="text-sm text-red-700 dark:text-red-400">
              {expense.rejectionNote}
            </p>
          </div>
        )}

        {isViewOnly ? (
          // ─── View Mode ─────────────────────────────────────
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-xs">Amount</Label>
                <p className="text-sm font-medium">
                  {expense
                    ? cadFormatter.format(parseFloat(expense.amount))
                    : "-"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Date</Label>
                <p className="text-sm font-medium">
                  {expense
                    ? format(new Date(expense.date), "MMM d, yyyy")
                    : "-"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">
                  Category
                </Label>
                <p className="text-sm font-medium">
                  {expense
                    ? (EXPENSE_CATEGORIES.find(
                        (c) => c.value === expense.category
                      )?.label ?? expense.category)
                    : "-"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Status</Label>
                <p className="text-sm font-medium capitalize">
                  {expense?.status.replace("_", " ") ?? "-"}
                </p>
              </div>
            </div>
            {expense?.description && (
              <div>
                <Label className="text-muted-foreground text-xs">
                  Description
                </Label>
                <p className="text-sm">{expense.description}</p>
              </div>
            )}
            {expense?.isRecurring && (
              <div>
                <Label className="text-muted-foreground text-xs">
                  Recurring
                </Label>
                <p className="text-sm font-medium capitalize">
                  {expense.recurrence ?? "-"}
                </p>
              </div>
            )}
            {expense?.submittedBy && (
              <div>
                <Label className="text-muted-foreground text-xs">
                  Submitted By
                </Label>
                <p className="text-sm font-medium">
                  {expense.submittedBy.firstName} {expense.submittedBy.lastName}
                </p>
              </div>
            )}
            {expense?.approvedBy && (
              <div>
                <Label className="text-muted-foreground text-xs">
                  {expense.status === "approved"
                    ? "Approved By"
                    : "Reviewed By"}
                </Label>
                <p className="text-sm font-medium">
                  {expense.approvedBy.firstName} {expense.approvedBy.lastName}
                </p>
              </div>
            )}

            {/* Receipts */}
            {receipts.length > 0 && (
              <div>
                <Label className="text-muted-foreground text-xs mb-2 block">
                  Receipts ({receipts.length})
                </Label>
                <ExpenseReceiptUpload
                  onFilesSelected={() => {}}
                  existingReceipts={receipts}
                  disabled
                />
              </div>
            )}
          </div>
        ) : (
          // ─── Create / Edit Mode ────────────────────────────
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              {/* Amount + Date row */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (CAD)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            $
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="pl-7"
                            {...field}
                            value={field.value != null ? String(field.value) : ''}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value)
                              )
                            }
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={
                            field.value instanceof Date
                              ? format(field.value, "yyyy-MM-dd")
                              : typeof field.value === "string"
                                ? field.value
                                : ""
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val ? new Date(val + "T00:00:00") : "");
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    {useCustomCategory ? (
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            placeholder="Enter custom category..."
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setUseCustomCategory(false);
                            field.onChange("");
                          }}
                        >
                          Presets
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Select
                          value={field.value || "_none"}
                          onValueChange={(val) => {
                            if (val === "_custom") {
                              setUseCustomCategory(true);
                              field.onChange("");
                            } else if (val === "_none") {
                              field.onChange("");
                            } else {
                              field.onChange(val);
                            }
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="_none" disabled>
                              Select category
                            </SelectItem>
                            {categories.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                            <SelectItem value="_custom">
                              Custom...
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What was this expense for?"
                        rows={2}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Recurring */}
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="isRecurring"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isRecurring"
                          checked={field.value ?? false}
                          onChange={(e) => {
                            field.onChange(e.target.checked);
                            if (!e.target.checked) {
                              form.setValue("recurrence", undefined);
                            }
                          }}
                          className="size-4 rounded border-gray-300"
                        />
                        <Label htmlFor="isRecurring" className="cursor-pointer">
                          This is a recurring expense
                        </Label>
                      </div>
                    </FormItem>
                  )}
                />

                {isRecurring && (
                  <FormField
                    control={form.control}
                    name="recurrence"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequency</FormLabel>
                        <Select
                          value={field.value ?? "_none"}
                          onValueChange={(val) =>
                            field.onChange(val === "_none" ? undefined : val)
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="_none" disabled>
                              Select frequency
                            </SelectItem>
                            {RECURRENCE_FREQUENCIES.map((freq) => (
                              <SelectItem key={freq.value} value={freq.value}>
                                {freq.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Receipt Upload */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Receipts
                </Label>
                <ExpenseReceiptUpload
                  onFilesSelected={handleFilesSelected}
                  pendingFiles={pendingFiles}
                  onRemovePending={handleRemovePending}
                  existingReceipts={receipts}
                  onReceiptDeleted={handleReceiptDeleted}
                />
              </div>

              {/* Footer */}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleClose(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Saving...
                    </>
                  ) : isEditing ? (
                    "Update Expense"
                  ) : (
                    "Create Expense"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {/* View mode footer */}
        {isViewOnly && (
          <DialogFooter>
            <Button variant="outline" onClick={() => handleClose(false)}>
              Close
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
