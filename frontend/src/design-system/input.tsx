import * as React from "react";
import { cn } from "@/lib/utils";

/** Text input primitive. Reads tokens so it stays consistent everywhere. */
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text",
        "placeholder:text-muted/70",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
