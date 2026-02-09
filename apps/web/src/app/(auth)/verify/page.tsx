import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyPage() {
  return (
    <div className="grid gap-6 text-center">
      <div className="flex justify-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
          <Mail className="size-8 text-primary" />
        </div>
      </div>
      <div className="grid gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Check your email
        </h1>
        <p className="text-sm text-muted-foreground">
          We&apos;ve sent a verification link to your email address. Click the
          link to verify your account and get started.
        </p>
      </div>
      <Button variant="outline" asChild>
        <Link href="/login">Back to login</Link>
      </Button>
    </div>
  );
}
