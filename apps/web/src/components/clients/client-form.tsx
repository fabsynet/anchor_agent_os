"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import {
  createClientSchema,
  CANADIAN_PROVINCES,
  type CreateClientInput,
} from "@anchor/shared";

import { api } from "@/lib/api";

/** Input type for the form (status is optional because of .default()) */
type ClientFormValues = z.input<typeof createClientSchema>;
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { Client } from "@anchor/shared";

interface ClientFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<ClientFormValues>;
  clientId?: string;
  onSuccess?: () => void;
}

export function ClientForm({
  mode,
  defaultValues,
  clientId,
  onSuccess,
}: ClientFormProps) {
  const router = useRouter();

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      firstName: defaultValues?.firstName ?? "",
      lastName: defaultValues?.lastName ?? "",
      email: defaultValues?.email ?? "",
      phone: defaultValues?.phone ?? "",
      status: defaultValues?.status ?? "lead",
      address: defaultValues?.address ?? "",
      city: defaultValues?.city ?? "",
      province: defaultValues?.province ?? "",
      postalCode: defaultValues?.postalCode ?? "",
      dateOfBirth: defaultValues?.dateOfBirth ?? "",
    },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const watchedStatus = form.watch("status");
  const isClient = watchedStatus === "client";

  async function onSubmit(data: ClientFormValues) {
    // Strip empty strings so optional fields aren't sent as "" to the API
    const cleaned = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== "")
    );
    try {
      if (mode === "create") {
        const result = await api.post<Client>("/api/clients", cleaned);
        toast.success("Client created");
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/clients/${result.id}`);
        }
      } else {
        await api.patch<Client>(`/api/clients/${clientId}`, cleaned);
        toast.success("Client updated");
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/clients/${clientId}`);
        }
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : `Failed to ${mode === "create" ? "create" : "update"} client`
      );
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Status selector */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                {isClient
                  ? "Full contact details required for clients."
                  : "Leads require just a name and either email or phone."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Basic info */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last name</FormLabel>
                  <FormControl>
                    <Input placeholder="Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Email{" "}
                    {!isClient && (
                      <span className="text-muted-foreground font-normal">
                        (or phone required)
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="jane@example.ca"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Phone{" "}
                    {!isClient && (
                      <span className="text-muted-foreground font-normal">
                        (or email required)
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="(416) 555-0123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Full details (required for clients) */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Contact Details{" "}
            {isClient ? (
              <span className="text-destructive">*</span>
            ) : (
              <span>(optional for leads)</span>
            )}
          </h3>
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="123 Main St" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="Toronto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="province"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Province</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select province" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CANADIAN_PROVINCES.map((prov) => (
                        <SelectItem key={prov.value} value={prov.value}>
                          {prov.label}
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
              name="postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postal code</FormLabel>
                  <FormControl>
                    <Input placeholder="M5V 2T6" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of birth</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting && (
              <Loader2 className="size-4 animate-spin" />
            )}
            {mode === "create" ? "Create" : "Save Changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
