"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Star } from "lucide-react";
import { useOutlet } from "@/features/dashboard/outlet-context";
import { PageHeader, Card, StateBlock } from "@/features/dashboard/ui";
import { Badge } from "@/design-system/badge";
import { useApi } from "@/lib/use-api";
import type { Order } from "@/lib/types";
import { money, dateTime, humanize, orderStatusVariant } from "@/lib/format";

interface CustomerDetail {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  createdAt: string;
  orders: Order[];
  feedback: { id: string; rating: number; comment: string | null; createdAt: string }[];
  stats: { visits: number; spend: number };
}

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { currency } = useOutlet();
  const { data, error, loading } = useApi<CustomerDetail>(
    params.id ? `/customers/${params.id}` : null,
  );

  return (
    <>
      <button
        type="button"
        onClick={() => router.push("/dashboard/customers")}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" /> All customers
      </button>

      <StateBlock loading={loading && !data} error={error} empty={!data && !loading}>
        {data && (
          <>
            <PageHeader
              title={data.name || "Guest"}
              subtitle={[data.phone, data.email].filter(Boolean).join(" · ") || undefined}
            />

            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <Card>
                <p className="text-sm text-muted">Visits</p>
                <p className="text-2xl font-bold text-text">{data.stats.visits}</p>
              </Card>
              <Card>
                <p className="text-sm text-muted">Lifetime spend</p>
                <p className="text-2xl font-bold text-text">{money(data.stats.spend, currency)}</p>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="p-0">
                <h2 className="border-b border-border px-5 py-3 text-sm font-semibold text-text">Recent orders</h2>
                {data.orders.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-muted">No orders yet.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {data.orders.map((o) => (
                      <li key={o.id} className="flex items-center justify-between px-5 py-3 text-sm">
                        <span>
                          <span className="font-medium text-text">#{o.orderNumber}</span>
                          <span className="text-muted"> · {dateTime(o.createdAt)}</span>
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="font-medium text-text">{money(o.total, currency)}</span>
                          <Badge variant={orderStatusVariant(o.status)}>{humanize(o.status)}</Badge>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card className="p-0">
                <h2 className="border-b border-border px-5 py-3 text-sm font-semibold text-text">Feedback</h2>
                {data.feedback.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-muted">No feedback yet.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {data.feedback.map((f) => (
                      <li key={f.id} className="px-5 py-3 text-sm">
                        <span className="inline-flex items-center gap-1 text-warning">
                          {Array.from({ length: f.rating }).map((_, i) => (
                            <Star key={i} className="h-3.5 w-3.5 fill-current" />
                          ))}
                        </span>
                        {f.comment && <p className="mt-1 text-muted">{f.comment}</p>}
                        <p className="mt-0.5 text-xs text-muted">{dateTime(f.createdAt)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>

            {data.notes && (
              <Card className="mt-6">
                <h2 className="mb-2 text-sm font-semibold text-text">Notes</h2>
                <p className="text-sm text-muted">{data.notes}</p>
              </Card>
            )}
          </>
        )}
      </StateBlock>
    </>
  );
}
