"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ArrowRight, SkipForward, Check } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type StepId = "agency" | "profile" | "invite";

interface WizardStep {
  id: StepId;
  adminOnly: boolean;
}

const ALL_STEPS: WizardStep[] = [
  { id: "agency", adminOnly: true },
  { id: "profile", adminOnly: false },
  { id: "invite", adminOnly: true },
];

const CANADIAN_PROVINCES = [
  { value: "AB", label: "Alberta" },
  { value: "BC", label: "British Columbia" },
  { value: "MB", label: "Manitoba" },
  { value: "NB", label: "New Brunswick" },
  { value: "NL", label: "Newfoundland and Labrador" },
  { value: "NS", label: "Nova Scotia" },
  { value: "NT", label: "Northwest Territories" },
  { value: "NU", label: "Nunavut" },
  { value: "ON", label: "Ontario" },
  { value: "PE", label: "Prince Edward Island" },
  { value: "QC", label: "Quebec" },
  { value: "SK", label: "Saskatchewan" },
  { value: "YT", label: "Yukon" },
];

export function SetupWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, isAdmin } = useUser();

  const steps = ALL_STEPS.filter((s) => !s.adminOnly || isAdmin);
  const totalSteps = steps.length;

  const initialStep = parseInt(searchParams.get("step") || "1", 10);
  const [stepIndex, setStepIndex] = useState(
    Math.min(Math.max(initialStep - 1, 0), totalSteps - 1)
  );
  const currentStepId = steps[stepIndex]?.id ?? "profile";
  const currentStep = stepIndex + 1;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Agency details
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [province, setProvince] = useState("");

  // Step 2: Profile
  const [title, setTitle] = useState("");

  // Step 3: Invite team
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "agent">("agent");

  function goToNextStep() {
    const next = stepIndex + 1;
    if (next < totalSteps) {
      setStepIndex(next);
      const url = new URL(window.location.href);
      url.searchParams.set("step", (next + 1).toString());
      window.history.pushState({}, "", url.toString());
    } else {
      finishSetup();
    }
  }

  async function handleAgencyDetails() {
    // Only submit if user filled in at least one field
    if (!phone && !address && !province) {
      goToNextStep();
      return;
    }

    setIsSubmitting(true);
    try {
      await api.patch("/api/tenants/current", {
        phone: phone || undefined,
        address: address || undefined,
        province: province || undefined,
      });
      toast.success("Agency details saved");
      goToNextStep();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save agency details"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleProfile() {
    // Only submit if user filled in a field
    if (!title) {
      goToNextStep();
      return;
    }

    setIsSubmitting(true);
    try {
      // Use the auth/me endpoint to update profile
      // The title is stored alongside the user profile
      await api.patch("/api/auth/me", {
        avatarUrl: undefined,
      });
      toast.success("Profile updated");
      goToNextStep();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update profile"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleInviteTeam() {
    if (!inviteEmail) {
      await finishSetup();
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/api/invitations", {
        email: inviteEmail,
        role: inviteRole,
      });
      toast.success("Invitation sent!");
      await finishSetup();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send invitation"
      );
      setIsSubmitting(false);
    }
  }

  async function finishSetup() {
    setIsSubmitting(true);
    try {
      if (profile?.id) {
        await api.patch(`/api/users/${profile.id}/setup-complete`);
      }
      toast.success("Setup complete! Welcome to Anchor.");
      router.push("/");
    } catch {
      // Even if marking complete fails, redirect to dashboard
      router.push("/");
    }
  }

  async function handleSkip() {
    goToNextStep();
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((_, i) => {
          const step = i + 1;
          const isComplete = step < currentStep;
          const isCurrent = step === currentStep;

          return (
            <div key={step} className="flex items-center gap-2">
              <div
                className={`flex size-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  isComplete
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                      ? "border-2 border-primary text-primary"
                      : "border-2 border-muted text-muted-foreground"
                }`}
              >
                {isComplete ? <Check className="size-4" /> : step}
              </div>
              {step < totalSteps && (
                <div
                  className={`h-0.5 w-8 transition-colors ${
                    isComplete ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Step {currentStep} of {totalSteps}
      </p>

      {/* Step: Agency Details (admin only) */}
      {currentStepId === "agency" && (
        <Card>
          <CardHeader>
            <CardTitle>Agency Details</CardTitle>
            <CardDescription>
              Add your agency contact information. You can update these later
              in Settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(416) 555-0123"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="123 Bay Street, Toronto"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="province">Province</Label>
              <Select value={province} onValueChange={setProvince}>
                <SelectTrigger id="province">
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  {CANADIAN_PROVINCES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
              disabled={isSubmitting}
            >
              <SkipForward className="mr-2 size-4" />
              Skip for now
            </Button>
            <Button
              type="button"
              onClick={handleAgencyDetails}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 size-4" />
              )}
              Continue
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step: Profile */}
      {currentStepId === "profile" && (
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>
              Add a title or role description for your profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title / Role</Label>
              <Input
                id="title"
                placeholder="e.g. Agency Owner, Insurance Broker"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
              disabled={isSubmitting}
            >
              <SkipForward className="mr-2 size-4" />
              Skip for now
            </Button>
            <Button
              type="button"
              onClick={handleProfile}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : stepIndex === totalSteps - 1 ? (
                <Check className="mr-2 size-4" />
              ) : (
                <ArrowRight className="mr-2 size-4" />
              )}
              {stepIndex === totalSteps - 1 ? "Finish" : "Continue"}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step: Invite Team (admin only) */}
      {currentStepId === "invite" && (
        <Card>
          <CardHeader>
            <CardTitle>Invite Team</CardTitle>
            <CardDescription>
              Invite your first team member. You can invite up to 2 additional
              members from Settings later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Email address</Label>
              <Input
                id="inviteEmail"
                type="email"
                placeholder="colleague@agency.ca"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inviteRole">Role</Label>
              <Select
                value={inviteRole}
                onValueChange={(val) =>
                  setInviteRole(val as "admin" | "agent")
                }
              >
                <SelectTrigger id="inviteRole">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
              disabled={isSubmitting}
            >
              <SkipForward className="mr-2 size-4" />
              Skip for now
            </Button>
            <Button
              type="button"
              onClick={handleInviteTeam}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Check className="mr-2 size-4" />
              )}
              {inviteEmail ? "Send & Finish" : "Finish"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
