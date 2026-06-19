"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { OrderStatus } from "@cafe/shared";
import { useOutlet } from "@/features/dashboard/outlet-context";
import { PageHeader, Card, StateBlock } from "@/features/dashboard/ui";
import { Badge } from "@/design-system/badge";
import { Button } from "@/design-system/button";
import { useApi } from "@/lib/use-api";
import { apiFetch, ApiError } from "@/lib/api";
import type { Order } from "@/lib/types";
import { money, dateTime, humanize, orderStatusVariant } from "@/lib/format";

/** Status transitions that go through the generic status endpoint. */
const NEXT_STATUS: Record<string, { status: string; label: string }[]> = {
  [OrderStatus.SENT_TO_KITCHEN]: [{ status: OrderStatus.PREPARING, label: "Start preparing" }],
  [OrderStatus.PREPARING]: [{ status: OrderStatus.READY, label: "Mark ready" }],
  [OrderStatus.READY]: [{ status: OrderStatus.SERVED, label: "Mark served" }],
  [OrderStatus.SERVED]: [{ status: OrderStatus.COMPLETED, label: "Complete order" }],
};

const CANCELLABLE = [
  OrderStatus.OPEN,
  OrderStatus.SENT_TO_KITCHEN,
  OrderStatus.PREPARING,
] as string[];

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { currency } = useOutlet();
  const { data, error, loading, refetch } = useApi<Order>(
    params.id ? `/orders/${params.id}` : null,
  );
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setActionError(null);
    try {
      await fn();
      refetch();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  const order = data;
  const transitions = order ? (NEXT_STATUS[order.status] ?? []) : [];
  const canSendToKitchen = order?.status === OrderStatus.OPEN && order.items.length > 0;
  const canCancel = order ? CANCELLABLE.includes(order.status) : false;

  return (
    <>
      <button
        type="button"
        onClick={() => router.push("/dashboard/orders")}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </button>

      <StateBlock loading={loading && !data} error={error} empty={!order && !loading}>
        {order && (
          <>
            <PageHeader
              title={`Order #${order.id.slice(0, 6)}`}
              subtitle={`${order.table?.name ? `Table ${order.table.name} · ` : ""}${humanize(order.type)} · ${dateTime(order.createdAt)}`}
              actions={<Badge variant={orderStatusVariant(order.status)}>{humanize(order.status)}</Badge>}
            />

            {actionError && (
              <div className="mb-4 rounded-md border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">
                {actionError}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Items + totals */}
              <Card className="lg:col-span-2 p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                      <th className="px-5 py-3 font-medium">Item</th>
                      <th className="px-5 py-3 font-medium">Qty</th>
                      <th className="px-5 py-3 text-right font-medium">Price</th>
                      <th className="px-5 py-3 text-right font-medium">Line</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {order.items.map((it) => (
                      <tr key={it.id}>
                        <td className="px-5 py-3">
                          <p className="font-medium text-text">{it.name}</p>
                          {it.notes && <p className="text-xs text-muted">{it.notes}</p>}
                        </td>
                        <td className="px-5 py-3 text-muted">{it.qty}</td>
                        <td className="px-5 py-3 text-right text-muted">{money(it.unitPrice, currency)}</td>
                        <td className="px-5 py-3 text-right font-medium text-text">
                          {money(Number(it.unitPrice) * it.qty, currency)}
                        </td>
                      </tr>
                    ))}
                    {order.items.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-muted">
                          No items on this order yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <div className="space-y-1 border-t border-border px-5 py-4 text-sm">
                  <div className="flex justify-between text-muted">
                    <span>Subtotal</span>
                    <span>{money(order.subtotal, currency)}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Tax</span>
                    <span>{money(order.taxTotal, currency)}</span>
                  </div>
                  {Number(order.discount) > 0 && (
                    <div className="flex justify-between text-muted">
                      <span>Discount</span>
                      <span>-{money(order.discount, currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 text-base font-semibold text-text">
                    <span>Total</span>
                    <span>{money(order.total, currency)}</span>
                  </div>
                </div>
              </Card>

              {/* Actions + payments */}
              <div className="space-y-6">
                <Card>
                  <h3 className="mb-3 text-sm font-semibold text-text">Actions</h3>
                  <div className="space-y-2">
                    {canSendToKitchen && (
                      <Button
                        className="w-full"
                        disabled={busy}
                        onClick={() =>
                          run(() => apiFetch(`/orders/${order.id}/send-kitchen`, { method: "POST", auth: true }))
                        }
                      >
                        <Send className="h-4 w-4" /> Send to kitchen
                      </Button>
                    )}
                    {transitions.map((t) => (
                      <Button
                        key={t.status}
                        className="w-full"
                        disabled={busy}
                        onClick={() =>
                          run(() =>
                            apiFetch(`/orders/${order.id}/status`, {
                              method: "PATCH",
                              body: { status: t.status },
                              auth: true,
                            }),
                          )
                        }
                      >
                        {t.label}
                      </Button>
                    ))}
                    {canCancel && (
                      <Button
                        variant="danger"
                        className="w-full"
                        disabled={busy}
                        onClick={() =>
                          run(() =>
                            apiFetch(`/orders/${order.id}/status`, {
                              method: "PATCH",
                              body: { status: OrderStatus.CANCELLED },
                              auth: true,
                            }),
                          )
                        }
                      >
                        Cancel order
                      </Button>
                    )}
                    {!canSendToKitchen && transitions.length === 0 && !canCancel && (
                      <p className="text-sm text-muted">No further actions for this order.</p>
                    )}
                  </div>
                </Card>

                <Card>
                  <h3 className="mb-3 text-sm font-semibold text-text">Payments</h3>
                  {order.payments && order.payments.length > 0 ? (
                    <ul className="space-y-2 text-sm">
                      {order.payments.map((p) => (
                        <li key={p.id} className="flex items-center justify-between">
                          <span className="text-muted">{humanize(p.method)}</span>
                          <span className="flex items-center gap-2">
                            <span className="font-medium text-text">{money(p.amount, currency)}</span>
                            <Badge variant={p.status === "paid" ? "success" : "neutral"}>
                              {humanize(p.status)}
                            </Badge>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted">No payments recorded.</p>
                  )}
                </Card>
              </div>
            </div>
          </>
        )}
      </StateBlock>
    </>
  );
}
