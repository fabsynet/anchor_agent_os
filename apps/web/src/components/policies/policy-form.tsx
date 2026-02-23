"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import {
  createPolicySchema,
  POLICY_TYPES,
  POLICY_STATUSES,
  COMMON_CARRIERS,
  PAYMENT_FREQUENCIES,
} from "@anchor/shared";
import type { Policy } from "@anchor/shared";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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

/** Use z.input for form types since createPolicySchema has .default() on status */
type PolicyFormValues = z.input<typeof createPolicySchema>;

interface PolicyFormProps {
  clientId: string;
  mode: "create" | "edit";
  defaultValues?: Partial<Policy>;
  policyId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PolicyForm({
  clientId,
  mode,
  defaultValues,
  policyId,
  open,
  onOpenChange,
  onSuccess,
}: PolicyFormProps) {
  // Use createPolicySchema for both modes (edit sends full data).
  // This avoids zodResolver type mismatch between create/update schema union.
  const form = useForm<PolicyFormValues>({
    resolver: zodResolver(createPolicySchema),
    defaultValues: {
      type: defaultValues?.type ?? "auto",
      customType: defaultValues?.customType ?? "",
      carrier: defaultValues?.carrier ?? "",
      policyNumber: defaultValues?.policyNumber ?? "",
      startDate: defaultValues?.startDate ?? "",
      endDate: defaultValues?.endDate ?? "",
      premium: defaultValues?.premium ?? "",
      coverageAmount: defaultValues?.coverageAmount ?? "",
      deductible: defaultValues?.deductible ?? "",
      paymentFrequency: defaultValues?.paymentFrequency ?? undefined,
      brokerCommission: defaultValues?.brokerCommission ?? "",
      status: defaultValues?.status ?? "draft",
      notes: defaultValues?.notes ?? "",
    },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  // Reset form values when dialog opens with new data (edit mode)
  useEffect(() => {
    if (open) {
      form.reset({
        type: defaultValues?.type ?? "auto",
        customType: defaultValues?.customType ?? "",
        carrier: defaultValues?.carrier ?? "",
        policyNumber: defaultValues?.policyNumber ?? "",
        startDate: defaultValues?.startDate ?? "",
        endDate: defaultValues?.endDate ?? "",
        premium: defaultValues?.premium ?? "",
        coverageAmount: defaultValues?.coverageAmount ?? "",
        deductible: defaultValues?.deductible ?? "",
        paymentFrequency: defaultValues?.paymentFrequency ?? undefined,
        brokerCommission: defaultValues?.brokerCommission ?? "",
        status: defaultValues?.status ?? "draft",
        notes: defaultValues?.notes ?? "",
      });
    }
  }, [open, defaultValues, form]);

  const watchedType = form.watch("type");

  async function onSubmit(data: PolicyFormValues) {
    try {
      // Clean empty strings to undefined so API ignores them
      const cleanedData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          value === "" ? undefined : value,
        ])
      );

      if (mode === "create") {
        await api.post(
          `/api/clients/${clientId}/policies`,
          cleanedData
        );
        toast.success("Policy created");
      } else {
        await api.patch(
          `/api/clients/${clientId}/policies/${policyId}`,
          cleanedData
        );
        toast.success("Policy updated");
      }

      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : `Failed to ${mode === "create" ? "create" : "update"} policy`
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add Policy" : "Edit Policy"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new policy for this client."
              : "Update the policy details."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Row 1: Type + Carrier */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {POLICY_TYPES.map((pt) => (
                          <SelectItem key={pt.value} value={pt.value}>
                            {pt.label}
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
                name="carrier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carrier</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Start typing..."
                        list="carrier-suggestions"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <datalist id="carrier-suggestions">
                      {COMMON_CARRIERS.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Custom type (shown when type is "other") */}
            {watchedType === "other" && (
              <FormField
                control={form.control}
                name="customType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Type</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Describe the policy type"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Row 2: Policy Number + Status */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="policyNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Policy Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="POL-001234"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {POLICY_STATUSES.map((ps) => (
                          <SelectItem key={ps.value} value={ps.value}>
                            {ps.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 3: Start Date + End Date */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
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
                    <FormLabel>End Date / Expiry</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 4: Premium + Coverage Amount */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="premium"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Premium ($)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0.00"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="coverageAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coverage Amount ($)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0.00"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 5: Deductible + Payment Frequency */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="deductible"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deductible ($)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0.00"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Frequency</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYMENT_FREQUENCIES.map((pf) => (
                          <SelectItem key={pf.value} value={pf.value}>
                            {pf.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 6: Broker Commission */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="brokerCommission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Broker Commission (%)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0.00"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 7: Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Policy-specific notes..."
                      rows={3}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {mode === "create" ? "Add Policy" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
