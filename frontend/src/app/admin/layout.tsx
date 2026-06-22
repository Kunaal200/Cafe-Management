"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, LogOut } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { clearTokens, isAuthenticated } from "@/lib/auth";
import type { MeResponse } from "@/lib/types";
import { Spinner } from "@/features/dashboard/ui";
import { ToastProvider } from "@/features/dashboard/toast";

/**
 * Platform-admin area, separate from the tenant dashboard. Only super_admin
 * (who has no tenant) may enter; everyone else is redirected.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    apiFetch<MeResponse>("/auth/me", { auth: true })
      .then((me) => {
        if (me.role === "super_admin") setOk(true);
        else router.replace("/dashboard");
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) clearTokens();
        router.replace("/login");
      });
  }, [router]);

  function logout() {
    clearTokens();
    router.replace("/login");
  }

  if (!ok) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-bg text-sm text-muted">
        <Spinner /> Loading admin…
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-bg">
        <header className="sticky top-0 z-20 border-b border-border bg-surface">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link href="/admin" className="flex items-center gap-2 font-semibold text-text">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-fg">
                <ShieldCheck className="h-5 w-5" />
              </span>
              BrewDesk Admin
            </Link>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-text hover:bg-surface-muted"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </ToastProvider>
  );
}
