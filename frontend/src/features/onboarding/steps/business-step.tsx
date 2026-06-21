"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  businessDetailsSchema,
  BusinessType,
  type BusinessDetailsInput,
} from "@cafe/shared";
import { Field } from "@/design-system/field";
import { Input } from "@/design-system/input";
import { Select } from "@/design-system/select";
import { Combobox } from "@/design-system/combobox";
import { Button } from "@/design-system/button";
import { COUNTRY_OPTIONS, countryName } from "@/lib/locale";
import { apiFetch, ApiError } from "@/lib/api";
import { setTokens, type TokenPair } from "@/lib/auth";

const businessTypeOptions: { value: string; label: string }[] = [
  { value: BusinessType.CAFE, label: "Café" },
  { value: BusinessType.FINE_DINE, label: "Fine dining" },
  { value: BusinessType.QSR, label: "Quick-service" },
  { value: BusinessType.BAR, label: "Bar" },
  { value: BusinessType.CLOUD_KITCHEN, label: "Cloud kitchen" },
  { value: BusinessType.BAKERY, label: "Bakery" },
];

export function BusinessStep({
  defaults,
  onComplete,
}: {
  defaults?: BusinessDetailsInput;
  onComplete: (country: string, values: BusinessDetailsInput) => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BusinessDetailsInput>({
    resolver: zodResolver(businessDetailsSchema),
    defaultValues: defaults ?? { businessType: BusinessType.CAFE },
  });

  const editing = !!defaults;

  async function onSubmit(values: BusinessDetailsInput) {
    setFormError(null);
    try {
      // Only check availability for a new workspace name (skip when unchanged
      // during an edit, since it would report your own name as "taken").
      if (!editing || values.subdomain !== defaults?.subdomain) {
        const { available } = await apiFetch<{ available: boolean }>(
          `/onboarding/check-subdomain?subdomain=${encodeURIComponent(values.subdomain)}`,
          { auth: true },
        );
        if (!available) {
          setError("subdomain", { message: "That workspace name is taken" });
          return;
        }
      }

      const res = await apiFetch<{ tenantId: string; tokens: TokenPair }>(
        "/onboarding/business",
        { method: "POST", body: values, auth: true },
      );
      // The new token carries the tenant id — required by every later step.
      setTokens(res.tokens);
      onComplete(countryName(values.country), values);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Could not save your business.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {formError && (
        <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {formError}
        </div>
      )}

      <Field label="Business name" htmlFor="businessName" error={errors.businessName?.message}>
        <Input id="businessName" placeholder="Brew & Bite Café" aria-invalid={!!errors.businessName} {...register("businessName")} />
      </Field>

      <Field label="Business type" htmlFor="businessType" error={errors.businessType?.message}>
        <Select id="businessType" aria-invalid={!!errors.businessType} {...register("businessType")}>
          {businessTypeOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Country" htmlFor="country" error={errors.country?.message}>
        <Controller
          control={control}
          name="country"
          render={({ field }) => (
            <Combobox
              id="country"
              options={COUNTRY_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              placeholder="Select your country"
              searchPlaceholder="Search countries"
              invalid={!!errors.country}
            />
          )}
        />
      </Field>

      <Field label="Workspace name" htmlFor="subdomain" error={errors.subdomain?.message}>
        <Input id="subdomain" placeholder="brewbite" aria-invalid={!!errors.subdomain} {...register("subdomain")} />
        <p className="text-xs text-muted">Lowercase letters, numbers, and hyphens. Used for your workspace URL.</p>
      </Field>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : editing ? "Save & continue" : "Continue"}
      </Button>
    </form>
  );
}
