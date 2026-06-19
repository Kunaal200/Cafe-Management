"use client";

import { useEffect, useState } from "react";
import { PaymentMethod } from "@cafe/shared";
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
 * Discount + payments + finalize for a non-terminal order. Owns its payment
 * summary; calls onChanged so the parent can refetch the order (totals/status).
 */
export function CheckoutPanel({
  order,
  currency,
  onChanged,
}: {
  order: Order;
  currency: string;
  onChanged: () => void;
}) {
  const toast = useToast();

  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [discountType, setDiscountType] = useState<"amount" | "percent">("amount");
  const [discountValue, setDiscountValue] = useState("");

  const [method, setMethod] = useState<string>(PaymentMethod.CASH);
  const [amount, setAmount] = useState("");
  const [tendered, setTendered] = useState("");
  const [reference, setReference] = useState("");

  const [busy, setBusy] = useState(false);

  async function loadSummary() {
    setSummaryLoading(true);
    try {
      const s = await apiFetch<PaymentSummary>(`/orders/${order.id}/payments`, { auth: true });
      setSummary(s);
      // Default the next payment amount to the outstanding balance.
      setAmount(s.balance > 0 ? String(s.balance) : "");
    } catch {
      /* surfaced via the order view; keep panel usable */
    } finally {
      setSummaryLoading(false);
    }
  }

  useEffect(() => {
    loadSummary();
    // Reload whenever the order total changes (e.g. items or discount changed).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.id, order.total]);

  async function applyDiscount() {
    const value = Number(discountValue);
    if (!Number.isFinite(value) || value < 0) {
      toast.error("Enter a valid discount value.");
      return;
    }
    if (discountType === "percent" && value > 100) {
      toast.error("Percentage discount cannot exceed 100.");
      return;
    }
    setBusy(true);
    try {
      await apiFetch(`/orders/${order.id}/discount`, {
        method: "POST",
        body: { type: discountType, value },
        auth: true,
      });
      setDiscountValue("");
      toast.success("Discount applied");
      onChanged();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not apply discount.");
    } finally {
      setBusy(false);
    }
  }

  async function addPayment() {
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
      setReference("");
      setTendered("");
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
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not finalize the order.");
    } finally {
      setBusy(false);
    }
  }

  const balance = summary?.balance ?? Number(order.total);
  const fullyPaid = balance <= 0;
  const changeDue =
    method === PaymentMethod.CASH && tendered
      ? Number(tendered) - Number(amount || 0)
      : 0;

  return (
    <div className="space-y-5">
      {/* Discount */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-text">Discount</h3>
        <div className="flex gap-2">
          <Select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as "amount" | "percent")}
            className="w-28"
          >
            <option value="amount">Amount</option>
            <option value="percent">Percent</option>
          </Select>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder={discountType === "percent" ? "0–100" : "0.00"}
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
          />
          <Button variant="secondary" onClick={applyDiscount} disabled={busy || !discountValue}>
            Apply
          </Button>
        </div>
      </div>

      {/* Balance summary */}
      <div className="rounded-lg bg-surface-muted p-4">
        {summaryLoading && !summary ? (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Spinner /> Loading payments…
          </div>
        ) : (
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between text-muted">
              <span>Total</span>
              <span>{money(summary?.total ?? order.total, currency)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Paid</span>
              <span>{money(summary?.paid ?? 0, currency)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-text">
              <span>Balance</span>
              <span className={cn(fullyPaid && "text-success")}>{money(balance, currency)}</span>
            </div>
          </dl>
        )}
      </div>

      {/* Recorded payments */}
      {summary && summary.payments.length > 0 && (
        <ul className="space-y-1.5 text-sm">
          {summary.payments.map((p) => (
            <li key={p.id} className="flex items-center justify-between">
              <span className="text-muted">{humanize(p.method)}</span>
              <span className="flex items-center gap-2">
                <span className="font-medium text-text">{money(p.amount, currency)}</span>
                <Badge variant={p.status === "paid" ? "success" : "neutral"}>{humanize(p.status)}</Badge>
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Add payment */}
      {!fullyPaid && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-text">Add payment</h3>
          <div className="grid grid-cols-2 gap-2">
            <Select value={method} onChange={(e) => setMethod(e.target.value)}>
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {humanize(m)}
                </option>
              ))}
            </Select>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          {method === PaymentMethod.CASH && (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Cash tendered"
                value={tendered}
                onChange={(e) => setTendered(e.target.value)}
              />
              {changeDue > 0 && (
                <span className="whitespace-nowrap text-sm text-muted">
                  Change: <span className="font-medium text-text">{money(changeDue, currency)}</span>
                </span>
              )}
            </div>
          )}
          {method !== PaymentMethod.CASH && (
            <Input
              placeholder="Reference (optional)"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          )}
          <Button className="w-full" variant="secondary" onClick={addPayment} disabled={busy}>
            Record payment
          </Button>
        </div>
      )}

      {/* Finalize */}
      <Button className="w-full" onClick={finalize} disabled={busy || !fullyPaid}>
        {fullyPaid ? "Finalize & complete" : `${money(balance, currency)} left to pay`}
      </Button>
    </div>
  );
}
