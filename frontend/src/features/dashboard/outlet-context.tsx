"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Outlet } from "@/lib/types";

const SELECTED_KEY = "cafe.selectedOutlet";

interface OutletContextValue {
  outlets: Outlet[];
  selected: Outlet | null;
  selectOutlet: (id: string) => void;
  currency: string;
  loading: boolean;
}

const OutletContext = createContext<OutletContextValue | null>(null);

export function OutletProvider({ children }: { children: React.ReactNode }) {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiFetch<Outlet[]>("/outlets", { auth: true })
      .then((list) => {
        if (cancelled) return;
        setOutlets(list);
        const stored = typeof window !== "undefined" ? localStorage.getItem(SELECTED_KEY) : null;
        const initial = list.find((o) => o.id === stored) ?? list[0] ?? null;
        setSelectedId(initial?.id ?? null);
      })
      .catch(() => {
        /* surfaced elsewhere; switcher just stays empty */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<OutletContextValue>(() => {
    const selected = outlets.find((o) => o.id === selectedId) ?? null;
    return {
      outlets,
      selected,
      currency: selected?.currency ?? "USD",
      loading,
      selectOutlet: (id: string) => {
        setSelectedId(id);
        if (typeof window !== "undefined") localStorage.setItem(SELECTED_KEY, id);
      },
    };
  }, [outlets, selectedId, loading]);

  return <OutletContext.Provider value={value}>{children}</OutletContext.Provider>;
}

export function useOutlet(): OutletContextValue {
  const ctx = useContext(OutletContext);
  if (!ctx) throw new Error("useOutlet must be used within an OutletProvider");
  return ctx;
}
