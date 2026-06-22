"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader, Card, StateBlock } from "@/features/dashboard/ui";
import { Badge } from "@/design-system/badge";
import { useApi } from "@/lib/use-api";
import { dateTime, humanize } from "@/lib/format";

interface TenantDetail {
  id: string;
  name: string;
  subdomain: string;
  businessType: string | null;
  country: string | null;
  status: string;
  plan: string;
  createdAt: string;
  counts: { outlets: number; users: number; menuItems: number; orders: number };
  subscription: { plan: string; status: string; billingCycle: string; trialEndsAt: string | null } | null;
  outlets: { id: string; name: string; city: string | null; currency: string }[];
  staff: { id: string; fullName: string; username: string | null; role: string; isActive: boolean }[];
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <p className="text-sm text-muted">{label}</p>
      <p className="text-2xl font-bold text-text">{value}</p>
    </Card>
  );
}

export default function TenantDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { data, error, loading } = useApi<TenantDetail>(
    params.id ? `/admin/tenants/${params.id}` : null,
  );

  return (
    <>
      <button
        type="button"
        onClick={() => router.push("/admin")}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" /> All tenants
      </button>

      <StateBlock loading={loading && !data} error={error} empty={!data && !loading}>
        {data && (
          <>
            <PageHeader
              title={data.name}
              subtitle={`${data.subdomain}${data.country ? ` · ${data.country}` : ""}${data.businessType ? ` · ${humanize(data.businessType)}` : ""}`}
              actions={<Badge variant={data.status === "active" ? "success" : "accent"}>{humanize(data.status)}</Badge>}
            />

            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Outlets" value={data.counts.outlets} />
              <Metric label="Staff & users" value={data.counts.users} />
              <Metric label="Menu items" value={data.counts.menuItems} />
              <Metric label="Orders" value={data.counts.orders} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <h2 className="mb-3 text-sm font-semibold text-text">Subscription</h2>
                {data.subscription ? (
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted">Plan</dt>
                      <dd className="font-medium capitalize text-text">{data.subscription.plan}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted">Status</dt>
                      <dd><Badge variant={data.subscription.status === "active" ? "success" : "accent"}>{humanize(data.subscription.status)}</Badge></dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted">Billing</dt>
                      <dd className="font-medium capitalize text-text">{data.subscription.billingCycle}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted">Joined</dt>
                      <dd className="font-medium text-text">{dateTime(data.createdAt)}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-sm text-muted">No subscription record.</p>
                )}
              </Card>

              <Card className="p-0">
                <h2 className="border-b border-border px-5 py-3 text-sm font-semibold text-text">Outlets</h2>
                {data.outlets.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-muted">No outlets.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {data.outlets.map((o) => (
                      <li key={o.id} className="flex items-center justify-between px-5 py-3 text-sm">
                        <span className="font-medium text-text">{o.name}</span>
                        <span className="text-muted">{o.city ?? "—"} · {o.currency}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card className="p-0 lg:col-span-2">
                <h2 className="border-b border-border px-5 py-3 text-sm font-semibold text-text">Staff</h2>
                {data.staff.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-muted">No staff accounts.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {data.staff.map((s) => (
                      <li key={s.id} className="flex items-center justify-between px-5 py-3 text-sm">
                        <span>
                          <span className="font-medium text-text">{s.fullName}</span>
                          {s.username && <span className="text-muted"> · {s.username}</span>}
                        </span>
                        <span className="flex items-center gap-2">
                          <Badge variant="primary">{humanize(s.role)}</Badge>
                          <Badge variant={s.isActive ? "success" : "neutral"}>{s.isActive ? "Active" : "Disabled"}</Badge>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </>
        )}
      </StateBlock>
    </>
  );
}
