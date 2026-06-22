"use client";

import { useState } from "react";
import { OrderStatus } from "@cafe/shared";
import { useOutlet } from "@/features/dashboard/outlet-context";
import { useToast } from "@/features/dashboard/toast";
import { PageHeader, Card, StateBlock } from "@/features/dashboard/ui";
import { Button } from "@/design-system/button";
import { Badge } from "@/design-system/badge";
import { useApi } from "@/lib/use-api";
import { apiFetch, ApiError } from "@/lib/api";
import type { Order } from "@/lib/types";
import { timeAgo, humanize, orderStatusVariant } from "@/lib/format";

const COLUMNS: { status: string; title: string; next?: { status: string; label: string } }[] = [
  { status: OrderStatus.SENT_TO_KITCHEN, title: "New", next: { status: OrderStatus.PREPARING, label: "Start" } },
  { status: OrderStatus.PREPARING, title: "Preparing", next: { status: OrderStatus.READY, label: "Ready" } },
  { status: OrderStatus.READY, title: "Ready", next: { status: OrderStatus.SERVED, label: "Served" } },
];

export default function KitchenPage() {
  const { selected } = useOutlet();
  const toast = useToast();
  const { data, error, loading, refetch } = useApi<Order[]>(
    selected ? `/orders?outletId=${selected.id}` : null,
    { pollMs: 10000 },
  );
  const [busy, setBusy] = useState(false);

  const orders = data ?? [];

  async function advance(order: Order, status: string) {
    setBusy(true);
    try {
      await apiFetch(`/orders/${order.id}/status`, { method: "PATCH", body: { status }, auth: true });
      toast.success(`Order #${order.orderNumber} → ${humanize(status)}`);
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update order.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Kitchen" subtitle="Live order queue. Updates every 10s." />

      <StateBlock
        loading={loading && !data}
        error={error}
        empty={!selected}
        emptyText="Select an outlet to see the kitchen queue."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const colOrders = orders.filter((o) => o.status === col.status);
            return (
              <div key={col.status} className="rounded-xl border border-border bg-surface-muted/40 p-3">
                <div className="mb-3 flex items-center justify-between px-1">
                  <h2 className="text-sm font-semibold text-text">{col.title}</h2>
                  <Badge variant={orderStatusVariant(col.status)}>{colOrders.length}</Badge>
                </div>
                <div className="space-y-3">
                  {colOrders.length === 0 && (
                    <p className="px-1 py-6 text-center text-xs text-muted">Nothing here.</p>
                  )}
                  {colOrders.map((o) => (
                    <Card key={o.id} className="p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-semibold text-text">
                          {o.table?.name ? `Table ${o.table.name}` : humanize(o.type)}
                        </span>
                        <span className="text-xs text-muted">#{o.orderNumber} · {timeAgo(o.createdAt)}</span>
                      </div>
                      <ul className="mb-3 space-y-1 text-sm">
                        {o.items.map((it) => (
                          <li key={it.id} className="flex justify-between gap-2">
                            <span className="text-text">
                              <span className="font-medium">{it.qty}×</span> {it.name}
                            </span>
                          </li>
                        ))}
                      </ul>
                      {o.items.some((it) => it.notes) && (
                        <ul className="mb-3 space-y-0.5">
                          {o.items
                            .filter((it) => it.notes)
                            .map((it) => (
                              <li key={it.id} className="text-xs italic text-muted">
                                {it.name}: {it.notes}
                              </li>
                            ))}
                        </ul>
                      )}
                      {col.next && (
                        <Button
                          className="w-full"
                          size="sm"
                          disabled={busy}
                          onClick={() => advance(o, col.next!.status)}
                        >
                          {col.next.label}
                        </Button>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </StateBlock>
    </>
  );
}
