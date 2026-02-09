import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Start your 14-day free trial
        </p>
      </div>
      <SignupForm />
    </div>
  );
}
