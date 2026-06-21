"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { outletSchema, OrderType, type OutletInput } from "@cafe/shared";
import { Field } from "@/design-system/field";
import { Input } from "@/design-system/input";
import { Checkbox } from "@/design-system/checkbox";
import { CityAutocomplete } from "@/design-system/city-autocomplete";
import { Button } from "@/design-system/button";
import { apiFetch, ApiError } from "@/lib/api";

const serviceTypeOptions = [
  { value: OrderType.DINE_IN, label: "Dine-in" },
  { value: OrderType.TAKEAWAY, label: "Takeaway" },
  { value: OrderType.DELIVERY, label: "Delivery" },
];

export function OutletStep({
  country,
  outletId,
  defaults,
  onComplete,
  onBack,
}: {
  country?: string;
  outletId?: string | null;
  defaults?: OutletInput;
  onComplete: (outletId: string, values: OutletInput) => void;
  onBack: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<OutletInput>({
    resolver: zodResolver(outletSchema),
    defaultValues: defaults ?? { serviceTypes: [OrderType.DINE_IN], city: "" },
  });

  async function onSubmit(values: OutletInput) {
    setFormError(null);
    try {
      if (outletId) {
        // Editing an outlet created earlier — update in place, no duplicate.
        await apiFetch(`/outlets/${outletId}`, {
          method: "PATCH",
          body: { name: values.name, city: values.city, serviceTypes: values.serviceTypes },
          auth: true,
        });
        onComplete(outletId, values);
      } else {
        const outlet = await apiFetch<{ id: string }>("/onboarding/outlet", {
          method: "POST",
          body: values,
          auth: true,
        });
        onComplete(outlet.id, values);
      }
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Could not save your outlet.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {formError && (
        <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {formError}
        </div>
      )}

      <Field label="Outlet name" htmlFor="name" error={errors.name?.message}>
        <Input id="name" placeholder="Main Branch" aria-invalid={!!errors.name} {...register("name")} />
      </Field>

      <Field label="City" htmlFor="city" error={errors.city?.message}>
        <Controller
          control={control}
          name="city"
          render={({ field }) => (
            <CityAutocomplete
              id="city"
              country={country}
              value={field.value ?? ""}
              onChange={field.onChange}
            />
          )}
        />
      </Field>

      <div className="space-y-1.5">
        <span className="block text-sm font-medium text-text">Service types</span>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {serviceTypeOptions.map((o) => (
            <Checkbox key={o.value} label={o.label} value={o.value} {...register("serviceTypes")} />
          ))}
        </div>
        {errors.serviceTypes && (
          <p className="text-sm text-danger">{errors.serviceTypes.message as string}</p>
        )}
      </div>

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
