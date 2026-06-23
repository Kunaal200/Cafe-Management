"use client";

import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { Button } from "@/design-system/button";
import { Input } from "@/design-system/input";
import { Select } from "@/design-system/select";
import { Spinner } from "@/features/dashboard/ui";
import { useToast } from "@/features/dashboard/toast";
import { apiFetch, ApiError } from "@/lib/api";
import type { Order, PaymentSummary } from "@/lib/types";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PaymentModal } from "./payment-modal";

/**
 * Discount + balance summary for a non-terminal order. Payment collection and
 * finalize happen in the PaymentModal opened from here. Owns its payment summary
 * so the balance reflects recorded payments; calls onChanged so the parent can
 * refetch the order (totals/status).
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
  const [couponCode, setCouponCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  async function loadSummary() {
    setSummaryLoading(true);
    try {
      const s = await apiFetch<PaymentSummary>(`/orders/${order.id}/payments`, { auth: true });
      setSummary(s);
    } catch {
      /* surfaced via the order view */
    } finally {
      setSummaryLoading(false);
    }
  }

  useEffect(() => {
    loadSummary();
    // Reload when the order total changes (items/discount) or a payment is made.
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

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setBusy(true);
    try {
      await apiFetch(`/coupons/orders/${order.id}/apply`, {
        method: "POST",
        body: { code: couponCode.trim() },
        auth: true,
      });
      setCouponCode("");
      toast.success("Coupon applied");
      onChanged();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not apply coupon.");
    } finally {
      setBusy(false);
    }
  }

  const balance = summary?.balance ?? Number(order.total);
  const fullyPaid = balance <= 0;

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

      {/* Coupon */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-text">Coupon</h3>
        {order.couponCode ? (
          <p className="text-sm text-muted">
            Applied: <span className="font-medium text-text">{order.couponCode}</span>
          </p>
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder="Enter code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            />
            <Button variant="secondary" onClick={applyCoupon} disabled={busy || !couponCode.trim()}>
              Apply
            </Button>
          </div>
        )}
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

      <Button className="w-full" onClick={() => setPayOpen(true)}>
        <CreditCard className="h-4 w-4" />
        {fullyPaid ? "Review & complete" : "Take payment"}
      </Button>

      <PaymentModal
        order={order}
        currency={currency}
        open={payOpen}
        onClose={() => setPayOpen(false)}
        onChanged={() => {
          loadSummary();
          onChanged();
        }}
      />
    </div>
  );
}
