"use client";

import { useState } from "react";
import { Send, Plus, RotateCcw, CreditCard } from "lucide-react";
import { OrderType } from "@cafe/shared";
import { useOutlet } from "@/features/dashboard/outlet-context";
import { useToast } from "@/features/dashboard/toast";
import { useConfirm } from "@/design-system/confirm-dialog";
import { PageHeader, Card, StateBlock } from "@/features/dashboard/ui";
import { Button } from "@/design-system/button";
import { Select } from "@/design-system/select";
import { MenuCatalog } from "@/features/dashboard/order/menu-catalog";
import { OrderCart } from "@/features/dashboard/order/order-cart";
import { PaymentModal } from "@/features/dashboard/order/payment-modal";
import { useApi } from "@/lib/use-api";
import { apiFetch, ApiError } from "@/lib/api";
import type { Order, OrderItem, MenuItem, RestaurantTable } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPES = [
  { value: OrderType.DINE_IN, label: "Dine-in" },
  { value: OrderType.TAKEAWAY, label: "Takeaway" },
  { value: OrderType.DELIVERY, label: "Delivery" },
];

export default function PosPage() {
  const { selected, currency } = useOutlet();
  const toast = useToast();
  const confirm = useConfirm();

  const [type, setType] = useState<string>(OrderType.DINE_IN);
  const [tableId, setTableId] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  const { data: order, refetch } = useApi<Order>(orderId ? `/orders/${orderId}` : null);
  const tablesQuery =
    selected && type === OrderType.DINE_IN ? `/tables?outletId=${selected.id}` : null;
  const { data: tables } = useApi<RestaurantTable[]>(tablesQuery);
  const freeTables = (tables ?? []).filter((t) => t.status === "free" || t.id === order?.tableId);

  async function run(fn: () => Promise<unknown>, success?: string) {
    setBusy(true);
    try {
      await fn();
      if (success) toast.success(success);
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  async function addItem(item: MenuItem) {
    if (!selected) return;
    setBusy(true);
    try {
      let id = orderId;
      if (!id) {
        const created = await apiFetch<Order>("/orders", {
          method: "POST",
          body: { outletId: selected.id, type, tableId: type === OrderType.DINE_IN && tableId ? tableId : undefined },
          auth: true,
        });
        id = created.id;
        setOrderId(id);
      }
      await apiFetch(`/orders/${id}/items`, {
        method: "POST",
        body: { items: [{ menuItemId: item.id, qty: 1 }] },
        auth: true,
      });
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not add item.");
    } finally {
      setBusy(false);
    }
  }

  function changeQty(item: OrderItem, qty: number) {
    if (!orderId) return;
    run(() => apiFetch(`/orders/${orderId}/items/${item.id}`, { method: "PATCH", body: { qty }, auth: true }));
  }
  function saveNote(item: OrderItem, note: string) {
    if (!orderId) return;
    run(() => apiFetch(`/orders/${orderId}/items/${item.id}`, { method: "PATCH", body: { notes: note || null }, auth: true }));
  }
  async function removeItem(item: OrderItem) {
    if (!orderId) return;
    const ok = await confirm({ title: "Remove item?", description: item.name, confirmLabel: "Remove", danger: true });
    if (!ok) return;
    run(() => apiFetch(`/orders/${orderId}/items/${item.id}`, { method: "DELETE", auth: true }), "Item removed");
  }
  function sendKitchen() {
    if (!orderId) return;
    run(() => apiFetch(`/orders/${orderId}/send-kitchen`, { method: "POST", auth: true }), "Sent to kitchen");
  }

  function reset() {
    setOrderId(null);
    setTableId("");
    setType(OrderType.DINE_IN);
  }

  const isOpen = !order || order.status === "open";

  return (
    <>
      <PageHeader
        title="POS"
        subtitle="Quick touch ordering."
        actions={
          <Button variant="secondary" onClick={reset} disabled={busy}>
            <RotateCcw className="h-4 w-4" /> New order
          </Button>
        }
      />

      <StateBlock empty={!selected} emptyText="Select an outlet to start taking orders.">
        {/* Order type + table */}
        {!orderId && (
          <Card className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={cn(
                    "rounded-md border px-4 py-2 text-sm font-medium",
                    type === t.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {type === OrderType.DINE_IN && (
              <Select value={tableId} onChange={(e) => setTableId(e.target.value)} className="w-48">
                <option value="">No table</option>
                {freeTables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            )}
            <span className="text-sm text-muted">Tap a menu item to start the order.</span>
          </Card>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <MenuCatalog onAdd={addItem} adding={busy} />
          </Card>

          <div className="space-y-4">
            <Card>
              <h2 className="mb-3 text-sm font-semibold text-text">
                {order ? `Order #${order.orderNumber}` : "New order"}
              </h2>
              {order ? (
                <OrderCart
                  order={order}
                  editable={isOpen && !busy}
                  busy={busy}
                  onChangeQty={changeQty}
                  onSaveNote={saveNote}
                  onRemove={removeItem}
                />
              ) : (
                <p className="py-8 text-center text-sm text-muted">No items yet.</p>
              )}
            </Card>

            {order && (
              <Card className="space-y-2">
                {order.status === "open" && order.items.length > 0 && (
                  <Button className="w-full" onClick={sendKitchen} disabled={busy}>
                    <Send className="h-4 w-4" /> Send to kitchen
                  </Button>
                )}
                {order.status !== "completed" && order.status !== "cancelled" && (
                  <Button className="w-full" variant="secondary" onClick={() => setPayOpen(true)}>
                    <CreditCard className="h-4 w-4" /> Take payment
                  </Button>
                )}
                {(order.status === "completed" || order.status === "cancelled") && (
                  <Button className="w-full" onClick={reset}>
                    <Plus className="h-4 w-4" /> Start next order
                  </Button>
                )}
              </Card>
            )}
          </div>
        </div>
      </StateBlock>

      {order && (
        <PaymentModal
          order={order}
          currency={currency}
          open={payOpen}
          onClose={() => setPayOpen(false)}
          onChanged={refetch}
        />
      )}
    </>
  );
}
