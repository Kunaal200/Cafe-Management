"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { clearTokens, isAuthenticated } from "@/lib/auth";
import type { MeResponse } from "@/lib/types";
import { OutletProvider } from "@/features/dashboard/outlet-context";
import { SessionProvider } from "@/features/dashboard/session-context";
import { ToastProvider } from "@/features/dashboard/toast";
import { ConfirmProvider } from "@/design-system/confirm-dialog";
import { DashboardShell } from "@/features/dashboard/shell";
import { Spinner } from "@/features/dashboard/ui";

/**
 * Guards the whole /dashboard area: must be authenticated AND have a tenant
 * (owners without a business are sent to onboarding). Renders the shell +
 * providers once cleared, so child pages can assume an authenticated session,
 * an outlet context, toasts, and confirmation dialogs.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    apiFetch<MeResponse>("/auth/me", { auth: true })
      .then((data) => {
        if (data.role === "super_admin") {
          router.replace("/admin");
        } else if (!data.tenantId) {
          router.replace("/onboarding");
        } else {
          setMe(data);
        }
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) clearTokens();
        router.replace("/login");
      });
  }, [router]);

  if (!me) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-bg text-sm text-muted">
        <Spinner /> Loading your workspace…
      </div>
    );
  }

  return (
    <SessionProvider value={me}>
      <ToastProvider>
        <ConfirmProvider>
          <OutletProvider>
            <DashboardShell>{children}</DashboardShell>
          </OutletProvider>
        </ConfirmProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
