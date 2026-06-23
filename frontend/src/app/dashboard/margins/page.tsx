"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, AlertTriangle } from "lucide-react";
import { useOutlet } from "@/features/dashboard/outlet-context";
import { useToast } from "@/features/dashboard/toast";
import { PageHeader, Card, StateBlock, Spinner } from "@/features/dashboard/ui";
import { Button } from "@/design-system/button";
import { Badge } from "@/design-system/badge";
import { Select } from "@/design-system/select";
import { Input } from "@/design-system/input";
import { Modal } from "@/design-system/modal";
import { useApi } from "@/lib/use-api";
import { apiFetch, ApiError } from "@/lib/api";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";

interface MarginRow {
  menuItemId: string;
  name: string;
  price: number;
  cost: number;
  profit: number;
  marginPct: number | null;
  hasRecipe: boolean;
  lowMargin: boolean;
}

interface InvItem {
  id: string;
  name: string;
  unit: string;
}

interface RecipeRow {
  id: string;
  inventoryItemId: string;
  qty: string;
  inventoryItem: { id: string; name: string; unit: string };
}

export default function MarginsPage() {
  const { currency } = useOutlet();
  const { data, error, loading, refetch } = useApi<MarginRow[]>("/recipe/margins");
  const inventory = useApi<InvItem[]>("/inventory");
  const [editing, setEditing] = useState<MarginRow | null>(null);

  const rows = data ?? [];
  const lowCount = rows.filter((r) => r.lowMargin).length;

  return (
    <>
      <PageHeader
        title="Cost & margins"
        subtitle="Live recipe costing. Link ingredients to see profit on every item."
      />

      {lowCount > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <span className="text-text">
            {lowCount} item{lowCount === 1 ? "" : "s"} below 70% margin — review pricing or costs.
          </span>
        </div>
      )}

      <StateBlock
        loading={loading && !data}
        error={error}
        empty={rows.length === 0}
        emptyText="No menu items yet."
      >
        <Card className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Item</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Cost</th>
                <th className="px-5 py-3 font-medium">Profit</th>
                <th className="px-5 py-3 font-medium">Margin</th>
                <th className="px-5 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.menuItemId} className={cn(r.lowMargin && "bg-danger/5")}>
                  <td className="px-5 py-3 font-medium text-text">{r.name}</td>
                  <td className="px-5 py-3 text-muted">{money(r.price, currency)}</td>
                  <td className="px-5 py-3 text-muted">{r.hasRecipe ? money(r.cost, currency) : "—"}</td>
                  <td className="px-5 py-3 text-muted">{r.hasRecipe ? money(r.profit, currency) : "—"}</td>
                  <td className="px-5 py-3">
                    {r.marginPct == null ? (
                      <span className="text-xs text-muted">No recipe</span>
                    ) : (
                      <Badge variant={r.lowMargin ? "danger" : "success"}>{r.marginPct}%</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(r)}>
                      <Pencil className="h-4 w-4" /> Recipe
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </StateBlock>

      {editing && (
        <RecipeEditor
          row={editing}
          currency={currency}
          inventory={inventory.data ?? []}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refetch();
          }}
        />
      )}
    </>
  );
}

function RecipeEditor({
  row,
  currency,
  inventory,
  onClose,
  onSaved,
}: {
  row: MarginRow;
  currency: string;
  inventory: InvItem[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [rows, setRows] = useState<{ inventoryItemId: string; qty: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiFetch<RecipeRow[]>(`/recipe/${row.menuItemId}`, { auth: true })
      .then((data) =>
        setRows(data.map((r) => ({ inventoryItemId: r.inventoryItemId, qty: String(r.qty) }))),
      )
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [row.menuItemId]);

  function addRow() {
    if (inventory.length === 0) return;
    setRows((rs) => [...rs, { inventoryItemId: inventory[0].id, qty: "" }]);
  }

  async function save() {
    const ingredients = rows
      .filter((r) => r.inventoryItemId && Number(r.qty) > 0)
      .map((r) => ({ inventoryItemId: r.inventoryItemId, qty: Number(r.qty) }));
    setBusy(true);
    try {
      await apiFetch(`/recipe/${row.menuItemId}`, { method: "PUT", body: { ingredients }, auth: true });
      toast.success("Recipe saved");
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save recipe.");
    } finally {
      setBusy(false);
    }
  }

  const unitFor = (id: string) => inventory.find((i) => i.id === id)?.unit ?? "";

  return (
    <Modal open onClose={onClose} title={`Recipe — ${row.name}`} description="Set how much of each ingredient one serving uses.">
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted">
          <Spinner /> Loading…
        </div>
      ) : inventory.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">Add inventory items first to build a recipe.</p>
      ) : (
        <div className="space-y-3">
          {rows.length === 0 && <p className="text-sm text-muted">No ingredients yet.</p>}
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <Select
                value={r.inventoryItemId}
                onChange={(e) =>
                  setRows((rs) => rs.map((x, idx) => (idx === i ? { ...x, inventoryItemId: e.target.value } : x)))
                }
              >
                {inventory.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.name}
                  </option>
                ))}
              </Select>
              <Input
                type="number"
                min="0"
                step="0.001"
                placeholder="Qty"
                className="w-28"
                value={r.qty}
                onChange={(e) => setRows((rs) => rs.map((x, idx) => (idx === i ? { ...x, qty: e.target.value } : x)))}
              />
              <span className="w-10 text-xs text-muted">{unitFor(r.inventoryItemId)}</span>
              <button
                type="button"
                onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))}
                className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-danger"
                aria-label="Remove ingredient"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          <Button type="button" variant="secondary" size="sm" onClick={addRow}>
            <Plus className="h-4 w-4" /> Add ingredient
          </Button>

          <p className="pt-2 text-xs text-muted">
            Sells for {money(row.price, currency)}. Margins update after saving.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save recipe"}</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
