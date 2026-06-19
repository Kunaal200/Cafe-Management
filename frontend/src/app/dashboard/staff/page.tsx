"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, KeyRound } from "lucide-react";
import { assignableStaffRoles } from "@cafe/shared";
import { useOutlet } from "@/features/dashboard/outlet-context";
import { useToast } from "@/features/dashboard/toast";
import { PageHeader, Card, StateBlock } from "@/features/dashboard/ui";
import { Button } from "@/design-system/button";
import { Badge } from "@/design-system/badge";
import { Field } from "@/design-system/field";
import { Input } from "@/design-system/input";
import { Select } from "@/design-system/select";
import { Modal } from "@/design-system/modal";
import { useConfirm } from "@/design-system/confirm-dialog";
import { PasswordInput } from "@/design-system/password-input";
import { useApi } from "@/lib/use-api";
import { apiFetch, ApiError } from "@/lib/api";
import type { Staff } from "@/lib/types";
import { humanize } from "@/lib/format";

interface StaffDraft {
  id?: string;
  fullName: string;
  username: string;
  password: string;
  role: string;
  phone: string;
  posPin: string;
  isActive: boolean;
}

const emptyDraft: StaffDraft = {
  fullName: "",
  username: "",
  password: "",
  role: assignableStaffRoles[0],
  phone: "",
  posPin: "",
  isActive: true,
};

