"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { useOutlet } from "@/features/dashboard/outlet-context";
import { StateBlock } from "@/features/dashboard/ui";
import { Button } from "@/design-system/button";
import { useApi } from "@/lib/use-api";
import type { Order } from "@/lib/types";
import { money, dateTime, humanize } from "@/lib/format";

export default function ReceiptPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { outlets } = useOutlet();
  const { data: order, error, loading } = useApi<Order>(
    params.id ? `/orders/${params.id}` : null,
  );

  const outlet = order ? outlets.find((o) => o.id === order.outletId) : null;
  const currency = outlet?.currency ?? "USD";
  const paid = (order?.payments ?? []).filter((p) => p.status === "paid");
  const paidTotal = paid.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <button
          type="button"
          onClick={() => router.push(`/dashboard/orders/${params.id}`)}
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" /> Back to order
        </button>
        <Button onClick={() => window.print()} disabled={!order}>
          <Printer className="h-4 w-4" /> Print
        </Button>
      </div>

      <StateBlock loading={loading && !order} error={error} empty={!order && !loading}>
        {order && (
          <div className="receipt-print mx-auto max-w-sm rounded-lg border border-border bg-surface p-6 text-sm text-text">
            <div className="mb-4 text-center">
              <h1 className="text-lg font-bold">{outlet?.name ?? "Receipt"}</h1>
              {outlet?.city && <p className="text-xs text-muted">{outlet.city}</p>}
            </div>

            <div className="mb-3 flex justify-between text-xs text-muted">
              <span>Order #{order.orderNumber}</span>
              <span>{dateTime(order.createdAt)}</span>
            </div>
            <div className="mb-3 text-xs text-muted">
              {order.table?.name ? `Table ${order.table.name} · ` : ""}
              {humanize(order.type)}
            </div>

            <div className="border-y border-dashed border-border py-2">
              {order.items.map((it) => (
                <div key={it.id} className="flex justify-between py-1">
                  <span>
                    {it.qty}× {it.name}
                  </span>
                  <span>{money(Number(it.unitPrice) * it.qty, currency)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 py-2">
              <Row label="Subtotal" value={money(order.subtotal, currency)} />
              <Row label="Tax" value={money(order.taxTotal, currency)} />
              {Number(order.discount) > 0 && (
                <Row label="Discount" value={`-${money(order.discount, currency)}`} />
              )}
              <div className="flex justify-between border-t border-border pt-1 text-base font-bold">
                <span>Total</span>
                <span>{money(order.total, currency)}</span>
              </div>
            </div>

            {paid.length > 0 && (
              <div className="border-t border-dashed border-border py-2 text-xs">
                {paid.map((p) => (
                  <Row key={p.id} label={humanize(p.method)} value={money(p.amount, currency)} />
                ))}
                <Row label="Paid" value={money(paidTotal, currency)} />
              </div>
            )}

            <p className="mt-4 text-center text-xs text-muted">Thank you!</p>
          </div>
        )}
      </StateBlock>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted">
      <span>{label}</span>
      <span className="text-text">{value}</span>
    </div>
  );
}
