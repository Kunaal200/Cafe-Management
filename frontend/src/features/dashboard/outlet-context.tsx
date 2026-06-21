"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Outlet } from "@/lib/types";

const SELECTED_KEY = "cafe.selectedOutlet";

interface OutletContextValue {
  outlets: Outlet[];
  selected: Outlet | null;
  selectOutlet: (id: string) => void;
  currency: string;
  loading: boolean;
  refresh: () => void;
}

const OutletContext = createContext<OutletContextValue | null>(null);

export function OutletProvider({ children }: { children: React.ReactNode }) {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    return apiFetch<Outlet[]>("/outlets", { auth: true })
      .then((list) => {
        setOutlets(list);
        setSelectedId((prev) => {
          if (prev && list.some((o) => o.id === prev)) return prev;
          const stored = typeof window !== "undefined" ? localStorage.getItem(SELECTED_KEY) : null;
          return list.find((o) => o.id === stored)?.id ?? list[0]?.id ?? null;
        });
      })
      .catch(() => {
        /* surfaced elsewhere; switcher just stays empty */
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const value = useMemo<OutletContextValue>(() => {
    const selected = outlets.find((o) => o.id === selectedId) ?? null;
    return {
      outlets,
      selected,
      currency: selected?.currency ?? "USD",
      loading,
      refresh: load,
      selectOutlet: (id: string) => {
        setSelectedId(id);
        if (typeof window !== "undefined") localStorage.setItem(SELECTED_KEY, id);
      },
    };
  }, [outlets, selectedId, loading, load]);

  return <OutletContext.Provider value={value}>{children}</OutletContext.Provider>;
}

export function useOutlet(): OutletContextValue {
  const ctx = useContext(OutletContext);
  if (!ctx) throw new Error("useOutlet must be used within an OutletProvider");
  return ctx;
}
