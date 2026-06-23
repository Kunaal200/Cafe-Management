"use client";

import { useState } from "react";
import { Plus, Star } from "lucide-react";
import { useToast } from "@/features/dashboard/toast";
import { PageHeader, Card, StateBlock } from "@/features/dashboard/ui";
import { Button } from "@/design-system/button";
import { Field } from "@/design-system/field";
import { Modal } from "@/design-system/modal";
import { useApi } from "@/lib/use-api";
import { apiFetch, ApiError } from "@/lib/api";
import { dateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface FeedbackSummary {
  count: number;
  average: number;
  distribution: { star: number; count: number }[];
  recent: { id: string; rating: number; comment: string | null; customerName: string | null; createdAt: string }[];
}

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(s)}
          className={cn(onChange && "cursor-pointer")}
        >
          <Star className={cn("h-5 w-5", s <= value ? "fill-warning text-warning" : "text-border")} />
        </button>
      ))}
    </span>
  );
}

export default function FeedbackPage() {
  const toast = useToast();
  const { data, error, loading, refetch } = useApi<FeedbackSummary>("/customers/feedback");

  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await apiFetch("/customers/feedback", {
        method: "POST",
        body: { rating, comment: comment.trim() || undefined },
        auth: true,
      });
      toast.success("Feedback recorded");
      setComment("");
      setRating(5);
      setOpen(false);
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not record feedback.");
    } finally {
      setBusy(false);
    }
  }

  const maxDist = Math.max(1, ...(data?.distribution ?? []).map((d) => d.count));

  return (
    <>
      <PageHeader
        title="Feedback"
        subtitle="Customer ratings and comments."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Record feedback
          </Button>
        }
      />

      <StateBlock loading={loading && !data} error={error}>
        {data && (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <Card className="flex flex-col items-center justify-center">
                <p className="text-3xl font-bold text-text">{data.average || "—"}</p>
                <Stars value={Math.round(data.average)} />
                <p className="mt-1 text-xs text-muted">{data.count} responses</p>
              </Card>
              <Card className="sm:col-span-2">
                <h2 className="mb-3 text-sm font-semibold text-text">Rating distribution</h2>
                <div className="space-y-1.5">
                  {[...data.distribution].reverse().map((d) => (
                    <div key={d.star} className="flex items-center gap-2 text-sm">
                      <span className="w-3 text-muted">{d.star}</span>
                      <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
                        <div className="h-full rounded-full bg-warning" style={{ width: `${(d.count / maxDist) * 100}%` }} />
                      </div>
                      <span className="w-6 text-right text-muted">{d.count}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <Card className="p-0">
              <h2 className="border-b border-border px-5 py-3 text-sm font-semibold text-text">Recent feedback</h2>
              {data.recent.length === 0 ? (
                <p className="px-5 py-6 text-center text-sm text-muted">No feedback yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {data.recent.map((f) => (
                    <li key={f.id} className="px-5 py-3">
                      <div className="flex items-center justify-between">
                        <Stars value={f.rating} />
                        <span className="text-xs text-muted">{dateTime(f.createdAt)}</span>
                      </div>
                      {f.comment && <p className="mt-1 text-sm text-text">{f.comment}</p>}
                      {f.customerName && <p className="text-xs text-muted">— {f.customerName}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        )}
      </StateBlock>

      <Modal open={open} onClose={() => setOpen(false)} title="Record feedback">
        <div className="space-y-4">
          <Field label="Rating" htmlFor="rating">
            <Stars value={rating} onChange={setRating} />
          </Field>
          <Field label="Comment (optional)" htmlFor="comment">
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              placeholder="What did they say?"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
