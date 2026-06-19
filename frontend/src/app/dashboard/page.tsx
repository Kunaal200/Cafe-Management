"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/design-system/button";
import { Badge } from "@/design-system/badge";
import { apiFetch, ApiError } from "@/lib/api";
import { clearTokens, isAuthenticated } from "@/lib/auth";

interface MeResponse {
  sub: string;
  tenantId: string | null;
  role: string;
  email: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    apiFetch<MeResponse>("/auth/me", { auth: true })
      .then((data) => {
        // New owners without a business go through onboarding first.
        if (!data.tenantId) {
          router.replace("/onboarding");
          return;
        }
        setMe(data);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          clearTokens();
          router.replace("/login");
        } else {
          setError(err instanceof ApiError ? err.message : "Failed to load your account.");
        }
      });
  }, [router]);

  function logout() {
    clearTokens();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <span className="text-lg font-semibold text-text">Dashboard</span>
          <Button variant="secondary" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        {error && (
          <div className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        {!error && !me && <p className="text-muted">Loading…</p>}

        {me && (
          <div className="rounded-xl border border-border bg-surface p-8">
            <h1 className="text-2xl font-bold text-text">You&apos;re signed in 🎉</h1>
            <p className="mt-1 text-muted">
              This is a placeholder. The full owner dashboard is coming next.
            </p>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted">Email</dt>
                <dd className="text-sm font-medium text-text">{me.email || "—"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Role</dt>
                <dd className="mt-0.5">
                  <Badge variant="primary">{me.role}</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Business set up</dt>
                <dd className="text-sm font-medium text-text">
                  {me.tenantId ? "Yes" : "Not yet — onboarding is the next step"}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </main>
    </div>
  );
}
