"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { clearTokens, isAuthenticated } from "@/lib/auth";
import type { MeResponse } from "@/lib/types";
import { OutletProvider } from "@/features/dashboard/outlet-context";
import { DashboardShell } from "@/features/dashboard/shell";
import { Spinner } from "@/features/dashboard/ui";

/**
 * Guards the whole /dashboard area: must be authenticated AND have a tenant
 * (owners without a business are sent to onboarding). Renders the shell +
 * outlet provider once cleared, so child pages can assume both.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    apiFetch<MeResponse>("/auth/me", { auth: true })
      .then((me) => {
        if (!me.tenantId) {
          router.replace("/onboarding");
        } else {
          setReady(true);
        }
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) clearTokens();
        router.replace("/login");
      });
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-bg text-sm text-muted">
        <Spinner /> Loading your workspace…
      </div>
    );
  }

  return (
    <OutletProvider>
      <DashboardShell>{children}</DashboardShell>
    </OutletProvider>
  );
}
