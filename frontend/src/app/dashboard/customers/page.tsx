"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, UserRound } from "lucide-react";
import { useOutlet } from "@/features/dashboard/outlet-context";
import { useToast } from "@/features/dashboard/toast";
import { PageHeader, Card, StateBlock } from "@/features/dashboard/ui";
import { Button } from "@/design-system/button";
import { Field } from "@/design-system/field";
import { Input } from "@/design-system/input";
import { Modal } from "@/design-system/modal";
import { useApi } from "@/lib/use-api";
import { apiFetch, ApiError } from "@/lib/api";
import { money, dateTime } from "@/lib/format";

interface CustomerRow {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
  visits: number;
  spend: number;
}

export default function CustomersPage() {
  const router = useRouter();
  const { currency } = useOutlet();
  const toast = useToast();
  const { data, error, loading, refetch } = useApi<CustomerRow[]>("/customers");

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const customers = data ?? [];

  async function create() {
    if (!name.trim() && !phone.trim()) {
      setFormError("Enter at least a name or phone.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await apiFetch("/customers", {
        method: "POST",
        body: { name: name.trim() || undefined, phone: phone.trim() || undefined, email: email.trim() || undefined },
        auth: true,
      });
      toast.success("Customer added");
      setName("");
      setPhone("");
      setEmail("");
      setOpen(false);
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Could not add customer.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="Your customer list with visits and spend."
        actions={
          <Button onClick={() => { setFormError(null); setOpen(true); }}>
            <Plus className="h-4 w-4" /> Add customer
          </Button>
        }
      />

      <StateBlock
        loading={loading && !data}
        error={error}
        empty={customers.length === 0}
        emptyText="No customers yet. Add one to start tracking visits."
      >
        <Card className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Visits</th>
                <th className="px-5 py-3 font-medium">Spend</th>
                <th className="px-5 py-3 font-medium">Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => router.push(`/dashboard/customers/${c.id}`)}
                  className="cursor-pointer hover:bg-surface-muted"
                >
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-2 font-medium text-text">
                      <UserRound className="h-4 w-4 text-muted" /> {c.name || "Guest"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted">{c.phone || c.email || "—"}</td>
                  <td className="px-5 py-3 text-muted">{c.visits}</td>
                  <td className="px-5 py-3 font-medium text-text">{money(c.spend, currency)}</td>
                  <td className="px-5 py-3 text-muted">{dateTime(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </StateBlock>

      <Modal open={open} onClose={() => setOpen(false)} title="Add customer">
        <div className="space-y-4">
          {formError && <p className="text-sm text-danger">{formError}</p>}
          <Field label="Name" htmlFor="cname">
            <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alex" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone" htmlFor="cphone">
              <Input id="cphone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <Field label="Email" htmlFor="cemail">
              <Input id="cemail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create} disabled={busy}>{busy ? "Saving…" : "Add"}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
