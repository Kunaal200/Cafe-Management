"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Guards against accidentally leaving a multi-step flow (e.g. onboarding) via the
 * browser Back button. Adds a history trap + popstate listener and surfaces a
 * designed confirmation prompt instead of navigating away. Progress is persisted
 * separately, so no native `beforeunload` dialog is used.
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
      // Re-arm the trap and ask the user what to do via the designed modal.
      window.history.pushState(null, "", window.location.href);
      setPromptOpen(true);
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
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
