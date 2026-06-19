"use client";

import { useOutlet } from "@/features/dashboard/outlet-context";
import { PageHeader, Card, StateBlock } from "@/features/dashboard/ui";
import { Badge } from "@/design-system/badge";
import { useApi } from "@/lib/use-api";
import type { MeResponse } from "@/lib/types";
import { humanize } from "@/lib/format";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-sm font-medium text-text">{value}</dd>
    </div>
  );
}

export default function SettingsPage() {
  const { data: me, error, loading } = useApi<MeResponse>("/auth/me");
  const { selected, outlets } = useOutlet();

  return (
    <>
      <PageHeader title="Settings" subtitle="Your account and outlet details." />

      <StateBlock loading={loading && !me} error={error}>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="mb-1 text-sm font-semibold text-text">Account</h2>
            <p className="mb-2 text-xs text-muted">Profile editing is coming soon.</p>
            <dl className="divide-y divide-border">
              <Row label="Email" value={me?.email || "—"} />
              <Row label="Role" value={me ? <Badge variant="primary">{humanize(me.role)}</Badge> : "—"} />
            </dl>
          </Card>

          <Card>
            <h2 className="mb-1 text-sm font-semibold text-text">Current outlet</h2>
            <p className="mb-2 text-xs text-muted">{outlets.length} outlet{outlets.length === 1 ? "" : "s"} total.</p>
            {selected ? (
              <dl className="divide-y divide-border">
                <Row label="Name" value={selected.name} />
                <Row label="City" value={selected.city || "—"} />
                <Row label="Currency" value={selected.currency} />
                <Row label="Timezone" value={selected.timezone} />
                <Row
                  label="Service types"
                  value={
                    selected.serviceTypes.length
                      ? selected.serviceTypes.map(humanize).join(", ")
                      : "—"
                  }
                />
              </dl>
            ) : (
              <p className="text-sm text-muted">No outlet selected.</p>
            )}
          </Card>
        </div>
      </StateBlock>
    </>
  );
}
