'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { createBudgetSchema, type CreateBudgetInput } from '@anchor/shared';
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

import type { Budget } from '@anchor/shared';

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

  const form = useForm<CreateBudgetInput>({
    resolver: zodResolver(createBudgetSchema),
    defaultValues: {
      name: budget?.name ?? '',
      totalLimit: budget ? Number(budget.totalLimit) : undefined,
      startDate: undefined,
      endDate: undefined,
    },
  });

  // Reset form when dialog opens with different budget
  useEffect(() => {
    if (open) {
      form.reset({
        name: budget?.name ?? '',
        totalLimit: budget ? Number(budget.totalLimit) : undefined,
        startDate: budget?.startDate
          ? new Date(budget.startDate)
          : undefined,
        endDate: budget?.endDate ? new Date(budget.endDate) : undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, budget?.id]);

  async function onSubmit(data: CreateBudgetInput) {
    try {
      const payload = {
        name: data.name,
        totalLimit: data.totalLimit,
        startDate: data.startDate
          ? data.startDate instanceof Date
            ? data.startDate.toISOString()
            : data.startDate
          : undefined,
        endDate: data.endDate
          ? data.endDate instanceof Date
            ? data.endDate.toISOString()
            : data.endDate
          : undefined,
      };

      if (isEditing) {
        await api.patch(`/api/budgets/${budget.id}`, payload);
        toast.success('Budget updated successfully');
      } else {
        await api.post('/api/budgets', payload);
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Budget' : 'Create Budget'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the budget details.'
              : 'Create a new budget with an overall spending limit.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Budget Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Q1 Marketing, Monthly Operations"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Overall Limit */}
            <FormField
              control={form.control}
              name="totalLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Spending Limit (CAD)</FormLabel>
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

            {/* Date Range (optional) */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={
                          field.value instanceof Date
                            ? format(field.value, 'yyyy-MM-dd')
                            : typeof field.value === 'string'
                              ? field.value
                              : ''
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(
                            val ? new Date(val + 'T00:00:00') : undefined
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={
                          field.value instanceof Date
                            ? format(field.value, 'yyyy-MM-dd')
                            : typeof field.value === 'string'
                              ? field.value
                              : ''
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(
                            val ? new Date(val + 'T00:00:00') : undefined
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
