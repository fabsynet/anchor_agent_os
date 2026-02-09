import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your Anchor account
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
