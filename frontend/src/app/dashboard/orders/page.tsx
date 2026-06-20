"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { OrderStatus } from "@cafe/shared";
import { useOutlet } from "@/features/dashboard/outlet-context";
import { useSession } from "@/features/dashboard/session-context";
import { NewOrderModal } from "@/features/dashboard/new-order-modal";
import { PageHeader, Card, StateBlock } from "@/features/dashboard/ui";
import { Badge } from "@/design-system/badge";
import { Button } from "@/design-system/button";
import { useApi } from "@/lib/use-api";
import type { Order } from "@/lib/types";
import { money, dateTime, humanize, orderStatusVariant } from "@/lib/format";
import { canTakeOrders } from "@/lib/permissions";
import { cn } from "@/lib/utils";

const FILTERS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: OrderStatus.OPEN, label: "Open" },
  { value: OrderStatus.SENT_TO_KITCHEN, label: "Sent to kitchen" },
  { value: OrderStatus.PREPARING, label: "Preparing" },
  { value: OrderStatus.READY, label: "Ready" },
  { value: OrderStatus.SERVED, label: "Served" },
  { value: OrderStatus.COMPLETED, label: "Completed" },
  { value: OrderStatus.CANCELLED, label: "Cancelled" },
];

export default function OrdersPage() {
  const router = useRouter();
  const { selected, currency } = useOutlet();
  const session = useSession();
  const [status, setStatus] = useState("");
  const [newOrderOpen, setNewOrderOpen] = useState(false);

  const query = selected
    ? `/orders?outletId=${selected.id}${status ? `&status=${status}` : ""}`
    : null;
  const { data, error, loading } = useApi<Order[]>(query, { pollMs: 20000 });
  const orders = data ?? [];

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="All orders for this outlet."
        actions={
          canTakeOrders(session.role) ? (
            <Button onClick={() => setNewOrderOpen(true)} disabled={!selected}>
              <Plus className="h-4 w-4" /> New order
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value || "all"}
            type="button"
            onClick={() => setStatus(f.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
              status === f.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted hover:bg-surface-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <StateBlock
        loading={loading && !data}
        error={error}
        empty={orders.length === 0}
        emptyText="No orders match this filter."
      >
        <Card className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Table / Type</th>
                <th className="px-5 py-3 font-medium">Items</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => router.push(`/dashboard/orders/${o.id}`)}
                  className="cursor-pointer hover:bg-surface-muted"
                >
                  <td className="px-5 py-3 font-medium text-text">#{o.orderNumber}</td>
                  <td className="px-5 py-3 text-muted">
                    {o.table?.name ? `Table ${o.table.name}` : humanize(o.type)}
                  </td>
                  <td className="px-5 py-3 text-muted">{o.items.length}</td>
                  <td className="px-5 py-3 font-medium text-text">{money(o.total, currency)}</td>
                  <td className="px-5 py-3">
                    <Badge variant={orderStatusVariant(o.status)}>{humanize(o.status)}</Badge>
                  </td>
                  <td className="px-5 py-3 text-muted">{dateTime(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </StateBlock>

      <NewOrderModal open={newOrderOpen} onClose={() => setNewOrderOpen(false)} />
    </>
  );
}
