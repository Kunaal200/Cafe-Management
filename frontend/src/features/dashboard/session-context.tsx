"use client";

import { createContext, useContext } from "react";
import type { MeResponse } from "@/lib/types";

/**
 * The authenticated user for the dashboard. The layout fetches `/auth/me` once
 * for its guard and provides the result here so pages can gate actions by role
 * without refetching.
 */
const SessionContext = createContext<MeResponse | null>(null);

export function SessionProvider({
  value,
  children,
}: {
  value: MeResponse;
  children: React.ReactNode;
}) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): MeResponse {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
}
