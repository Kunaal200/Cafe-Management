"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/** Compact quantity control. Clamps between min (default 1) and max (default 99). */
export function QtyStepper({
  value,
  onChange,
  disabled,
  min = 1,
  max = 99,
}: {
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
}) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border border-border",
        disabled && "opacity-50",
      )}
    >
      <button
        type="button"
        onClick={dec}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
        className="flex h-8 w-8 items-center justify-center text-muted hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="min-w-8 text-center text-sm font-medium text-text">{value}</span>
      <button
        type="button"
        onClick={inc}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
        className="flex h-8 w-8 items-center justify-center text-muted hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
