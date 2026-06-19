"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PartyPopper } from "lucide-react";
import { Button } from "@/design-system/button";
import { apiFetch, ApiError } from "@/lib/api";

export function FinishStep() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function finish() {
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/onboarding/complete", { method: "POST", body: {}, auth: true });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not complete setup.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
        <PartyPopper className="h-7 w-7" />
      </span>
      <div>
        <h2 className="text-xl font-semibold text-text">Your café is ready</h2>
        <p className="mt-1 text-sm text-muted">
          You can start taking orders now. Anything you skipped can be set up later in the dashboard.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <Button className="w-full" onClick={finish} disabled={loading}>
        {loading ? "Finishing…" : "Go to dashboard"}
      </Button>
    </div>
  );
}
