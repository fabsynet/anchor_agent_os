"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@anchor/shared";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  async function onSubmit(data: LoginInput) {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      // Detect unverified email — Supabase returns "Email not confirmed"
      if (error.message?.toLowerCase().includes("email not confirmed")) {
        // Resend the verification email automatically
        await supabase.auth.resend({
          type: "signup",
          email: data.email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        toast.info(
          "Your email is not verified yet. A new verification link has been sent to your inbox."
        );
        return;
      }

      toast.error("Invalid email or password");
      return;
    }

    router.push("/");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="jane@smithinsurance.ca"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Password</FormLabel>
                <Link
                  href="/reset-password"
                  className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                    <span className="sr-only">
                      {showPassword ? "Hide password" : "Show password"}
                    </span>
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="mt-2 w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting && (
            <Loader2 className="size-4 animate-spin" />
          )}
          Sign in
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </form>
    </Form>
  );
}
