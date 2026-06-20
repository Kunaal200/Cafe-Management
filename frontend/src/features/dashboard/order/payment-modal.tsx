"use client";

import { useCallback, useEffect, useState } from "react";
import { PaymentMethod } from "@cafe/shared";
import { Modal } from "@/design-system/modal";
import { Button } from "@/design-system/button";
import { Input } from "@/design-system/input";
import { Select } from "@/design-system/select";
import { Badge } from "@/design-system/badge";
import { Spinner } from "@/features/dashboard/ui";
import { useToast } from "@/features/dashboard/toast";
import { apiFetch, ApiError } from "@/lib/api";
import type { Order, PaymentSummary } from "@/lib/types";
import { money, humanize } from "@/lib/format";
import { cn } from "@/lib/utils";

const METHODS = [
  PaymentMethod.CASH,
  PaymentMethod.CARD,
  PaymentMethod.UPI,
  PaymentMethod.WALLET,
  PaymentMethod.ONLINE,
];

/**
 * Payment + finalize modal. Supports split bills (record multiple payments)
 * and shows live change for cash. Finalizing completes the order.
 */
export function PaymentModal({
  order,
  currency,
  open,
  onClose,
  onChanged,
}: {
  order: Order;
  currency: string;
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const toast = useToast();

  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<string>(PaymentMethod.CASH);
  const [amount, setAmount] = useState("");
  const [tendered, setTendered] = useState("");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const s = await apiFetch<PaymentSummary>(`/orders/${order.id}/payments`, { auth: true });
      setSummary(s);
      setAmount(s.balance > 0 ? String(s.balance) : "");
    } catch {
      /* surfaced elsewhere */
    } finally {
      setLoading(false);
    }
  }, [order.id]);

  useEffect(() => {
    if (open) {
      setTendered("");
      setReference("");
      loadSummary();
    }
  }, [open, loadSummary]);

  async function recordPayment() {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("Payment amount must be greater than 0.");
      return;
    }
    setBusy(true);
    try {
      const updated = await apiFetch<PaymentSummary>(`/orders/${order.id}/payments`, {
        method: "POST",
        body: { method, amount: amt, reference: reference.trim() || undefined },
        auth: true,
      });
      setSummary(updated);
      setTendered("");
      setReference("");
      setAmount(updated.balance > 0 ? String(updated.balance) : "");
      toast.success("Payment recorded");
      onChanged();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not record payment.");
    } finally {
      setBusy(false);
    }
  }

  async function finalize() {
    setBusy(true);
    try {
      await apiFetch(`/orders/${order.id}/checkout`, { method: "POST", auth: true });
      toast.success("Order completed");
      onChanged();
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not finalize the order.");
    } finally {
      setBusy(false);
    }
  }

  const balance = summary?.balance ?? Number(order.total);
  const fullyPaid = balance <= 0;
  // Live change: how much to return when cash tendered exceeds the amount due.
  const amtNum = Number(amount) || 0;
  const tenderedNum = Number(tendered) || 0;
  const changeDue = method === PaymentMethod.CASH ? tenderedNum - amtNum : 0;

  return (
    <Modal open={open} onClose={onClose} title={`Payment · Order #${order.orderNumber}`}>
      {loading && !summary ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted">
          <Spinner /> Loading…
        </div>
      ) : (
        <div className="space-y-5">
          {/* Balance */}
          <div className="rounded-lg bg-surface-muted p-4">
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between text-muted">
                <span>Total</span>
                <span>{money(summary?.total ?? order.total, currency)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Paid</span>
                <span>{money(summary?.paid ?? 0, currency)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-text">
                <span>Balance</span>
                <span className={cn(fullyPaid && "text-success")}>{money(balance, currency)}</span>
              </div>
            </dl>
          </div>

          {/* Recorded payments */}
          {summary && summary.payments.length > 0 && (
            <ul className="space-y-1.5 text-sm">
              {summary.payments.map((p) => (
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
          )}

          {/* Take payment */}
          {!fullyPaid && (
            <div className="space-y-3 border-t border-border pt-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted">Method</label>
                  <Select value={method} onChange={(e) => setMethod(e.target.value)}>
                    {METHODS.map((m) => (
                      <option key={m} value={m}>
                        {humanize(m)}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted">Amount</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>

              {method === PaymentMethod.CASH ? (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted">Cash tendered</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={tendered}
                    onChange={(e) => setTendered(e.target.value)}
                    placeholder="Amount received"
                  />
                  <div className="flex justify-between rounded-md bg-surface-muted px-3 py-2 text-sm">
                    <span className="text-muted">Change due</span>
                    <span
                      className={cn(
                        "font-semibold",
                        changeDue < 0 ? "text-danger" : "text-text",
                      )}
                    >
                      {changeDue < 0
                        ? `${money(-changeDue, currency)} short`
                        : money(changeDue, currency)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted">Reference (optional)</label>
                  <Input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Txn id, last 4 digits, etc."
                  />
                </div>
              )}

              <Button className="w-full" variant="secondary" onClick={recordPayment} disabled={busy}>
                Record payment
              </Button>
            </div>
          )}

          {/* Finalize */}
          <Button className="w-full" onClick={finalize} disabled={busy || !fullyPaid}>
            {fullyPaid ? "Complete order" : `${money(balance, currency)} left to pay`}
          </Button>
        </div>
      )}
    </Modal>
  );
}