export default function StaffPage() {
  const { outlets } = useOutlet();
  const toast = useToast();
  const confirm = useConfirm();
  const { data, error, loading, refetch } = useApi<Staff[]>("/staff");

  const [draft, setDraft] = useState<StaffDraft | null>(null);
  const [resetFor, setResetFor] = useState<Staff | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const staff = data ?? [];

  function openNew() {
    setFormError(null);
    setDraft({ ...emptyDraft });
  }

  function openEdit(s: Staff) {
    setFormError(null);
    setDraft({
      id: s.id,
      fullName: s.fullName,
      username: s.username ?? "",
      password: "",
      role: s.role,
      phone: s.phone ?? "",
      posPin: s.posPin ?? "",
      isActive: s.isActive,
    });
  }

  async function saveStaff() {
    if (!draft) return;
    setBusy(true);
    setFormError(null);
    try {
      if (draft.id) {
        await apiFetch(`/staff/${draft.id}`, {
          method: "PATCH",
          body: {
            fullName: draft.fullName.trim(),
            role: draft.role,
            phone: draft.phone.trim() || undefined,
            posPin: draft.posPin.trim() || undefined,
            isActive: draft.isActive,
          },
          auth: true,
        });
        toast.success("Staff updated");
      } else {
        await apiFetch("/staff", {
          method: "POST",
          body: {
            fullName: draft.fullName.trim(),
            username: draft.username.trim(),
            password: draft.password,
            role: draft.role,
            phone: draft.phone.trim() || undefined,
            posPin: draft.posPin.trim() || undefined,
          },
          auth: true,
        });
        toast.success("Staff created");
      }
      setDraft(null);
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Could not save staff member.");
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    if (!resetFor) return;
    setBusy(true);
    setFormError(null);
    try {
      await apiFetch(`/staff/${resetFor.id}/password`, {
        method: "PATCH",
        body: { password: newPassword },
        auth: true,
      });
      toast.success(`Password reset for ${resetFor.fullName}`);
      setResetFor(null);
      setNewPassword("");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Could not reset password.");
    } finally {
      setBusy(false);
    }
  }

  async function removeStaff(s: Staff) {
    const ok = await confirm({
      title: "Remove staff member?",
      description: `${s.fullName} will lose access. This cannot be undone.`,
      confirmLabel: "Remove",
      danger: true,
    });
    if (!ok) return;
    try {
      await apiFetch(`/staff/${s.id}`, { method: "DELETE", auth: true });
      toast.success("Staff removed");
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not remove staff member.");
    }
  }

  function outletName(id: string | null): string {
    if (!id) return "All outlets";
    return outlets.find((o) => o.id === id)?.name ?? "—";
  }

  return (
    <>
      <PageHeader
        title="Staff"
        subtitle="Create and manage staff accounts. They log in with the workspace name + username."
        actions={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" /> Add staff
          </Button>
        }
      />

      <StateBlock
        loading={loading && !data}
        error={error}
        empty={staff.length === 0}
        emptyText="No staff yet. Add cashiers, waiters, or kitchen accounts."
      >
        <Card className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Username</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {staff.map((s) => (
                <tr key={s.id}>
                  <td className="px-5 py-3 font-medium text-text">{s.fullName}</td>
                  <td className="px-5 py-3 text-muted">{s.username ?? "—"}</td>
                  <td className="px-5 py-3">
                    <Badge variant="primary">{humanize(s.role)}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={s.isActive ? "success" : "neutral"}>
                      {s.isActive ? "Active" : "Disabled"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(s)}
                        className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-text"
                        aria-label="Edit staff"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormError(null);
                          setNewPassword("");
                          setResetFor(s);
                        }}
                        className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-text"
                        aria-label="Reset password"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeStaff(s)}
                        className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-danger"
                        aria-label="Remove staff"
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

      {/* Create / edit modal */}
      <Modal
        open={draft !== null}
        onClose={() => setDraft(null)}
        title={draft?.id ? "Edit staff" : "Add staff"}
      >
        {draft && (
          <div className="space-y-4">
            {formError && <p className="text-sm text-danger">{formError}</p>}

            <Field label="Full name" htmlFor="fullName">
              <Input
                id="fullName"
                value={draft.fullName}
                onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
                placeholder="e.g. Priya Sharma"
              />
            </Field>

            {!draft.id && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Username" htmlFor="username">
                  <Input
                    id="username"
                    value={draft.username}
                    onChange={(e) => setDraft({ ...draft, username: e.target.value.toLowerCase() })}
                    placeholder="e.g. priya"
                  />
                </Field>
                <Field label="Password" htmlFor="password">
                  <PasswordInput
                    id="password"
                    value={draft.password}
                    onChange={(e) => setDraft({ ...draft, password: e.target.value })}
                    placeholder="At least 8 characters"
                  />
                </Field>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field label="Role" htmlFor="role">
                <Select
                  id="role"
                  value={draft.role}
                  onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                >
                  {assignableStaffRoles.map((r) => (
                    <option key={r} value={r}>
                      {humanize(r)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="POS PIN (optional)" htmlFor="posPin">
                <Input
                  id="posPin"
                  inputMode="numeric"
                  maxLength={6}
                  value={draft.posPin}
                  onChange={(e) => setDraft({ ...draft, posPin: e.target.value })}
                  placeholder="4-6 digits"
                />
              </Field>
            </div>

            <Field label="Phone (optional)" htmlFor="phone">
              <Input
                id="phone"
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              />
            </Field>

            {draft.id && (
              <label className="flex items-center gap-2 text-sm text-text">
                <input
                  type="checkbox"
                  checked={draft.isActive}
                  onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-border"
                />
                Account active
              </label>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDraft(null)}>
                Cancel
              </Button>
              <Button onClick={saveStaff} disabled={busy}>
                {busy ? "Saving…" : draft.id ? "Save" : "Create"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reset password modal */}
      <Modal
        open={resetFor !== null}
        onClose={() => setResetFor(null)}
        title="Reset password"
        description={resetFor ? `Set a new password for ${resetFor.fullName}.` : undefined}
      >
        <div className="space-y-4">
          {formError && <p className="text-sm text-danger">{formError}</p>}
          <Field label="New password" htmlFor="newPassword">
            <PasswordInput
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setResetFor(null)}>
              Cancel
            </Button>
            <Button onClick={resetPassword} disabled={busy || !newPassword}>
              {busy ? "Resetting…" : "Reset password"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
