"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createTaskSchema,
  TASK_STATUSES,
  TASK_PRIORITIES,
} from "@anchor/shared";
import type {
  TaskWithRelations,
  CreateTaskInput,
} from "@anchor/shared";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface TaskFormProps {
  open: boolean;
  task: TaskWithRelations | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface Assignee {
  id: string;
  firstName: string;
  lastName: string;
}

interface ClientOption {
  id: string;
  firstName: string;
  lastName: string;
}

interface PolicyOption {
  id: string;
  type: string;
  carrier: string | null;
  policyNumber: string | null;
}

interface ClientListResponse {
  data: ClientOption[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Strip empty strings to undefined before sending to API
function cleanFormData(data: CreateTaskInput): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === "" || value === undefined) {
      // skip -- don't send empty strings for optional UUID fields
      continue;
    }
    cleaned[key] = value;
  }
  return cleaned;
}

export function TaskForm({ open, task, onClose, onSuccess }: TaskFormProps) {
  const isEditing = !!task;
  const isRenewal = task?.type === "renewal";

  const [submitting, setSubmitting] = useState(false);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [policies, setPolicies] = useState<PolicyOption[]>([]);
  const [loadingAssignees, setLoadingAssignees] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingPolicies, setLoadingPolicies] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      dueDate: "",
      assigneeId: "",
      clientId: "",
      policyId: "",
    },
  });

  const watchedClientId = watch("clientId");

  // Reset form when dialog opens/closes or task changes
  useEffect(() => {
    if (open && task) {
      reset({
        title: task.title,
        description: task.description ?? "",
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
        assigneeId: task.assigneeId ?? "",
        clientId: task.clientId ?? "",
        policyId: task.policyId ?? "",
      });
    } else if (open) {
      reset({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        dueDate: "",
        assigneeId: "",
        clientId: "",
        policyId: "",
      });
    }
  }, [open, task, reset]);

  // Fetch assignees when dialog opens
  useEffect(() => {
    if (!open) return;
    setLoadingAssignees(true);
    api
      .get<Assignee[]>("/api/tasks/assignees")
      .then(setAssignees)
      .catch(() => toast.error("Failed to load assignees"))
      .finally(() => setLoadingAssignees(false));
  }, [open]);

  // Fetch clients when dialog opens
  useEffect(() => {
    if (!open) return;
    setLoadingClients(true);
    api
      .get<ClientListResponse>("/api/clients?limit=100")
      .then((res) => setClients(res.data))
      .catch(() => toast.error("Failed to load clients"))
      .finally(() => setLoadingClients(false));
  }, [open]);

  // Fetch policies when client changes
  useEffect(() => {
    if (!watchedClientId || watchedClientId === "") {
      setPolicies([]);
      return;
    }
    setLoadingPolicies(true);
    api
      .get<PolicyOption[]>(`/api/clients/${watchedClientId}/policies`)
      .then(setPolicies)
      .catch(() => {
        setPolicies([]);
      })
      .finally(() => setLoadingPolicies(false));
  }, [watchedClientId]);

  const onSubmit = async (data: CreateTaskInput) => {
    setSubmitting(true);
    try {
      const cleaned = cleanFormData(data);
      if (isEditing) {
        await api.patch(`/api/tasks/${task.id}`, cleaned);
        toast.success("Task updated");
      } else {
        await api.post("/api/tasks", cleaned);
        toast.success("Task created");
      }
      onSuccess();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save task"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? isRenewal
                ? "Update Renewal Task"
                : "Edit Task"
              : "New Task"}
          </DialogTitle>
          <DialogDescription>
            {isRenewal
              ? "This is an auto-generated renewal task. Only the status can be changed."
              : isEditing
              ? "Update the task details below."
              : "Fill in the details to create a new task."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Task title"
              disabled={isRenewal}
              {...register("title")}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional description"
              rows={3}
              disabled={isRenewal}
              {...register("description")}
            />
          </div>

          {/* Status + Priority row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={watch("status")}
                onValueChange={(v) => setValue("status", v as CreateTaskInput["status"])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={watch("priority")}
                onValueChange={(v) => setValue("priority", v as CreateTaskInput["priority"])}
                disabled={isRenewal}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              disabled={isRenewal}
              {...register("dueDate")}
            />
          </div>

          {/* Assignee */}
          <div className="space-y-2">
            <Label>Assignee</Label>
            <Select
              value={watch("assigneeId") || ""}
              onValueChange={(v) => setValue("assigneeId", v === "_none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingAssignees ? "Loading..." : "Select assignee"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Unassigned</SelectItem>
                {assignees.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.firstName} {a.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Client */}
          <div className="space-y-2">
            <Label>Client</Label>
            <Select
              value={watch("clientId") || ""}
              onValueChange={(v) => {
                const newClientId = v === "_none" ? "" : v;
                setValue("clientId", newClientId);
                // Reset policy when client changes
                setValue("policyId", "");
                setPolicies([]);
              }}
              disabled={isRenewal}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingClients ? "Loading..." : "Select client"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">No client</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Policy (only shown when client is selected) */}
          {watchedClientId && watchedClientId !== "" && (
            <div className="space-y-2">
              <Label>Policy</Label>
              <Select
                value={watch("policyId") || ""}
                onValueChange={(v) => setValue("policyId", v === "_none" ? "" : v)}
                disabled={isRenewal || loadingPolicies}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingPolicies
                        ? "Loading policies..."
                        : policies.length === 0
                        ? "No policies for this client"
                        : "Select policy"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">No policy</SelectItem>
                  {policies.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.type}
                      {p.policyNumber ? ` - ${p.policyNumber}` : ""}
                      {p.carrier ? ` (${p.carrier})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {isEditing ? "Update Task" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
