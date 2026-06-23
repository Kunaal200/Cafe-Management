"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OrderType } from "@cafe/shared";
import { Modal } from "@/design-system/modal";
import { Button } from "@/design-system/button";
import { Field } from "@/design-system/field";
import { Select } from "@/design-system/select";
import { useApi } from "@/lib/use-api";
import { apiFetch, ApiError } from "@/lib/api";
import { useOutlet } from "./outlet-context";
import { useToast } from "./toast";
import { CustomerSelect } from "./customer-select";
import type { Order, RestaurantTable } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPE_OPTIONS = [
  { value: OrderType.DINE_IN, label: "Dine-in" },
  { value: OrderType.TAKEAWAY, label: "Takeaway" },
  { value: OrderType.DELIVERY, label: "Delivery" },
];

export function NewOrderModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { selected } = useOutlet();
  const toast = useToast();

  const [type, setType] = useState<string>(OrderType.DINE_IN);
  const [tableId, setTableId] = useState<string>("");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerLabel, setCustomerLabel] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Only fetch tables for dine-in, and only while the modal is open.
  const tablesQuery =
    open && selected && type === OrderType.DINE_IN ? `/tables?outletId=${selected.id}` : null;
  const { data: tables } = useApi<RestaurantTable[]>(tablesQuery);
  const freeTables = (tables ?? []).filter((t) => t.status === "free");

  async function create() {
    if (!selected) return;
    setBusy(true);
    setFormError(null);
    try {
      const body: Record<string, unknown> = { outletId: selected.id, type };
      if (type === OrderType.DINE_IN && tableId) body.tableId = tableId;
      if (customerId) body.customerId = customerId;
      const order = await apiFetch<Order>("/orders", { method: "POST", body, auth: true });
      toast.success("Order created");
      onClose();
      router.push(`/dashboard/orders/${order.id}`);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Could not create the order.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New order" description="Start a new bill.">
      {!selected ? (
        <p className="text-sm text-muted">Select an outlet first to create an order.</p>
      ) : (
        <div className="space-y-4">
          {formError && (
            <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {formError}
            </div>
          )}

          <div className="space-y-1.5">
            <span className="block text-sm font-medium text-text">Order type</span>
            <div className="grid grid-cols-3 gap-2">
              {TYPE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setType(o.value)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                    type === o.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted hover:bg-surface-muted",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {type === OrderType.DINE_IN && (
            <Field label="Table (optional)" htmlFor="tableId">
              <Select id="tableId" value={tableId} onChange={(e) => setTableId(e.target.value)}>
                <option value="">No table / assign later</option>
                {freeTables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.area ? ` · ${t.area}` : ""} ({t.capacity} seats)
                  </option>
                ))}
              </Select>
              {freeTables.length === 0 && (
                <p className="text-xs text-muted">No free tables right now — you can assign one later.</p>
              )}
            </Field>
          )}

          <Field label="Customer (optional)" htmlFor="customer">
            <CustomerSelect
              value={customerId}
              selectedLabel={customerLabel}
              onSelect={(id, label) => {
                setCustomerId(id);
                setCustomerLabel(label ?? null);
              }}
            />
          </Field>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={create} disabled={busy}>
              {busy ? "Creating…" : "Create order"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
