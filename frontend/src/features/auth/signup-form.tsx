"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signupSchema, verifyOtpSchema, type VerifyOtpInput } from "@cafe/shared";
import { Field } from "@/design-system/field";
import { Input } from "@/design-system/input";
import { PasswordInput } from "@/design-system/password-input";
import { PhoneInput } from "@/design-system/phone-input";
import { Button } from "@/design-system/button";
import { apiFetch, ApiError } from "@/lib/api";
import { setTokens, type TokenPair } from "@/lib/auth";

// Extend the shared signup schema with a confirm-password field (client-only).
const signupFormSchema = signupSchema
  .extend({ confirmPassword: z.string().min(1, "Please confirm your password") })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
type SignupFormValues = z.infer<typeof signupFormSchema>;

/** Step 1: collect account details and request an OTP. */
function AccountStep({ onSent }: { onSent: (email: string) => void }) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({ resolver: zodResolver(signupFormSchema) });

  async function onSubmit(values: SignupFormValues) {
    setFormError(null);
    try {
      // Drop the client-only confirmPassword before sending.
      const { confirmPassword: _confirm, ...payload } = values;
      void _confirm;
      await apiFetch<{ userId: string }>("/auth/signup", { method: "POST", body: payload });
      onSent(values.email);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Signup failed. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {formError && (
        <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {formError}
        </div>
      )}

      <Field label="Full name" htmlFor="fullName" error={errors.fullName?.message}>
        <Input id="fullName" placeholder="Alex Owner" aria-invalid={!!errors.fullName} {...register("fullName")} />
      </Field>

      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" placeholder="you@cafe.com" aria-invalid={!!errors.email} {...register("email")} />
      </Field>

      <Field label="Phone" htmlFor="phone" error={errors.phone?.message}>
        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <PhoneInput value={field.value} onChange={field.onChange} invalid={!!errors.phone} />
          )}
        />
      </Field>

      <Field label="Password" htmlFor="password" error={errors.password?.message}>
        <PasswordInput id="password" autoComplete="new-password" placeholder="At least 8 characters" aria-invalid={!!errors.password} {...register("password")} />
      </Field>

      <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
        <PasswordInput id="confirmPassword" autoComplete="new-password" placeholder="Re-enter password" aria-invalid={!!errors.confirmPassword} {...register("confirmPassword")} />
      </Field>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}

/** Step 2: verify the OTP, store tokens, and continue. */
function OtpStep({ email }: { email: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyOtpInput>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { email },
  });

  async function onSubmit(values: VerifyOtpInput) {
    setFormError(null);
    try {
      const tokens = await apiFetch<TokenPair>("/auth/verify-otp", { method: "POST", body: values });
      setTokens(tokens);
      router.push("/dashboard");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Verification failed. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <p className="text-sm text-muted">
        We sent a 6-digit code to <span className="font-medium text-text">{email}</span>.
      </p>

      {formError && (
        <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {formError}
        </div>
      )}
      {resent && (
        <div className="rounded-md border border-info/30 bg-info/10 px-3 py-2 text-sm text-info">
          In development, the code is printed in the API server logs.
        </div>
      )}

      <input type="hidden" {...register("email")} />

      <Field label="Verification code" htmlFor="code" error={errors.code?.message}>
        <Input
          id="code"
          inputMode="numeric"
          maxLength={6}
          placeholder="123456"
          aria-invalid={!!errors.code}
          {...register("code")}
        />
      </Field>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Verifying…" : "Verify & continue"}
      </Button>

      <button
        type="button"
        onClick={() => setResent(true)}
        className="w-full text-center text-sm text-muted hover:text-text"
      >
        Didn&apos;t get the code?
      </button>
    </form>
  );
}

export function SignupForm() {
  const [email, setEmail] = useState<string | null>(null);
  return email ? <OtpStep email={email} /> : <AccountStep onSent={setEmail} />;
}
