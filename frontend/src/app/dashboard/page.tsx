"use client";

import Link from "next/link";
import { ReceiptText, Clock, CheckCircle2, IndianRupee, ArrowRight } from "lucide-react";
import { useOutlet } from "@/features/dashboard/outlet-context";
import { PageHeader, Card, StateBlock } from "@/features/dashboard/ui";
import { Badge } from "@/design-system/badge";
import { useApi } from "@/lib/use-api";
import type { Order } from "@/lib/types";
import { money, timeAgo, humanize, orderStatusVariant, LIVE_STATUSES } from "@/lib/format";

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
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

export default function DashboardHome() {
  const { selected, currency, loading: outletLoading } = useOutlet();
  const { data, error, loading } = useApi<Order[]>(
    selected ? `/orders?outletId=${selected.id}` : null,
    { pollMs: 15000 },
  );

  const orders = data ?? [];
  const todays = orders.filter((o) => isToday(o.createdAt));
  const live = orders.filter((o) => LIVE_STATUSES.includes(o.status as (typeof LIVE_STATUSES)[number]));
  const completedToday = todays.filter((o) => o.status === "completed");
  const revenueToday = completedToday.reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={selected ? `${selected.name}${selected.city ? ` · ${selected.city}` : ""}` : undefined}
      />

      <StateBlock
        loading={outletLoading || (loading && !data)}
        error={error}
        empty={!selected}
        emptyText="No outlet found. Finish onboarding to add one."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Orders today" value={String(todays.length)} icon={ReceiptText} />
          <Stat label="Live orders" value={String(live.length)} icon={Clock} />
          <Stat label="Completed today" value={String(completedToday.length)} icon={CheckCircle2} />
          <Stat label="Revenue today" value={money(revenueToday, currency)} icon={IndianRupee} />
        </div>

        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text">Live orders</h2>
            <Link
              href="/dashboard/orders"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {live.length === 0 ? (
            <Card className="py-12 text-center text-sm text-muted">
              No active orders right now.
            </Card>
          ) : (
            <Card className="divide-y divide-border p-0">
              {live.map((o) => (
                <Link
                  key={o.id}
                  href={`/dashboard/orders/${o.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-surface-muted"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-text">
                      {o.table?.name ? `Table ${o.table.name}` : humanize(o.type)} · #{o.id.slice(0, 6)}
                    </p>
                    <p className="text-xs text-muted">
                      {o.items.length} item{o.items.length === 1 ? "" : "s"} · {timeAgo(o.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-text">{money(o.total, currency)}</span>
                    <Badge variant={orderStatusVariant(o.status)}>{humanize(o.status)}</Badge>
                  </div>
                </Link>
              ))}
            </Card>
          )}
        </div>
      </StateBlock>
    </>
  );
}
