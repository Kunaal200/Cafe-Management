"use client";

import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Field } from "@/design-system/field";
import { Input } from "@/design-system/input";
import { Button } from "@/design-system/button";
import { apiFetch, ApiError } from "@/lib/api";

interface MenuFormValues {
  categoryName: string;
  items: { name: string; price: number }[];
}

export function MenuStep({
  onComplete,
  onSkip,
}: {
  onComplete: () => void;
  onSkip: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<MenuFormValues>({
    defaultValues: {
      categoryName: "Coffee",
      items: [{ name: "", price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  async function onSubmit(values: MenuFormValues) {
    setFormError(null);
    const items = values.items.filter((i) => i.name.trim().length > 0);
    if (!values.categoryName.trim() || items.length === 0) {
      setFormError("Add a category name and at least one item, or skip this step.");
      return;
    }
    try {
      await apiFetch("/onboarding/menu", {
        method: "POST",
        body: {
          categories: [{ name: values.categoryName, items }],
        },
        auth: true,
      });
      onComplete();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Could not save your menu.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {formError && (
        <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {formError}
        </div>
      )}

      <Field label="Category" htmlFor="categoryName">
        <Input id="categoryName" placeholder="Coffee" {...register("categoryName")} />
      </Field>

      <div className="space-y-2">
        <span className="block text-sm font-medium text-text">Items</span>
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2">
            <Input placeholder="Item name" {...register(`items.${index}.name`)} />
            <Input
              type="number"
              step="0.01"
              placeholder="Price"
              className="w-28"
              {...register(`items.${index}.price`, { valueAsNumber: true })}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(index)}
              disabled={fields.length === 1}
              aria-label="Remove item"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" onClick={() => append({ name: "", price: 0 })}>
          <Plus className="h-4 w-4" />
          Add item
        </Button>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={onSkip}>
          Skip for now
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Continue"}
        </Button>
      </div>
    </form>
  );
}
