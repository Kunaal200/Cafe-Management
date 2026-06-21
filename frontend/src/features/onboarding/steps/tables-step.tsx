"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Field } from "@/design-system/field";
import { Input } from "@/design-system/input";
import { Button } from "@/design-system/button";
import { apiFetch, ApiError } from "@/lib/api";

interface TablesFormValues {
  count: number;
  area?: string;
}

export function TablesStep({
  outletId,
  onComplete,
  onSkip,
  onBack,
}: {
  outletId: string;
  onComplete: () => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<TablesFormValues>({ defaultValues: { count: 4 } });

  async function onSubmit(values: TablesFormValues) {
    setFormError(null);
    try {
      await apiFetch(`/onboarding/outlets/${outletId}/tables`, {
        method: "POST",
        body: { count: values.count, area: values.area || undefined },
        auth: true,
      });
      onComplete();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Could not create tables.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {formError && (
        <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {formError}
        </div>
      )}

      <p className="text-sm text-muted">
        We&apos;ll auto-create tables named T1, T2, … You can edit them later.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Number of tables" htmlFor="count">
          <Input id="count" type="number" min={1} max={200} {...register("count", { valueAsNumber: true })} />
        </Field>
        <Field label="Area" htmlFor="area">
          <Input id="area" placeholder="Indoor (optional)" {...register("area")} />
        </Field>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button type="button" variant="ghost" className="flex-1" onClick={onSkip}>
          Skip for now
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? "Creating…" : "Continue"}
        </Button>
      </div>
    </form>
  );
}
