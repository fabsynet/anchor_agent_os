"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { useUser } from "@/hooks/use-user";
import { SettingsNav } from "@/components/settings/settings-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface EmailSettings {
  id: string;
  tenantId: string;
  birthdayEmailsEnabled: boolean;
  renewalReminder60Days: boolean;
  renewalReminder30Days: boolean;
  renewalReminder7Days: boolean;
  createdAt: string;
  updatedAt: string;
}

// Default settings when no record exists on backend
const DEFAULT_SETTINGS: Omit<EmailSettings, "id" | "tenantId" | "createdAt" | "updatedAt"> = {
  birthdayEmailsEnabled: true,
  renewalReminder60Days: true,
  renewalReminder30Days: true,
  renewalReminder7Days: true,
};

type SettingsKey = keyof typeof DEFAULT_SETTINGS;

export default function CommunicationsSettingsPage() {
  const router = useRouter();
  const { isAdmin, isLoading: isUserLoading } = useUser();
  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingField, setSavingField] = useState<string | null>(null);

  // Redirect non-admin users to profile settings
  useEffect(() => {
    if (!isUserLoading && !isAdmin) {
      router.replace("/settings/profile");
    }
  }, [isAdmin, isUserLoading, router]);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await api.get<EmailSettings>("/api/communications/settings");
      setSettings(data);
    } catch (err) {
      // If 404 or no settings exist, use defaults
      setSettings(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchSettings();
    }
  }, [fetchSettings, isAdmin]);

  const handleToggle = async (field: SettingsKey) => {
    const currentValue = settings
      ? settings[field]
      : DEFAULT_SETTINGS[field];
    const newValue = !currentValue;

    // Optimistic update
    if (settings) {
      setSettings({ ...settings, [field]: newValue });
    }

    setSavingField(field);
    try {
      const updated = await api.patch<EmailSettings>(
        "/api/communications/settings",
        { [field]: newValue }
      );
      setSettings(updated);
      toast.success("Setting updated");
    } catch (err) {
      // Revert optimistic update
      if (settings) {
        setSettings({ ...settings, [field]: currentValue });
      }
      const message =
        err instanceof Error ? err.message : "Failed to update setting";
      toast.error(message);
    } finally {
      setSavingField(null);
    }
  };

  const getValue = (field: SettingsKey): boolean => {
    if (settings) return settings[field];
    return DEFAULT_SETTINGS[field];
  };

  if (isUserLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, team, and public badge page.
        </p>
      </div>

      {/* Settings sub-nav */}
      <SettingsNav />

      {/* Page Title */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Communications Settings
        </h2>
        <p className="text-sm text-muted-foreground">
          Configure automated email notifications sent to your clients.
        </p>
      </div>

      {/* Birthday Emails */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-5" />
            Birthday Emails
          </CardTitle>
          <CardDescription>
            Automatically send a birthday greeting to clients with a birthday
            and email address on file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ToggleRow
            label="Send birthday greeting emails"
            description="Clients will receive an email on their birthday."
            checked={getValue("birthdayEmailsEnabled")}
            saving={savingField === "birthdayEmailsEnabled"}
            onToggle={() => handleToggle("birthdayEmailsEnabled")}
          />
        </CardContent>
      </Card>

      {/* Renewal Reminder Emails */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-5" />
            Renewal Reminder Emails
          </CardTitle>
          <CardDescription>
            Send email reminders to clients before their policy expires.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ToggleRow
            label="60 days before expiry"
            description="Send a reminder 60 days before policy renewal date."
            checked={getValue("renewalReminder60Days")}
            saving={savingField === "renewalReminder60Days"}
            onToggle={() => handleToggle("renewalReminder60Days")}
          />
          <ToggleRow
            label="30 days before expiry"
            description="Send a reminder 30 days before policy renewal date."
            checked={getValue("renewalReminder30Days")}
            saving={savingField === "renewalReminder30Days"}
            onToggle={() => handleToggle("renewalReminder30Days")}
          />
          <ToggleRow
            label="7 days before expiry"
            description="Send an urgent reminder 7 days before policy renewal date."
            checked={getValue("renewalReminder7Days")}
            saving={savingField === "renewalReminder7Days"}
            onToggle={() => handleToggle("renewalReminder7Days")}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  saving,
  onToggle,
}: {
  label: string;
  description: string;
  checked: boolean;
  saving: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        {saving && (
          <Loader2 className="size-3 animate-spin text-muted-foreground" />
        )}
        <button
          onClick={onToggle}
          disabled={saving}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
            checked ? "bg-primary" : "bg-input"
          }`}
          role="switch"
          aria-checked={checked}
          aria-label={label}
        >
          <span
            className={`pointer-events-none block size-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
              checked ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
