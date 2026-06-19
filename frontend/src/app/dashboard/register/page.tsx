"use client";

import { useState } from "react";
import { Lock, Unlock } from "lucide-react";
import { useOutlet } from "@/features/dashboard/outlet-context";
import { useToast } from "@/features/dashboard/toast";
import { PageHeader, Card, StateBlock } from "@/features/dashboard/ui";
import { Button } from "@/design-system/button";
import { Badge } from "@/design-system/badge";
import { Field } from "@/design-system/field";
import { Input } from "@/design-system/input";
import { useApi } from "@/lib/use-api";
import { apiFetch, ApiError } from "@/lib/api";
import type { RegisterShift, ShiftReconciliation } from "@/lib/types";
import { money, dateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const { selected, currency } = useOutlet();
  const toast = useToast();

  const current = useApi<RegisterShift | null>(
    selected ? `/register/current?outletId=${selected.id}` : null,
  );
  const history = useApi<RegisterShift[]>(
    selected ? `/register?outletId=${selected.id}` : null,
  );

  const [openingCash, setOpeningCash] = useState("");
  const [closingCash, setClosingCash] = useState("");
  const [busy, setBusy] = useState(false);
  const [recon, setRecon] = useState<ShiftReconciliation | null>(null);

  const shift = current.data ?? null;

  function refreshAll() {
    current.refetch();
    history.refetch();
  }

  async function openShift() {
    if (!selected) return;
    const amount = Number(openingCash);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error("Enter a valid opening cash amount.");
      return;
    }
    setBusy(true);
    try {
      await apiFetch("/register/open", {
        method: "POST",
        body: { outletId: selected.id, openingCash: amount },
        auth: true,
      });
      toast.success("Shift opened");
      setOpeningCash("");
      setRecon(null);
      refreshAll();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not open shift.");
    } finally {
      setBusy(false);
    }
  }

  async function closeShift() {
    if (!shift) return;
    const amount = Number(closingCash);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error("Enter the counted cash amount.");
      return;
    }
    setBusy(true);
    try {
      const res = await apiFetch<{ reconciliation: ShiftReconciliation }>(
        `/register/${shift.id}/close`,
        { method: "POST", body: { closingCash: amount }, auth: true },
      );
      toast.success("Shift closed");
      setRecon(res.reconciliation);
      setClosingCash("");
      refreshAll();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not close shift.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Register"
        subtitle="Open and close cash shifts, and reconcile the drawer."
      />

      <StateBlock
        loading={current.loading && !current.data && current.data !== null}
        error={current.error}
        empty={!selected}
        emptyText="Select an outlet to manage its register."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Current shift / open form */}
          <Card>
            {shift ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-text">Current shift</h2>
                  <Badge variant="success">Open</Badge>
                </div>
                <dl className="mb-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted">Opened</dt>
                    <dd className="font-medium text-text">{dateTime(shift.openedAt)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Opening cash</dt>
                    <dd className="font-medium text-text">{money(shift.openingCash, currency)}</dd>
                  </div>
                </dl>
                <Field label="Counted cash at close" htmlFor="closingCash">
                  <Input
                    id="closingCash"
                    type="number"
                    min="0"
                    step="0.01"
                    value={closingCash}
                    onChange={(e) => setClosingCash(e.target.value)}
                    placeholder="0.00"
                  />
                </Field>
                <Button className="mt-4 w-full" variant="danger" onClick={closeShift} disabled={busy}>
                  <Lock className="h-4 w-4" /> Close shift
                </Button>
              </>
            ) : (
              <>
                <h2 className="mb-4 text-sm font-semibold text-text">Open a shift</h2>
                <Field label="Opening cash (float)" htmlFor="openingCash">
                  <Input
                    id="openingCash"
                    type="number"
                    min="0"
                    step="0.01"
                    value={openingCash}
                    onChange={(e) => setOpeningCash(e.target.value)}
                    placeholder="0.00"
                  />
                </Field>
                <Button className="mt-4 w-full" onClick={openShift} disabled={busy}>
                  <Unlock className="h-4 w-4" /> Open shift
                </Button>
              </>
            )}

            {recon && (
              <div className="mt-5 rounded-lg border border-border bg-surface-muted p-4">
                <h3 className="mb-2 text-sm font-semibold text-text">Reconciliation</h3>
                <dl className="space-y-1 text-sm">
                  <Row label="Opening cash" value={money(recon.openingCash, currency)} />
                  <Row label="Expected cash" value={money(recon.expectedCash, currency)} />
                  <Row label="Counted cash" value={money(recon.countedCash, currency)} />
                  <div className="flex justify-between border-t border-border pt-1 font-semibold">
                    <span className="text-text">Difference</span>
                    <span
                      className={cn(
                        recon.difference === 0
                          ? "text-text"
                          : recon.difference > 0
                            ? "text-success"
                            : "text-danger",
                      )}
                    >
                      {recon.difference > 0 ? "+" : ""}
                      {money(recon.difference, currency)}
                      {recon.difference < 0 ? " (short)" : recon.difference > 0 ? " (over)" : ""}
                    </span>
                  </div>
                </dl>
              </div>
            )}
          </Card>

          {/* History */}
          <Card className="p-0">
            <h2 className="border-b border-border px-5 py-3 text-sm font-semibold text-text">
              Shift history
            </h2>
            <StateBlock
              loading={history.loading && !history.data}
              error={history.error}
              empty={(history.data ?? []).length === 0}
              emptyText="No shifts recorded yet."
            >
              <ul className="divide-y divide-border">
                {(history.data ?? []).map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                    <div>
                      <p className="font-medium text-text">{dateTime(s.openedAt)}</p>
                      <p className="text-xs text-muted">
                        Open {money(s.openingCash, currency)}
                        {s.closingCash != null ? ` · Close ${money(s.closingCash, currency)}` : ""}
                      </p>
                    </div>
                    <Badge variant={s.closedAt ? "neutral" : "success"}>
                      {s.closedAt ? "Closed" : "Open"}
                    </Badge>
                  </li>
                ))}
              </ul>
            </StateBlock>
          </Card>
        </div>
      </StateBlock>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
