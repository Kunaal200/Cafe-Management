import * as React from "react";
import { cn } from "@/lib/utils";

/** Centered max-width content wrapper with consistent horizontal gutters. */
export function Container({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8", className)} {...props} />;
}

/** Vertical page section with consistent block spacing. */
export function Section({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return <section className={cn("py-16 sm:py-20 lg:py-24", className)} {...props} />;
}
