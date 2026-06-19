import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Full-width progress indicator. The active step label is emphasized. */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex w-full items-center">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  done && "bg-primary text-primary-fg",
                  active && "border-2 border-primary bg-surface text-primary",
                  !done && !active && "border border-border bg-surface text-muted",
                )}
              >
                {done ? <Check className="h-5 w-5" /> : i + 1}
              </span>
              <span
                className={cn(
                  "whitespace-nowrap text-center transition-all",
                  active ? "text-base font-semibold text-primary" : "text-xs font-medium text-muted",
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                className={cn(
                  "mx-2 mb-6 h-0.5 flex-1 rounded-full transition-colors",
                  i < current ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
