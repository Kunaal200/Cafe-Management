"use client";

import { useState } from "react";
import { IndianRupee, ReceiptText, TrendingUp, TrendingDown, Clock, Users, UtensilsCrossed } from "lucide-react";
import { useOutlet } from "@/features/dashboard/outlet-context";
import { PageHeader, Card, StateBlock } from "@/features/dashboard/ui";
import { useApi } from "@/lib/use-api";
import { money, humanize } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ReportSummary {
  revenue: number;
  orderCount: number;
  avgOrderValue: number;
  paymentMix: { method: string; amount: number; count: number }[];
  daily: { date: string; revenue: number; orders: number }[];
  topItems: { name: string; qty: number; revenue: number }[];
  orderTypes: { type: string; count: number }[];
}

interface Analytics {
  revenue: number;
  orderCount: number;
  revenueGrowthPct: number | null;
  orderGrowthPct: number | null;
  hourly: { hour: number; orders: number; revenue: number }[];
  staff: { name: string; orders: number; revenue: number }[];
  categories: { name: string; qty: number; revenue: number }[];
}

const RANGES = [
  { value: "today", label: "Today", days: 0 },
  { value: "7d", label: "Last 7 days", days: 7 },
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "all", label: "All time", days: -1 },
];

function rangeFromIso(days: number): string | null {
  if (days < 0) return null;
  const d = new Date();
  if (days === 0) d.setHours(0, 0, 0, 0);
  else {
    d.setDate(d.getDate() - days);
    d.setHours(0, 0, 0, 0);
  }
  return d.toISOString();
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="flex items-center gap-4">
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm text-muted">{label}</p>
        <p className="text-xl font-bold text-text">{value}</p>
      </div>
    </Card>
  );
}

