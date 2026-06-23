"use client";

import { Send } from "lucide-react";
import { OrderStatus } from "@cafe/shared";
import { Button } from "@/design-system/button";
import type { Order } from "@/lib/types";

/** Status transitions reachable via PATCH /orders/:id/status.
 * Note: `served → completed` is intentionally NOT here — completing an order
 * happens through Checkout (which takes payment first). */
const NEXT_STATUS: Record<string, { status: string; label: string }[]> = {
  [OrderStatus.SENT_TO_KITCHEN]: [{ status: OrderStatus.PREPARING, label: "Start preparing" }],
  [OrderStatus.PREPARING]: [{ status: OrderStatus.READY, label: "Mark ready" }],
  [OrderStatus.READY]: [{ status: OrderStatus.SERVED, label: "Mark served" }],
};

const CANCELLABLE: string[] = [
  OrderStatus.OPEN,
  OrderStatus.SENT_TO_KITCHEN,
  OrderStatus.PREPARING,
];

export function LifecycleActions({
  order,
  busy,
  onSendKitchen,
  onAdvance,
  onCancel,
}: {
  order: Order;
  busy: boolean;
  onSendKitchen: () => void;
  onAdvance: (status: string) => void;
  onCancel: () => void;
}) {
  const transitions = NEXT_STATUS[order.status] ?? [];
  const canSendToKitchen = order.status === OrderStatus.OPEN && order.items.length > 0;
  const canCancel = CANCELLABLE.includes(order.status);

  if (!canSendToKitchen && transitions.length === 0 && !canCancel) {
    return <p className="text-sm text-muted">No further actions for this order.</p>;
  }

  return (
    <div className="space-y-2">
      {canSendToKitchen && (
        <Button className="w-full" disabled={busy} onClick={onSendKitchen}>
          <Send className="h-4 w-4" /> Send to kitchen
        </Button>
      )}
      {transitions.map((t) => (
        <Button key={t.status} className="w-full" disabled={busy} onClick={() => onAdvance(t.status)}>
          {t.label}
        </Button>
      ))}
      {canCancel && (
        <Button variant="danger" className="w-full" disabled={busy} onClick={onCancel}>
          Cancel order
        </Button>
      )}
    </div>
  );
}
