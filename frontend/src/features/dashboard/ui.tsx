"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Page title + optional action area, used at the top of every dashboard screen. */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Bordered surface card. */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl border border-border bg-surface p-5", className)}
      {...props}
    />
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin text-muted", className)} />;
}

/** Unified loading / error / empty state for data-backed sections. */
export function StateBlock({
  loading,
  error,
  empty,
  emptyText = "Nothing here yet.",
  children,
}: {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyText?: string;
  children: React.ReactNode;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
        <Spinner /> Loading…
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
        {error}
      </div>
    );
  }
  if (empty) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 py-16 text-center">
        <p className="text-sm font-medium text-text">{emptyText}</p>
      </div>
    );
  }
  return <>{children}</>;
}