export default function ReportsPage() {
  const { selected, currency } = useOutlet();
  const [range, setRange] = useState("7d");

  const days = RANGES.find((r) => r.value === range)?.days ?? 7;
  const from = rangeFromIso(days);
  const query = selected
    ? `/reports/summary?outletId=${selected.id}${from ? `&from=${encodeURIComponent(from)}` : ""}`
    : null;
  const { data, error, loading } = useApi<ReportSummary>(query);
  const analyticsQuery = selected
    ? `/reports/analytics?outletId=${selected.id}${from ? `&from=${encodeURIComponent(from)}` : ""}`
    : null;
  const { data: analytics } = useApi<Analytics>(analyticsQuery);

  const maxDaily = Math.max(1, ...(data?.daily ?? []).map((d) => d.revenue));
  const maxItem = Math.max(1, ...(data?.topItems ?? []).map((i) => i.qty));

  return (
    <>
      <PageHeader title="Reports" subtitle="Sales performance for this outlet." />

      <div className="mb-4 flex flex-wrap gap-2">
        {RANGES.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => setRange(r.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
              range === r.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted hover:bg-surface-muted",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      <StateBlock
        loading={loading && !data}
        error={error}
        empty={!selected}
        emptyText="Select an outlet to see reports."
      >
        {data && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat label="Completed orders" value={String(data.orderCount)} icon={ReceiptText} />
              <Stat label="Revenue" value={money(data.revenue, currency)} icon={IndianRupee} />
              <Stat label="Avg order value" value={money(data.avgOrderValue, currency)} icon={TrendingUp} />
            </div>

            {/* Growth vs previous period */}
            {analytics && (analytics.revenueGrowthPct !== null || analytics.orderGrowthPct !== null) && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <GrowthCard label="Revenue growth" pct={analytics.revenueGrowthPct} />
                <GrowthCard label="Order growth" pct={analytics.orderGrowthPct} />
              </div>
            )}

            {/* Daily revenue trend */}
            <Card className="mt-6">
              <h2 className="mb-4 text-sm font-semibold text-text">Daily revenue</h2>
              {data.daily.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">No sales in this period.</p>
              ) : (
                <div className="flex h-40 items-end gap-1">
                  {data.daily.map((d) => (
                    <div key={d.date} className="flex flex-1 flex-col items-center gap-1" title={`${d.date}: ${money(d.revenue, currency)}`}>
                      <div
                        className="w-full rounded-t bg-primary/70"
                        style={{ height: `${(d.revenue / maxDaily) * 100}%` }}
                      />
                      <span className="truncate text-[10px] text-muted">{d.date.slice(5)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {/* Top items */}
              <Card>
                <h2 className="mb-4 text-sm font-semibold text-text">Top items</h2>
                {data.topItems.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted">No sales in this period.</p>
                ) : (
                  <ul className="space-y-3">
                    {data.topItems.map((it) => (
                      <li key={it.name}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="font-medium text-text">{it.name}</span>
                          <span className="text-muted">
                            {it.qty} sold · {money(it.revenue, currency)}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${(it.qty / maxItem) * 100}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              {/* Payment mix */}
              <Card>
                <h2 className="mb-4 text-sm font-semibold text-text">Payment methods</h2>
                {data.paymentMix.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted">No payments in this period.</p>
                ) : (
                  <ul className="space-y-3">
                    {data.paymentMix.map((p) => {
                      const total = data.paymentMix.reduce((s, x) => s + x.amount, 0) || 1;
                      const pct = Math.round((p.amount / total) * 100);
                      return (
                        <li key={p.method}>
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="font-medium text-text">{humanize(p.method)}</span>
                            <span className="text-muted">
                              {money(p.amount, currency)} ({pct}%)
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                            <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </div>

            {/* Order types */}
            <Card className="mt-6">
              <h2 className="mb-4 text-sm font-semibold text-text">Orders by type</h2>
              {data.orderTypes.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">No sales in this period.</p>
              ) : (
                <div className="flex flex-wrap gap-4">
                  {data.orderTypes.map((t) => (
                    <div key={t.type} className="rounded-lg border border-border px-4 py-2">
                      <p className="text-sm text-muted">{humanize(t.type)}</p>
                      <p className="text-lg font-bold text-text">{t.count}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Hourly distribution */}
            {analytics && (
              <Card className="mt-6">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text">
                  <Clock className="h-4 w-4 text-muted" /> Busiest hours
                </h2>
                {analytics.orderCount === 0 ? (
                  <p className="py-6 text-center text-sm text-muted">No sales in this period.</p>
                ) : (
                  <div className="flex h-32 items-end gap-0.5">
                    {analytics.hourly.map((h) => {
                      const max = Math.max(1, ...analytics.hourly.map((x) => x.orders));
                      return (
                        <div
                          key={h.hour}
                          className="flex flex-1 flex-col items-center gap-1"
                          title={`${h.hour}:00 — ${h.orders} orders`}
                        >
                          <div
                            className="w-full rounded-t bg-accent/70"
                            style={{ height: `${(h.orders / max) * 100}%` }}
                          />
                          {h.hour % 3 === 0 && <span className="text-[9px] text-muted">{h.hour}</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            )}

            {analytics && (
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {/* Staff performance */}
                <Card>
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text">
                    <Users className="h-4 w-4 text-muted" /> Staff performance
                  </h2>
                  {analytics.staff.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted">No attributed orders yet.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {analytics.staff.map((s) => (
                        <li key={s.name} className="flex items-center justify-between">
                          <span className="font-medium text-text">{s.name}</span>
                          <span className="text-muted">
                            {s.orders} orders · {money(s.revenue, currency)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>

                {/* Category performance */}
                <Card>
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text">
                    <UtensilsCrossed className="h-4 w-4 text-muted" /> Category performance
                  </h2>
                  {analytics.categories.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted">No sales in this period.</p>
                  ) : (
                    <ul className="space-y-3">
                      {analytics.categories.map((c) => {
                        const max = Math.max(1, ...analytics.categories.map((x) => x.revenue));
                        return (
                          <li key={c.name}>
                            <div className="mb-1 flex items-center justify-between text-sm">
                              <span className="font-medium text-text">{c.name}</span>
                              <span className="text-muted">{c.qty} sold · {money(c.revenue, currency)}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${(c.revenue / max) * 100}%` }} />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Card>
              </div>
            )}
          </>
        )}
      </StateBlock>
    </>
  );
}

function GrowthCard({ label, pct }: { label: string; pct: number | null }) {
  const up = (pct ?? 0) >= 0;
  return (
    <Card className="flex items-center justify-between">
      <span className="text-sm text-muted">{label}</span>
      {pct === null ? (
        <span className="text-sm text-muted">No prior data</span>
      ) : (
        <span className={cn("inline-flex items-center gap-1 text-lg font-bold", up ? "text-success" : "text-danger")}>
          {up ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
          {up ? "+" : ""}
          {pct}%
        </span>
      )}
    </Card>
  );
}
