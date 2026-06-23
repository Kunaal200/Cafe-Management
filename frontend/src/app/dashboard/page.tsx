"use client";

import { useState } from "react";
import Link from "next/link";
import { ReceiptText, Clock, CheckCircle2, IndianRupee, ArrowRight, Plus } from "lucide-react";
import { useOutlet } from "@/features/dashboard/outlet-context";
import { useSession } from "@/features/dashboard/session-context";
import { NewOrderModal } from "@/features/dashboard/new-order-modal";
import { PageHeader, Card, StateBlock } from "@/features/dashboard/ui";
import { Badge } from "@/design-system/badge";
import { Button } from "@/design-system/button";
import { useApi } from "@/lib/use-api";
import type { Order } from "@/lib/types";
import { money, timeAgo, humanize, orderStatusVariant, LIVE_STATUSES } from "@/lib/format";
import { canTakeOrders } from "@/lib/permissions";
import { cn } from "@/lib/utils";

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
  accent = "primary",
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: "primary" | "accent" | "warning" | "success";
}) {
  const ring = {
    primary: "before:bg-primary",
    accent: "before:bg-accent",
    warning: "before:bg-warning",
    success: "before:bg-success",
  }[accent];
  const iconColor = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
    warning: "bg-warning/10 text-warning",
    success: "bg-success/10 text-success",
  }[accent];
  return (
    <Card
      className={cn(
        "relative flex items-center gap-4 overflow-hidden",
        "before:absolute before:inset-x-0 before:top-0 before:h-1",
        ring,
      )}
    >
      <span className={cn("flex h-11 w-11 items-center justify-center rounded-lg", iconColor)}>
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
  const session = useSession();
  const [newOrderOpen, setNewOrderOpen] = useState(false);
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
        actions={
          canTakeOrders(session.role) ? (
            <Button onClick={() => setNewOrderOpen(true)} disabled={!selected}>
              <Plus className="h-4 w-4" /> New order
            </Button>
          ) : undefined
        }
      />

      <StateBlock
        loading={outletLoading || (loading && !data)}
        error={error}
        empty={!selected}
        emptyText="No outlet found. Finish onboarding to add one."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Orders today" value={String(todays.length)} icon={ReceiptText} accent="primary" />
          <Stat label="Live orders" value={String(live.length)} icon={Clock} accent="warning" />
          <Stat label="Completed today" value={String(completedToday.length)} icon={CheckCircle2} accent="success" />
          <Stat label="Revenue today" value={money(revenueToday, currency)} icon={IndianRupee} accent="accent" />
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
            <Card className="flex flex-col items-center gap-3 py-12 text-center text-sm text-muted">
              No active orders right now.
              {canTakeOrders(session.role) && (
                <Button onClick={() => setNewOrderOpen(true)} disabled={!selected}>
                  <Plus className="h-4 w-4" /> New order
                </Button>
              )}
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
                      {o.table?.name ? `Table ${o.table.name}` : humanize(o.type)} · #{o.orderNumber}
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

      <NewOrderModal open={newOrderOpen} onClose={() => setNewOrderOpen(false)} />
    </>
  );
}
