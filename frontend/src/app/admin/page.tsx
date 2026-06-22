"use client";

import { useRouter } from "next/navigation";
import { Building2, Store, ReceiptText, Sparkles } from "lucide-react";
import { PageHeader, Card, StateBlock } from "@/features/dashboard/ui";
import { Badge } from "@/design-system/badge";
import { useApi } from "@/lib/use-api";
import { dateTime, humanize } from "@/lib/format";

interface AdminStats {
  tenants: number;
  active: number;
  trial: number;
  outlets: number;
  orders: number;
}

interface TenantRow {
  id: string;
  name: string;
  subdomain: string;
  businessType: string | null;
  country: string | null;
  status: string;
  plan: string;
  createdAt: string;
  outlets: number;
  users: number;
  subscription: { plan: string; status: string } | null;
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="flex items-center gap-4">
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm text-muted">{label}</p>
        <p className="text-xl font-bold text-text">{value}</p>
      </div>
    </Card>
  );
}

function statusVariant(status: string): "success" | "accent" | "warning" | "neutral" | "danger" {
  switch (status) {
    case "active":
      return "success";
    case "trial":
    case "configuring":
      return "accent";
    case "suspended":
      return "warning";
    case "churned":
      return "danger";
    default:
      return "neutral";
  }
}

export default function AdminHome() {
  const router = useRouter();
  const stats = useApi<AdminStats>("/admin/stats");
  const tenants = useApi<TenantRow[]>("/admin/tenants");

  const list = tenants.data ?? [];

  return (
    <>
      <PageHeader title="Platform overview" subtitle="All tenants on BrewDesk." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Tenants" value={String(stats.data?.tenants ?? "—")} icon={Building2} />
        <Stat label="Active" value={String(stats.data?.active ?? "—")} icon={Sparkles} />
        <Stat label="Outlets" value={String(stats.data?.outlets ?? "—")} icon={Store} />
        <Stat label="Orders" value={String(stats.data?.orders ?? "—")} icon={ReceiptText} />
      </div>

      <StateBlock
        loading={tenants.loading && !tenants.data}
        error={tenants.error}
        empty={list.length === 0}
        emptyText="No tenants yet."
      >
        <Card className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Business</th>
                <th className="px-5 py-3 font-medium">Workspace</th>
                <th className="px-5 py-3 font-medium">Plan</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Outlets</th>
                <th className="px-5 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => router.push(`/admin/tenants/${t.id}`)}
                  className="cursor-pointer hover:bg-surface-muted"
                >
                  <td className="px-5 py-3">
                    <p className="font-medium text-text">{t.name}</p>
                    {t.country && <p className="text-xs text-muted">{t.country}</p>}
                  </td>
                  <td className="px-5 py-3 text-muted">{t.subdomain}</td>
                  <td className="px-5 py-3 capitalize text-muted">{t.subscription?.plan ?? t.plan}</td>
                  <td className="px-5 py-3">
                    <Badge variant={statusVariant(t.status)}>{humanize(t.status)}</Badge>
                  </td>
                  <td className="px-5 py-3 text-muted">{t.outlets}</td>
                  <td className="px-5 py-3 text-muted">{dateTime(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </StateBlock>
    </>
  );
}
