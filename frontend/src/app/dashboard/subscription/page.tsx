"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { PageHeader, Card, StateBlock } from "@/features/dashboard/ui";
import { Button } from "@/design-system/button";
import { Badge } from "@/design-system/badge";
import { useApi } from "@/lib/use-api";
import { apiFetch, ApiError } from "@/lib/api";
import type { Subscription } from "@/lib/types";
import { humanize } from "@/lib/format";
import { cn } from "@/lib/utils";

const PLANS = [
  { id: "starter", name: "Starter", monthly: 0, features: ["1 outlet", "POS & orders", "Basic menu"] },
  { id: "growth", name: "Growth", monthly: 29, features: ["Up to 3 outlets", "Tables & KDS", "Staff roles"] },
  { id: "pro", name: "Pro", monthly: 79, features: ["Unlimited outlets", "Analytics", "Priority support"] },
];

export default function SubscriptionPage() {
  const { data, error, loading, refetch } = useApi<Subscription>("/subscription");
  const [cycle, setCycle] = useState<"monthly" | "annual">("monthly");
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const sub = data;

  async function changePlan(plan: string) {
    setBusy(plan);
    setActionError(null);
    try {
      await apiFetch("/subscription", {
        method: "PATCH",
        body: { plan, billingCycle: cycle },
        auth: true,
      });
      refetch();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not change plan.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <PageHeader title="Subscription" subtitle="Manage your plan and billing cycle." />

      <StateBlock loading={loading && !data} error={error}>
        {sub && (
          <>
            <Card className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted">Current plan</p>
                <p className="text-xl font-bold capitalize text-text">{sub.plan}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant={sub.status === "active" ? "success" : "accent"}>
                    {humanize(sub.status)}
                  </Badge>
                  <span className="text-sm text-muted">Billed {sub.billingCycle}</span>
                </div>
              </div>
              {sub.status === "trial" && (
                <div className="rounded-lg bg-accent/10 px-4 py-2 text-sm text-accent">
                  {sub.trialDaysLeft} day{sub.trialDaysLeft === 1 ? "" : "s"} left in trial
                </div>
              )}
            </Card>

            {actionError && (
              <div className="mb-4 rounded-md border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">
                {actionError}
              </div>
            )}

            <div className="mb-4 inline-flex rounded-lg border border-border bg-surface p-1 text-sm">
              {(["monthly", "annual"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCycle(c)}
                  className={cn(
                    "rounded-md px-4 py-1.5 font-medium capitalize transition-colors",
                    cycle === c ? "bg-primary text-primary-fg" : "text-muted hover:text-text",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {PLANS.map((p) => {
                const isCurrent = sub.plan === p.id;
                const price = cycle === "annual" ? Math.round(p.monthly * 12 * 0.8) : p.monthly;
                return (
                  <Card key={p.id} className={cn(isCurrent && "ring-2 ring-primary")}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-text">{p.name}</h3>
                      {isCurrent && <Badge variant="primary">Current</Badge>}
                    </div>
                    <p className="mt-2">
                      <span className="text-2xl font-bold text-text">${price}</span>
                      <span className="text-sm text-muted">/{cycle === "annual" ? "yr" : "mo"}</span>
                    </p>
                    <ul className="mt-4 space-y-2 text-sm text-muted">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-success" /> {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="mt-5 w-full"
                      variant={isCurrent ? "secondary" : "primary"}
                      disabled={isCurrent || busy !== null}
                      onClick={() => changePlan(p.id)}
                    >
                      {isCurrent ? "Current plan" : busy === p.id ? "Switching…" : `Choose ${p.name}`}
                    </Button>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </StateBlock>
    </>
  );
}
