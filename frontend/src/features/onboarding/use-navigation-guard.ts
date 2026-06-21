"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Guards against accidentally leaving a multi-step flow (e.g. onboarding).
 *
 * - Intercepts the browser Back button via a history trap + popstate listener
 *   and surfaces a confirmation prompt instead of navigating away.
 * - Warns on refresh / tab close via the native `beforeunload` dialog.
 *
 * The caller renders its own confirm UI from `promptOpen`, and calls `stay()`
 * to cancel or `leave(fn)` to proceed (fn performs the actual navigation).
 */
export function useNavigationGuard(enabled: boolean) {
  const [promptOpen, setPromptOpen] = useState(false);
  const leavingRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    // Add a trap entry so the first Back press fires popstate without leaving.
    window.history.pushState(null, "", window.location.href);

    const onPopState = () => {
      if (leavingRef.current) return;
      // Re-arm the trap and ask the user what to do.
      window.history.pushState(null, "", window.location.href);
      setPromptOpen(true);
    };

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("popstate", onPopState);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [enabled]);

  const stay = useCallback(() => setPromptOpen(false), []);

  const leave = useCallback((navigate: () => void) => {
    leavingRef.current = true;
    setPromptOpen(false);
    navigate();
  }, []);

  return { promptOpen, stay, leave };
}
