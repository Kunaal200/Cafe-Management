"use client";

import { useState } from "react";
import { Plus, Trash2, Ticket } from "lucide-react";
import { useOutlet } from "@/features/dashboard/outlet-context";
import { useToast } from "@/features/dashboard/toast";
import { useConfirm } from "@/design-system/confirm-dialog";
import { PageHeader, Card, StateBlock } from "@/features/dashboard/ui";
import { Button } from "@/design-system/button";
import { Badge } from "@/design-system/badge";
import { Field } from "@/design-system/field";
import { Input } from "@/design-system/input";
import { Select } from "@/design-system/select";
import { Modal } from "@/design-system/modal";
import { useApi } from "@/lib/use-api";
import { apiFetch, ApiError } from "@/lib/api";
import type { Coupon } from "@/lib/types";
import { money } from "@/lib/format";

interface CouponDraft {
  code: string;
  type: "amount" | "percent";
  value: string;
  minOrder: string;
  maxRedemptions: string;
  expiresAt: string;
}

const emptyDraft: CouponDraft = {
  code: "",
  type: "percent",
  value: "",
  minOrder: "",
  maxRedemptions: "",
  expiresAt: "",
};

export default function CouponsPage() {
  const { currency } = useOutlet();
  const toast = useToast();
  const confirm = useConfirm();
  const { data, error, loading, refetch } = useApi<Coupon[]>("/coupons");

  const [draft, setDraft] = useState<CouponDraft | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const coupons = data ?? [];

  async function create() {
    if (!draft) return;
    const value = Number(draft.value);
    if (!draft.code.trim() || !Number.isFinite(value) || value <= 0) {
      setFormError("Enter a code and a value greater than 0.");
      return;
    }
    if (draft.type === "percent" && value > 100) {
      setFormError("Percentage cannot exceed 100.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await apiFetch("/coupons", {
        method: "POST",
        body: {
          code: draft.code.trim(),
          type: draft.type,
          value,
          minOrder: draft.minOrder.trim() ? Number(draft.minOrder) : undefined,
          maxRedemptions: draft.maxRedemptions.trim() ? Number(draft.maxRedemptions) : undefined,
          expiresAt: draft.expiresAt ? new Date(draft.expiresAt).toISOString() : undefined,
        },
        auth: true,
      });
      toast.success("Coupon created");
      setDraft(null);
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Could not create coupon.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(c: Coupon) {
    try {
      await apiFetch(`/coupons/${c.id}`, { method: "PATCH", body: { isActive: !c.isActive }, auth: true });
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update coupon.");
    }
  }

  async function remove(c: Coupon) {
    const ok = await confirm({
      title: "Delete coupon?",
      description: `Delete "${c.code}"? This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await apiFetch(`/coupons/${c.id}`, { method: "DELETE", auth: true });
      toast.success("Coupon deleted");
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete coupon.");
    }
  }

  function describe(c: Coupon): string {
    return c.type === "percent" ? `${Number(c.value)}% off` : `${money(c.value, currency)} off`;
  }

  return (
    <>
      <PageHeader
        title="Coupons"
        subtitle="Discount codes customers can redeem at checkout."
        actions={
          <Button onClick={() => { setFormError(null); setDraft({ ...emptyDraft }); }}>
            <Plus className="h-4 w-4" /> New coupon
          </Button>
        }
      />

      <StateBlock
        loading={loading && !data}
        error={error}
        empty={coupons.length === 0}
        emptyText="No coupons yet. Create one to offer a discount."
      >
        <Card className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-5 py-3 font-medium">Discount</th>
                <th className="px-5 py-3 font-medium">Min order</th>
                <th className="px-5 py-3 font-medium">Used</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {coupons.map((c) => (
                <tr key={c.id}>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 font-medium text-text">
                      <Ticket className="h-4 w-4 text-primary" /> {c.code}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted">{describe(c)}</td>
                  <td className="px-5 py-3 text-muted">{c.minOrder ? money(c.minOrder, currency) : "—"}</td>
                  <td className="px-5 py-3 text-muted">
                    {c.redeemedCount}
                    {c.maxRedemptions != null ? ` / ${c.maxRedemptions}` : ""}
                  </td>
                  <td className="px-5 py-3">
                    <button type="button" onClick={() => toggleActive(c)}>
                      <Badge variant={c.isActive ? "success" : "neutral"}>
                        {c.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => remove(c)}
                      className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-danger"
                      aria-label="Delete coupon"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </StateBlock>

      <Modal open={draft !== null} onClose={() => setDraft(null)} title="New coupon">
        {draft && (
          <div className="space-y-4">
            {formError && <p className="text-sm text-danger">{formError}</p>}
            <Field label="Code" htmlFor="code">
              <Input
                id="code"
                value={draft.code}
                onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
                placeholder="WELCOME10"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Type" htmlFor="type">
                <Select
                  id="type"
                  value={draft.type}
                  onChange={(e) => setDraft({ ...draft, type: e.target.value as "amount" | "percent" })}
                >
                  <option value="percent">Percent</option>
                  <option value="amount">Amount</option>
                </Select>
              </Field>
              <Field label={draft.type === "percent" ? "Percent (0–100)" : `Amount (${currency})`} htmlFor="value">
                <Input
                  id="value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.value}
                  onChange={(e) => setDraft({ ...draft, value: e.target.value })}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Min order (optional)" htmlFor="minOrder">
                <Input
                  id="minOrder"
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.minOrder}
                  onChange={(e) => setDraft({ ...draft, minOrder: e.target.value })}
                />
              </Field>
              <Field label="Max uses (optional)" htmlFor="maxRedemptions">
                <Input
                  id="maxRedemptions"
                  type="number"
                  min="1"
                  value={draft.maxRedemptions}
                  onChange={(e) => setDraft({ ...draft, maxRedemptions: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Expires (optional)" htmlFor="expiresAt">
              <Input
                id="expiresAt"
                type="date"
                value={draft.expiresAt}
                onChange={(e) => setDraft({ ...draft, expiresAt: e.target.value })}
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDraft(null)}>
                Cancel
              </Button>
              <Button onClick={create} disabled={busy}>
                {busy ? "Creating…" : "Create"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
