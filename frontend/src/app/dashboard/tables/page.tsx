"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { TableStatus } from "@cafe/shared";
import { useOutlet } from "@/features/dashboard/outlet-context";
import { PageHeader, Card, StateBlock } from "@/features/dashboard/ui";
import { Button } from "@/design-system/button";
import { Badge } from "@/design-system/badge";
import { Field } from "@/design-system/field";
import { Input } from "@/design-system/input";
import { Modal } from "@/design-system/modal";
import { useConfirm } from "@/design-system/confirm-dialog";
import { useToast } from "@/features/dashboard/toast";
import { useApi } from "@/lib/use-api";
import { apiFetch, ApiError } from "@/lib/api";
import type { RestaurantTable } from "@/lib/types";
import { humanize, tableStatusVariant } from "@/lib/format";

const STATUS_CYCLE: Record<string, string> = {
  [TableStatus.FREE]: TableStatus.OCCUPIED,
  [TableStatus.OCCUPIED]: TableStatus.RESERVED,
  [TableStatus.RESERVED]: TableStatus.FREE,
};

export default function TablesPage() {
  const { selected } = useOutlet();
  const confirm = useConfirm();
  const toast = useToast();
  const { data, error, loading, refetch } = useApi<RestaurantTable[]>(
    selected ? `/tables?outletId=${selected.id}` : null,
  );

  const [modal, setModal] = useState(false);
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [capacity, setCapacity] = useState("2");
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const tables = data ?? [];

  async function createTable() {
    if (!selected) return;
    if (!name.trim()) {
      setFormError("Table name is required.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await apiFetch("/tables", {
        method: "POST",
        body: {
          outletId: selected.id,
          name: name.trim(),
          area: area.trim() || undefined,
          capacity: Number(capacity) || 2,
        },
        auth: true,
      });
      setName("");
      setArea("");
      setCapacity("2");
      setModal(false);
      toast.success("Table added");
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Could not create table.");
    } finally {
      setBusy(false);
    }
  }

  async function cycleStatus(t: RestaurantTable) {
    try {
      await apiFetch(`/tables/${t.id}/status`, {
        method: "PATCH",
        body: { status: STATUS_CYCLE[t.status] },
        auth: true,
      });
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update table status.");
    }
  }

  async function deleteTable(id: string) {
    const ok = await confirm({
      title: "Delete table?",
      description: "This cannot be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await apiFetch(`/tables/${id}`, { method: "DELETE", auth: true });
      toast.success("Table deleted");
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete table.");
    }
  }

  return (
    <>
      <PageHeader
        title="Tables"
        subtitle="Tap a table to cycle its status. Free → Occupied → Reserved."
        actions={
          <Button onClick={() => setModal(true)} disabled={!selected}>
            <Plus className="h-4 w-4" /> Add table
          </Button>
        }
      />

      <StateBlock
        loading={loading && !data}
        error={error}
        empty={tables.length === 0}
        emptyText="No tables yet. Add one to get started."
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {tables.map((t) => (
            <Card key={t.id} className="relative flex flex-col items-center gap-2 p-4 text-center">
              <button
                type="button"
                onClick={() => deleteTable(t.id)}
                className="absolute right-2 top-2 rounded-md p-1 text-muted hover:text-danger"
                aria-label="Delete table"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <p className="text-lg font-semibold text-text">{t.name}</p>
              <p className="text-xs text-muted">
                {t.capacity} seat{t.capacity === 1 ? "" : "s"}
                {t.area ? ` · ${t.area}` : ""}
              </p>
              <button type="button" onClick={() => cycleStatus(t)} className="mt-1">
                <Badge variant={tableStatusVariant(t.status)}>{humanize(t.status)}</Badge>
              </button>
            </Card>
          ))}
        </div>
      </StateBlock>

      <Modal open={modal} onClose={() => setModal(false)} title="Add table">
        <div className="space-y-4">
          {formError && <p className="text-sm text-danger">{formError}</p>}
          <Field label="Table name" htmlFor="tname">
            <Input id="tname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. T5" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Capacity" htmlFor="tcap">
              <Input
                id="tcap"
                type="number"
                min="1"
                max="50"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </Field>
            <Field label="Area" htmlFor="tarea">
              <Input
                id="tarea"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Optional"
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModal(false)}>
              Cancel
            </Button>
            <Button onClick={createTable} disabled={busy}>
              {busy ? "Saving…" : "Add table"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
