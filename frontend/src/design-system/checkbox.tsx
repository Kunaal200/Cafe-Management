import * as React from "react";
import { cn } from "@/lib/utils";

/** Checkbox with a label, used for multi-select option groups. */
export const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string }
>(({ className, label, ...props }, ref) => (
  <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text hover:bg-surface-muted">
    <input
      ref={ref}
      type="checkbox"
      className={cn("h-4 w-4 rounded border-border text-primary focus:ring-primary", className)}
      {...props}
    />
    {label}
  </label>
));
Checkbox.displayName = "Checkbox";
