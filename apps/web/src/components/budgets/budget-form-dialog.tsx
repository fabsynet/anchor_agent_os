'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { createBudgetSchema, type CreateBudgetInput } from '@anchor/shared';
import { EXPENSE_CATEGORIES } from '@anchor/shared';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { Budget } from '@anchor/shared';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
] as const;

interface BudgetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget?: Budget;
  onSaved: () => void;
}

export function BudgetFormDialog({
  open,
  onOpenChange,
  budget,
  onSaved,
}: BudgetFormDialogProps) {
  const isEditing = !!budget;
  const now = new Date();

  const currentYear = now.getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  const form = useForm<CreateBudgetInput>({
    resolver: zodResolver(createBudgetSchema),
    defaultValues: {
      month: budget?.month ?? now.getMonth() + 1,
      year: budget?.year ?? currentYear,
      totalLimit: budget ? Number(budget.totalLimit) : undefined,
      categories: budget?.categories?.map((c) => ({
        category: c.category,
        limitAmount: Number(c.limitAmount),
      })) ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'categories',
  });

  // Reset form when dialog opens with different budget
  useEffect(() => {
    if (open) {
      form.reset({
        month: budget?.month ?? now.getMonth() + 1,
        year: budget?.year ?? currentYear,
        totalLimit: budget ? Number(budget.totalLimit) : undefined,
        categories: budget?.categories?.map((c) => ({
          category: c.category,
          limitAmount: Number(c.limitAmount),
        })) ?? [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, budget?.id]);

  // Get categories already used in form to filter them out of dropdown
  const usedCategories = form.watch('categories')?.map((c) => c.category) ?? [];
  const availableCategories = EXPENSE_CATEGORIES.filter(
    (cat) => !usedCategories.includes(cat.value)
  );

  async function onSubmit(data: CreateBudgetInput) {
    try {
      if (isEditing) {
        await api.patch(`/api/budgets/${budget.id}`, {
          totalLimit: data.totalLimit,
          categories: data.categories,
        });
        toast.success('Budget updated successfully');
      } else {
        await api.post('/api/budgets', data);
        toast.success('Budget created successfully');
      }
      onSaved();
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save budget';
      toast.error(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Budget' : 'Create Budget'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the monthly budget limits.'
              : 'Set up a new monthly budget with optional per-category limits.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Month and Year */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Month</FormLabel>
                    <Select
                      value={String(field.value)}
                      onValueChange={(val) => field.onChange(Number(val))}
                      disabled={isEditing}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MONTHS.map((m) => (
                          <SelectItem key={m.value} value={String(m.value)}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <Select
                      value={String(field.value)}
                      onValueChange={(val) => field.onChange(Number(val))}
                      disabled={isEditing}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {yearOptions.map((y) => (
                          <SelectItem key={y} value={String(y)}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Overall Monthly Limit */}
            <FormField
              control={form.control}
              name="totalLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Overall Monthly Limit (CAD)</FormLabel>
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
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === '' ? undefined : Number(val));
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Per-Category Limits */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Per-Category Limits (Optional)
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ category: '', limitAmount: 0 })}
                  disabled={availableCategories.length === 0}
                >
                  <Plus className="size-4" />
                  Add Category
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2">
                  <FormField
                    control={form.control}
                    name={`categories.${index}.category`}
                    render={({ field: catField }) => (
                      <FormItem className="flex-1">
                        <Select
                          value={catField.value || '_none'}
                          onValueChange={(val) =>
                            catField.onChange(val === '_none' ? '' : val)
                          }
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
                            {EXPENSE_CATEGORIES.filter(
                              (cat) =>
                                cat.value === catField.value ||
                                !usedCategories.includes(cat.value)
                            ).map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`categories.${index}.limitAmount`}
                    render={({ field: amtField }) => (
                      <FormItem className="w-32">
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
                              {...amtField}
                              value={amtField.value != null ? String(amtField.value) : ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                amtField.onChange(
                                  val === '' ? 0 : Number(val)
                                );
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-0 shrink-0"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}

              {fields.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No per-category limits set. Only the overall limit will apply.
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                {isEditing ? 'Update Budget' : 'Create Budget'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
