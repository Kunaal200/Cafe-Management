"use client";

import { useMemo, useState } from "react";
import { IndianRupee, ReceiptText, TrendingUp } from "lucide-react";
import { OrderStatus } from "@cafe/shared";
import { useOutlet } from "@/features/dashboard/outlet-context";
import { PageHeader, Card, StateBlock } from "@/features/dashboard/ui";
import { useApi } from "@/lib/use-api";
import type { Order } from "@/lib/types";
import { money, humanize } from "@/lib/format";
import { cn } from "@/lib/utils";

const RANGES = [
  { value: "today", label: "Today", days: 0 },
  { value: "7d", label: "Last 7 days", days: 7 },
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "all", label: "All time", days: -1 },
];

function startOfRange(days: number): number {
  if (days < 0) return 0; // all time
  const d = new Date();
  if (days === 0) {
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
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

  const { data, error, loading } = useApi<Order[]>(
    selected ? `/orders?outletId=${selected.id}` : null,
  );

  const stats = useMemo(() => {
    const orders = data ?? [];
    const days = RANGES.find((r) => r.value === range)?.days ?? 7;
    const from = startOfRange(days);
    const inRange = orders.filter((o) => new Date(o.createdAt).getTime() >= from);
    const completed = inRange.filter((o) => o.status === OrderStatus.COMPLETED);

    const revenue = completed.reduce((sum, o) => sum + Number(o.total), 0);
    const avg = completed.length ? revenue / completed.length : 0;

    // Top items by quantity across completed orders.
    const itemMap = new Map<string, { qty: number; revenue: number }>();
    for (const o of completed) {
      for (const it of o.items) {
        const cur = itemMap.get(it.name) ?? { qty: 0, revenue: 0 };
        cur.qty += it.qty;
        cur.revenue += Number(it.unitPrice) * it.qty;
        itemMap.set(it.name, cur);
      }
    }
    const topItems = [...itemMap.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);

    // Order-type breakdown (completed).
    const typeMap = new Map<string, number>();
    for (const o of completed) typeMap.set(o.type, (typeMap.get(o.type) ?? 0) + 1);
    const byType = [...typeMap.entries()].map(([type, count]) => ({ type, count }));

    return { count: completed.length, revenue, avg, topItems, byType };
  }, [data, range]);

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
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Completed orders" value={String(stats.count)} icon={ReceiptText} />
          <Stat label="Revenue" value={money(stats.revenue, currency)} icon={IndianRupee} />
          <Stat label="Avg order value" value={money(stats.avg, currency)} icon={TrendingUp} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="mb-4 text-sm font-semibold text-text">Top items</h2>
            {stats.topItems.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">No sales in this period.</p>
            ) : (
              <ul className="space-y-3">
                {stats.topItems.map((it) => {
                  const max = stats.topItems[0].qty || 1;
                  return (
                    <li key={it.name}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-text">{it.name}</span>
                        <span className="text-muted">
                          {it.qty} sold · {money(it.revenue, currency)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(it.qty / max) * 100}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="mb-4 text-sm font-semibold text-text">Orders by type</h2>
            {stats.byType.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">No sales in this period.</p>
            ) : (
              <ul className="space-y-3">
                {stats.byType.map((t) => {
                  const pct = stats.count ? Math.round((t.count / stats.count) * 100) : 0;
                  return (
                    <li key={t.type}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-text">{humanize(t.type)}</span>
                        <span className="text-muted">
                          {t.count} ({pct}%)
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
      </StateBlock>
    </>
  );
}
