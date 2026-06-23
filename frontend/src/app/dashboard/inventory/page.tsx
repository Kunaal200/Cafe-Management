"use client";

import { useState } from "react";
import { Plus, Trash2, PackagePlus, Minus, AlertTriangle, Boxes } from "lucide-react";
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
import { dateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface InvItem {
  id: string;
  name: string;
  unit: string;
  reorderLevel: number;
  perishable: boolean;
  stockOnHand: number;
  avgDailyUse: number;
  nearestExpiry: string | null;
  lowStock: boolean;
}

interface InvAlert {
  itemId: string;
  itemName: string;
  type: "expiry" | "overstock" | "low_stock";
  severity: "high" | "medium" | "low";
  message: string;
  stockOnHand: number;
  unit: string;
}

const alertVariant = { high: "danger", medium: "warning", low: "neutral" } as const;

export default function InventoryPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const items = useApi<InvItem[]>("/inventory");
  const alerts = useApi<InvAlert[]>("/inventory/alerts", { pollMs: 60000 });

  const [addOpen, setAddOpen] = useState(false);
  const [receiveFor, setReceiveFor] = useState<InvItem | null>(null);
  const [useFor, setUseFor] = useState<InvItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Add-item form
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("unit");
  const [reorder, setReorder] = useState("");
  const [perishable, setPerishable] = useState(false);

  // Receive form
  const [qty, setQty] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  // Use/waste form
  const [moveType, setMoveType] = useState<"out" | "waste" | "adjust">("out");
  const [moveQty, setMoveQty] = useState("");
  const [moveReason, setMoveReason] = useState("");

  const list = items.data ?? [];
  const alertList = alerts.data ?? [];

  function refetchAll() {
    items.refetch();
    alerts.refetch();
  }

  async function addItem() {
    if (!name.trim()) {
      setFormError("Name is required.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await apiFetch("/inventory", {
        method: "POST",
        body: {
          name: name.trim(),
          unit: unit.trim() || "unit",
          reorderLevel: reorder.trim() ? Number(reorder) : undefined,
          perishable,
        },
        auth: true,
      });
      toast.success("Item added");
      setName(""); setUnit("unit"); setReorder(""); setPerishable(false);
      setAddOpen(false);
      items.refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Could not add item.");
    } finally {
      setBusy(false);
    }
  }

  async function receive() {
    if (!receiveFor) return;
    const q = Number(qty);
    const c = Number(unitCost);
    if (!Number.isFinite(q) || q <= 0 || !Number.isFinite(c) || c < 0) {
      setFormError("Enter a valid quantity and cost.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await apiFetch(`/inventory/${receiveFor.id}/receive`, {
        method: "POST",
        body: { qty: q, unitCost: c, expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined },
        auth: true,
      });
      toast.success("Stock received");
      setQty(""); setUnitCost(""); setExpiresAt("");
      setReceiveFor(null);
      refetchAll();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Could not receive stock.");
    } finally {
      setBusy(false);
    }
  }

  async function recordMove() {
    if (!useFor) return;
    const q = Number(moveQty);
    if (!Number.isFinite(q) || q <= 0) {
      setFormError("Enter a valid quantity.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await apiFetch(`/inventory/${useFor.id}/movement`, {
        method: "POST",
        body: { type: moveType, qty: q, reason: moveReason.trim() || undefined },
        auth: true,
      });
      toast.success("Recorded");
      setMoveQty(""); setMoveReason(""); setMoveType("out");
      setUseFor(null);
      refetchAll();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Could not record movement.");
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(item: InvItem) {
    const ok = await confirm({
      title: "Delete item?",
      description: `Delete "${item.name}" and its stock history? This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await apiFetch(`/inventory/${item.id}`, { method: "DELETE", auth: true });
      toast.success("Item deleted");
      refetchAll();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete item.");
    }
  }

  return (
    <>
      <PageHeader
        title="Inventory"
        subtitle="Track stock, expiry, and get smart waste alerts."
        actions={
          <Button onClick={() => { setFormError(null); setAddOpen(true); }}>
            <Plus className="h-4 w-4" /> Add item
          </Button>
        }
      />

      {/* Smart alerts */}
      {alertList.length > 0 && (
        <div className="mb-6 space-y-2">
          {alertList.map((a, i) => (
            <div
              key={i}
              className={cn(
                "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm",
                a.severity === "high"
                  ? "border-danger/30 bg-danger/10 text-danger"
                  : "border-warning/30 bg-warning/10 text-warning",
              )}
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex-1 text-text">{a.message}</span>
              <Badge variant={alertVariant[a.severity]}>{a.type.replace("_", " ")}</Badge>
            </div>
          ))}
        </div>
      )}

      <StateBlock
        loading={items.loading && !items.data}
        error={items.error}
        empty={list.length === 0}
        emptyText="No inventory items yet. Add ingredients like milk, beans, or syrups."
      >
        <Card className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Item</th>
                <th className="px-5 py-3 font-medium">On hand</th>
                <th className="px-5 py-3 font-medium">Avg/day</th>
                <th className="px-5 py-3 font-medium">Nearest expiry</th>
                <th className="px-5 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((it) => (
                <tr key={it.id}>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-2 font-medium text-text">
                      <Boxes className="h-4 w-4 text-muted" /> {it.name}
                    </span>
                    {it.lowStock && <Badge variant="warning" className="ml-2">Low</Badge>}
                  </td>
                  <td className="px-5 py-3 text-text">
                    {it.stockOnHand} {it.unit}
                  </td>
                  <td className="px-5 py-3 text-muted">{it.avgDailyUse} {it.unit}</td>
                  <td className="px-5 py-3 text-muted">{it.nearestExpiry ? dateTime(it.nearestExpiry) : "—"}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setFormError(null); setReceiveFor(it); }}>
                        <PackagePlus className="h-4 w-4" /> Receive
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setFormError(null); setUseFor(it); }}>
                        <Minus className="h-4 w-4" /> Use
                      </Button>
                      <button
                        type="button"
                        onClick={() => removeItem(it)}
                        className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-danger"
                        aria-label="Delete item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </StateBlock>

      {/* Add item */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add inventory item">
        <div className="space-y-4">
          {formError && <p className="text-sm text-danger">{formError}</p>}
          <Field label="Name" htmlFor="iname">
            <Input id="iname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Oat milk" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Unit" htmlFor="iunit">
              <Select id="iunit" value={unit} onChange={(e) => setUnit(e.target.value)}>
                {["unit", "L", "ml", "kg", "g", "pcs"].map((u) => <option key={u} value={u}>{u}</option>)}
              </Select>
            </Field>
            <Field label="Reorder level" htmlFor="ireorder">
              <Input id="ireorder" type="number" min="0" step="0.001" value={reorder} onChange={(e) => setReorder(e.target.value)} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="checkbox" checked={perishable} onChange={(e) => setPerishable(e.target.checked)} className="h-4 w-4 rounded border-border" />
            Perishable (track expiry)
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={addItem} disabled={busy}>{busy ? "Saving…" : "Add"}</Button>
          </div>
        </div>
      </Modal>

      {/* Receive stock */}
      <Modal open={receiveFor !== null} onClose={() => setReceiveFor(null)} title={`Receive ${receiveFor?.name ?? ""}`}>
        <div className="space-y-4">
          {formError && <p className="text-sm text-danger">{formError}</p>}
          <div className="grid grid-cols-2 gap-4">
            <Field label={`Quantity (${receiveFor?.unit ?? ""})`} htmlFor="rqty">
              <Input id="rqty" type="number" min="0" step="0.001" value={qty} onChange={(e) => setQty(e.target.value)} />
            </Field>
            <Field label="Unit cost" htmlFor="rcost">
              <Input id="rcost" type="number" min="0" step="0.0001" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} />
            </Field>
          </div>
          <Field label="Expiry date (optional)" htmlFor="rexp">
            <Input id="rexp" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setReceiveFor(null)}>Cancel</Button>
            <Button onClick={receive} disabled={busy}>{busy ? "Saving…" : "Receive"}</Button>
          </div>
        </div>
      </Modal>

      {/* Use / waste */}
      <Modal open={useFor !== null} onClose={() => setUseFor(null)} title={`Record usage — ${useFor?.name ?? ""}`}>
        <div className="space-y-4">
          {formError && <p className="text-sm text-danger">{formError}</p>}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Type" htmlFor="mtype">
              <Select id="mtype" value={moveType} onChange={(e) => setMoveType(e.target.value as "out" | "waste" | "adjust")}>
                <option value="out">Used</option>
                <option value="waste">Wasted</option>
                <option value="adjust">Adjustment</option>
              </Select>
            </Field>
            <Field label={`Quantity (${useFor?.unit ?? ""})`} htmlFor="mqty">
              <Input id="mqty" type="number" min="0" step="0.001" value={moveQty} onChange={(e) => setMoveQty(e.target.value)} />
            </Field>
          </div>
          <Field label="Reason (optional)" htmlFor="mreason">
            <Input id="mreason" value={moveReason} onChange={(e) => setMoveReason(e.target.value)} placeholder="e.g. spillage" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setUseFor(null)}>Cancel</Button>
            <Button onClick={recordMove} disabled={busy}>{busy ? "Saving…" : "Record"}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
