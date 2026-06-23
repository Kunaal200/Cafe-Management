/** Formatting helpers shared across dashboard screens. */
import type { OrderStatus, TableStatus } from "@cafe/shared";

/** Format a numeric/string amount as currency. Falls back gracefully. */
export function money(amount: string | number, currency = "USD"): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  const safe = Number.isFinite(value) ? value : 0;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(safe);
  } catch {
    return `${currency} ${safe.toFixed(2)}`;
  }
}

/** Short, human date-time, e.g. "Jun 19, 2:30 PM". */
export function dateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Relative "time ago" for live order feeds. */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Math.max(0, Date.now() - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/** Turn an enum-ish value ("sent_to_kitchen") into a label ("Sent to kitchen"). */
export function humanize(value: string): string {
  const s = value.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type BadgeVariant = "neutral" | "primary" | "accent" | "success" | "warning" | "danger";

/** Map an order status to a badge color so the whole app stays consistent. */
export function orderStatusVariant(status: OrderStatus | string): BadgeVariant {
  switch (status) {
    case "open":
      return "neutral";
    case "sent_to_kitchen":
      return "accent";
    case "preparing":
      return "warning";
    case "ready":
      return "primary";
    case "served":
      return "primary";
    case "completed":
      return "success";
    case "cancelled":
      return "danger";
    default:
      return "neutral";
  }
}

/** Map a table status to a badge color. */
export function tableStatusVariant(status: TableStatus | string): BadgeVariant {
  switch (status) {
    case "free":
      return "success";
    case "occupied":
      return "warning";
    case "reserved":
      return "accent";
    default:
      return "neutral";
  }
}

/** Statuses considered "live" (active service) for the home feed. */
export const LIVE_STATUSES = ["open", "sent_to_kitchen", "preparing", "ready", "served"] as const;

/** Whether an order is fully paid, from its payments + total. */
export function isOrderPaid(order: {
  total: string | number;
  payments?: { amount: string | number; status: string }[] | null;
}): boolean {
  const total = Number(order.total);
  if (total <= 0) return false;
  const paid = (order.payments ?? [])
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  return paid + 0.0001 >= total;
}
