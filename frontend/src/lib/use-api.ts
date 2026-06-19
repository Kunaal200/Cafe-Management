"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, ApiError } from "./api";

interface UseApiResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  refetch: () => void;
}

/**
 * Small authenticated GET hook (we don't use TanStack Query in the MVP).
 * Re-runs whenever `path` changes; `refetch()` forces a reload. Pass a null
 * path to skip fetching (e.g. while a dependency isn't ready yet).
 */
export function useApi<T>(path: string | null, options?: { pollMs?: number }): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(path !== null);
  const [tick, setTick] = useState(0);
  const pollMs = options?.pollMs;
  // Keep latest data during background polls to avoid flicker.
  const firstLoad = useRef(true);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!path) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    if (firstLoad.current) setLoading(true);

    apiFetch<T>(path, { auth: true })
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Failed to load data.");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        firstLoad.current = false;
      });

    return () => {
      cancelled = true;
    };
  }, [path, tick]);

  // Optional polling for live screens.
  useEffect(() => {
    if (!path || !pollMs) return;
    const id = setInterval(() => setTick((t) => t + 1), pollMs);
    return () => clearInterval(id);
  }, [path, pollMs]);

  return { data, error, loading, refetch };
}
