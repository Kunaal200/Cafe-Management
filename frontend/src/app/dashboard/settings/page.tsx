"use client";

import { useEffect, useState } from "react";
import { useOutlet } from "@/features/dashboard/outlet-context";
import { useSession } from "@/features/dashboard/session-context";
import { useToast } from "@/features/dashboard/toast";
import { PageHeader, Card } from "@/features/dashboard/ui";
import { Button } from "@/design-system/button";
import { Badge } from "@/design-system/badge";
import { Field } from "@/design-system/field";
import { Input } from "@/design-system/input";
import { PasswordInput } from "@/design-system/password-input";
import { apiFetch, ApiError } from "@/lib/api";
import { humanize } from "@/lib/format";
import { useTheme, THEMES } from "@/features/theme-provider";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const session = useSession();
  const { selected, refresh } = useOutlet();

  // Outlet details are editable by owners and managers.
  const canEditOutlet = ["owner", "manager"].includes(session.role);

  return (
    <>
      <PageHeader title="Settings" subtitle="Your account and outlet details." />

      <div className="grid gap-6 lg:grid-cols-2">
        <AppearanceCard />
        <ProfileCard email={session.email} role={session.role} />
        <PasswordCard />
        {selected && <OutletCard key={selected.id} editable={canEditOutlet} onSaved={refresh} />}
      </div>
    </>
  );
}

function AppearanceCard() {
  const { themeId, dark, setTheme, setDark } = useTheme();
  return (
    <Card>
      <h2 className="mb-1 text-sm font-semibold text-text">Appearance</h2>
      <p className="mb-4 text-xs text-muted">Pick an accent color and light/dark mode. Saved on this device.</p>

      <div className="mb-5 flex flex-wrap gap-3">
        {THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTheme(t.id)}
            aria-label={t.name}
            className={cn(
              "flex flex-col items-center gap-1.5",
            )}
          >
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full ring-offset-2 ring-offset-surface",
                themeId === t.id ? "ring-2 ring-text" : "",
              )}
              style={{ backgroundColor: t.swatch }}
            />
            <span className="text-xs text-muted">{t.name}</span>
          </button>
        ))}
      </div>

      <label className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
        <span className="text-sm font-medium text-text">Dark mode</span>
        <button
          type="button"
          role="switch"
          aria-checked={dark}
          onClick={() => setDark(!dark)}
          className={cn(
            "relative h-6 w-11 rounded-full transition-colors",
            dark ? "bg-primary" : "bg-surface-muted",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow transition-transform",
              dark ? "left-0.5 translate-x-5" : "left-0.5",
            )}
          />
        </button>
      </label>
    </Card>
  );
}

function ProfileCard({ email, role }: { email: string; role: string }) {
  const toast = useToast();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // The session has email/role; fetch the editable profile fields once.
    apiFetch<{ fullName: string; phone: string | null }>("/auth/profile", { auth: true })
      .then((p) => {
        setFullName(p.fullName ?? "");
        setPhone(p.phone ?? "");
      })
      .catch(() => {
        /* fall back to empty; fields are still editable */
      })
      .finally(() => setLoaded(true));
  }, []);

  async function save() {
    setBusy(true);
    try {
      await apiFetch("/auth/profile", {
        method: "PATCH",
        body: { fullName: fullName.trim(), phone: phone.trim() || undefined },
        auth: true,
      });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update profile.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <h2 className="mb-4 text-sm font-semibold text-text">Account</h2>
      <div className="space-y-4">
        <Field label="Full name" htmlFor="fullName">
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={!loaded}
          />
        </Field>
        <Field label="Phone" htmlFor="phone">
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!loaded} />
        </Field>
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted">
            {email || "—"} · <Badge variant="primary">{humanize(role)}</Badge>
          </div>
          <Button onClick={save} disabled={busy || !loaded || !fullName.trim()}>
            {busy ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function PasswordCard() {
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function change() {
    setError(null);
    if (next !== confirm) {
      setError("New passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await apiFetch("/auth/change-password", {
        method: "POST",
        body: { currentPassword: current, newPassword: next },
        auth: true,
      });
      toast.success("Password changed");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not change password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <h2 className="mb-4 text-sm font-semibold text-text">Password</h2>
      <div className="space-y-4">
        {error && <p className="text-sm text-danger">{error}</p>}
        <Field label="Current password" htmlFor="current">
          <PasswordInput id="current" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </Field>
        <Field label="New password" htmlFor="next">
          <PasswordInput id="next" value={next} onChange={(e) => setNext(e.target.value)} placeholder="At least 8 characters" />
        </Field>
        <Field label="Confirm new password" htmlFor="confirm">
          <PasswordInput id="confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        <div className="flex justify-end">
          <Button onClick={change} disabled={busy || !current || !next || !confirm}>
            {busy ? "Changing…" : "Change password"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function OutletCard({ editable, onSaved }: { editable: boolean; onSaved: () => void }) {
  const { selected } = useOutlet();
  const toast = useToast();
  const [name, setName] = useState(selected?.name ?? "");
  const [city, setCity] = useState(selected?.city ?? "");
  const [currency, setCurrency] = useState(selected?.currency ?? "");
  const [timezone, setTimezone] = useState(selected?.timezone ?? "");
  const [busy, setBusy] = useState(false);

  if (!selected) return null;

  async function save() {
    setBusy(true);
    try {
      await apiFetch(`/outlets/${selected!.id}`, {
        method: "PATCH",
        body: {
          name: name.trim(),
          city: city.trim() || null,
          currency: currency.trim().toUpperCase(),
          timezone: timezone.trim(),
        },
        auth: true,
      });
      toast.success("Outlet updated");
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update outlet.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <h2 className="mb-4 text-sm font-semibold text-text">Outlet</h2>
      <div className="space-y-4">
        <Field label="Name" htmlFor="outletName">
          <Input id="outletName" value={name} onChange={(e) => setName(e.target.value)} disabled={!editable} />
        </Field>
        <Field label="City" htmlFor="outletCity">
          <Input id="outletCity" value={city} onChange={(e) => setCity(e.target.value)} disabled={!editable} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Currency" htmlFor="outletCurrency">
            <Input
              id="outletCurrency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              maxLength={3}
              disabled={!editable}
            />
          </Field>
          <Field label="Timezone" htmlFor="outletTimezone">
            <Input
              id="outletTimezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              disabled={!editable}
            />
          </Field>
        </div>
        {editable ? (
          <div className="flex justify-end">
            <Button onClick={save} disabled={busy || !name.trim()}>
              {busy ? "Saving…" : "Save"}
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted">Only owners and managers can edit outlet details.</p>
        )}
      </div>
    </Card>
  );
}
