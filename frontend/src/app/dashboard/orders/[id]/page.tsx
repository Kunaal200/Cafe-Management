"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Receipt } from "lucide-react";
import { OrderStatus } from "@cafe/shared";
import { useOutlet } from "@/features/dashboard/outlet-context";
import { useSession } from "@/features/dashboard/session-context";
import { useToast } from "@/features/dashboard/toast";
import { PageHeader, Card, StateBlock } from "@/features/dashboard/ui";
import { MenuCatalog } from "@/features/dashboard/order/menu-catalog";
import { OrderCart } from "@/features/dashboard/order/order-cart";
import { LifecycleActions } from "@/features/dashboard/order/lifecycle-actions";
import { CheckoutPanel } from "@/features/dashboard/order/checkout-panel";
import { Badge } from "@/design-system/badge";
import { useConfirm } from "@/design-system/confirm-dialog";
import { useApi } from "@/lib/use-api";
import { apiFetch, ApiError } from "@/lib/api";
import { canHandleMoney } from "@/lib/permissions";
import type { Order, OrderItem, MenuItem } from "@/lib/types";
import { dateTime, humanize, orderStatusVariant } from "@/lib/format";

const TERMINAL: string[] = [OrderStatus.COMPLETED, OrderStatus.CANCELLED];

export default function OrderWorkspacePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { currency } = useOutlet();
  const session = useSession();
  const toast = useToast();
  const confirm = useConfirm();

  const { data: order, error, loading, refetch } = useApi<Order>(
    params.id ? `/orders/${params.id}` : null,
  );
  const [busy, setBusy] = useState(false);

  const isOpen = order?.status === OrderStatus.OPEN;
  const isTerminal = order ? TERMINAL.includes(order.status) : false;
  const showCheckout = order != null && !isTerminal && canHandleMoney(session.role);

  /** Run a mutation with busy-state + toast handling, refetching on success. */
  async function run(fn: () => Promise<unknown>, success: string) {
    setBusy(true);
    try {
      await fn();
      toast.success(success);
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  function addItem(item: MenuItem) {
    if (!order) return;
    run(
      () =>
        apiFetch(`/orders/${order.id}/items`, {
          method: "POST",
          body: { items: [{ menuItemId: item.id, qty: 1 }] },
          auth: true,
        }),
      `Added ${item.name}`,
    );
  }

  function changeQty(item: OrderItem, qty: number) {
    if (!order) return;
    run(
      () =>
        apiFetch(`/orders/${order.id}/items/${item.id}`, {
          method: "PATCH",
          body: { qty },
          auth: true,
        }),
      "Quantity updated",
    );
  }

  function saveNote(item: OrderItem, note: string) {
    if (!order) return;
    run(
      () =>
        apiFetch(`/orders/${order.id}/items/${item.id}`, {
          method: "PATCH",
          body: { notes: note || null },
          auth: true,
        }),
      "Note saved",
    );
  }

  async function removeItem(item: OrderItem) {
    if (!order) return;
    const ok = await confirm({
      title: "Remove item?",
      description: `Remove "${item.name}" from this order?`,
      confirmLabel: "Remove",
      danger: true,
    });
    if (!ok) return;
    run(
      () => apiFetch(`/orders/${order.id}/items/${item.id}`, { method: "DELETE", auth: true }),
      "Item removed",
    );
  }

  function sendKitchen() {
    if (!order) return;
    run(
      () => apiFetch(`/orders/${order.id}/send-kitchen`, { method: "POST", auth: true }),
      "Sent to kitchen",
    );
  }

  function advance(status: string) {
    if (!order) return;
    run(
      () =>
        apiFetch(`/orders/${order.id}/status`, {
          method: "PATCH",
          body: { status },
          auth: true,
        }),
      "Status updated",
    );
  }

  async function cancelOrder() {
    if (!order) return;
    const ok = await confirm({
      title: "Cancel order?",
      description: "This cannot be undone.",
      confirmLabel: "Cancel order",
      cancelLabel: "Keep order",
      danger: true,
    });
    if (!ok) return;
    run(
      () =>
        apiFetch(`/orders/${order.id}/status`, {
          method: "PATCH",
          body: { status: OrderStatus.CANCELLED },
          auth: true,
        }),
      "Order cancelled",
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => router.push("/dashboard/orders")}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </button>

      <StateBlock loading={loading && !order} error={error} empty={!order && !loading}>
        {order && (
          <>
            <PageHeader
              title={`Order #${order.orderNumber}`}
              subtitle={`${order.table?.name ? `Table ${order.table.name} · ` : ""}${humanize(order.type)} · ${dateTime(order.createdAt)}`}
              actions={
                <div className="flex items-center gap-2">
                  <Badge variant={orderStatusVariant(order.status)}>{humanize(order.status)}</Badge>
                  <Link
                    href={`/dashboard/orders/${order.id}/receipt`}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm text-text hover:bg-surface-muted"
                  >
                    <Receipt className="h-4 w-4" /> Receipt
                  </Link>
                </div>
              }
            />

            {order.status === OrderStatus.COMPLETED && (
              <div className="mb-6 flex items-center gap-3 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
                <CheckCircle2 className="h-5 w-5" />
                <span className="flex-1">Order completed and paid.</span>
                <Link href="/dashboard/orders" className="font-medium underline">
                  Back to orders
                </Link>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left: menu catalog while building */}
              {isOpen && (
                <Card className="lg:col-span-2">
                  <h2 className="mb-3 text-sm font-semibold text-text">Add items</h2>
                  <MenuCatalog onAdd={addItem} adding={busy} />
                </Card>
              )}

              {/* Right: cart + actions + checkout (full width if not building) */}
              <div className={isOpen ? "space-y-6" : "space-y-6 lg:col-span-3"}>
                <Card>
                  <h2 className="mb-3 text-sm font-semibold text-text">Order</h2>
                  <OrderCart
                    order={order}
                    editable={isOpen && !busy}
                    busy={busy}
                    onChangeQty={changeQty}
                    onSaveNote={saveNote}
                    onRemove={removeItem}
                  />
                </Card>

                {!isTerminal && (
                  <Card>
                    <h2 className="mb-3 text-sm font-semibold text-text">Actions</h2>
                    <LifecycleActions
                      order={order}
                      busy={busy}
                      onSendKitchen={sendKitchen}
                      onAdvance={advance}
                      onCancel={cancelOrder}
                    />
                  </Card>
                )}

                {showCheckout && (
                  <Card>
                    <h2 className="mb-3 text-sm font-semibold text-text">Checkout</h2>
                    <CheckoutPanel order={order} currency={currency} onChanged={refetch} />
                  </Card>
                )}
              </div>
            </div>
          </>
        )}
      </StateBlock>
    </>
  );
}
