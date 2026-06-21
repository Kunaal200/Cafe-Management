"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { localizationSchema, TaxMode, type LocalizationInput } from "@cafe/shared";
import { Field } from "@/design-system/field";
import { Input } from "@/design-system/input";
import { Select } from "@/design-system/select";
import { Combobox } from "@/design-system/combobox";
import { Button } from "@/design-system/button";
import { CURRENCY_OPTIONS, getTimezoneOptions } from "@/lib/locale";
import { apiFetch, ApiError } from "@/lib/api";

const TIMEZONE_OPTIONS = getTimezoneOptions();

export function LocalizationStep({
  outletId,
  defaults,
  onComplete,
  onBack,
}: {
  outletId: string;
  defaults?: LocalizationInput;
  onComplete: (values: LocalizationInput) => void;
  onBack: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LocalizationInput>({
    resolver: zodResolver(localizationSchema),
    defaultValues: defaults ?? { currency: "USD", timezone: "UTC", taxMode: TaxMode.EXCLUSIVE, taxRate: 0 },
  });

  async function onSubmit(values: LocalizationInput) {
    setFormError(null);
    try {
      await apiFetch(`/onboarding/outlets/${outletId}/localization`, {
        method: "POST",
        body: values,
        auth: true,
      });
      onComplete(values);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Could not save tax settings.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {formError && (
        <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {formError}
        </div>
      )}

      <Field label="Currency" htmlFor="currency" error={errors.currency?.message}>
        <Controller
          control={control}
          name="currency"
          render={({ field }) => (
            <Combobox
              id="currency"
              options={CURRENCY_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              placeholder="Select currency"
              searchPlaceholder="Search by country or currency"
              invalid={!!errors.currency}
            />
          )}
        />
      </Field>

      <Field label="Timezone" htmlFor="timezone" error={errors.timezone?.message}>
        <Controller
          control={control}
          name="timezone"
          render={({ field }) => (
            <Combobox
              id="timezone"
              options={TIMEZONE_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              placeholder="Select timezone"
              searchPlaceholder="Search timezones"
              invalid={!!errors.timezone}
            />
          )}
        />
      </Field>

      <Field label="Tax name" htmlFor="taxName" error={errors.taxName?.message}>
        <Input id="taxName" placeholder="GST / VAT / Sales Tax" aria-invalid={!!errors.taxName} {...register("taxName")} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Tax rate (%)" htmlFor="taxRate" error={errors.taxRate?.message}>
          <Input
            id="taxRate"
            type="number"
            step="0.01"
            placeholder="8.5"
            aria-invalid={!!errors.taxRate}
            {...register("taxRate", { valueAsNumber: true })}
          />
        </Field>
        <Field label="Tax mode" htmlFor="taxMode" error={errors.taxMode?.message}>
          <Select id="taxMode" {...register("taxMode")}>
            <option value={TaxMode.EXCLUSIVE}>Added on top (exclusive)</option>
            <option value={TaxMode.INCLUSIVE}>Included in price (inclusive)</option>
          </Select>
        </Field>
      </div>

      <Field label="Tax registration no." htmlFor="taxRegistrationNumber" error={errors.taxRegistrationNumber?.message}>
        <Input id="taxRegistrationNumber" placeholder="Optional (prints on bills)" {...register("taxRegistrationNumber")} />
      </Field>

      <div className="flex gap-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Continue"}
        </Button>
      </div>
    </form>
  );
}
