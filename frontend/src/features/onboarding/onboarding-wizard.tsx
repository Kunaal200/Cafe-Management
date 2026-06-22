"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Coffee } from "lucide-react";
import type {
  BusinessDetailsInput,
  OutletInput,
  LocalizationInput,
} from "@cafe/shared";
import { Stepper } from "./stepper";
import { BusinessStep } from "./steps/business-step";
import { OutletStep } from "./steps/outlet-step";
import { LocalizationStep } from "./steps/localization-step";
import { MenuStep } from "./steps/menu-step";
import { TablesStep } from "./steps/tables-step";
import { FinishStep } from "./steps/finish-step";
import { useNavigationGuard } from "./use-navigation-guard";
import { Modal } from "@/design-system/modal";
import { Button } from "@/design-system/button";
import { apiFetch, ApiError } from "@/lib/api";
import { clearTokens, isAuthenticated } from "@/lib/auth";

const STORAGE_KEY = "cafe.onboarding";

interface PersistedState {
  step: number;
  outletId: string | null;
  country?: string;
  business?: BusinessDetailsInput;
  outlet?: OutletInput;
  localization?: LocalizationInput;
}

function loadPersisted(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedState) : null;
  } catch {
    return null;
  }
}

const STEP_LABELS = ["Business", "Outlet", "Tax", "Menu", "Tables", "Done"];

const STEP_TITLES: Record<number, { title: string; subtitle: string }> = {
  0: { title: "Tell us about your business", subtitle: "This creates your workspace." },
  1: { title: "Add your first outlet", subtitle: "Your café location." },
  2: { title: "Currency & tax", subtitle: "Used for correct billing and receipts." },
  3: { title: "Add a starter menu", subtitle: "A category and a few items to get going." },
  4: { title: "Set up tables", subtitle: "For dine-in service." },
  5: { title: "All set", subtitle: "" },
};

export function OnboardingWizard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);
  const [outletId, setOutletId] = useState<string | null>(null);
  const [country, setCountry] = useState<string | undefined>(undefined);
  // Entered values per step, kept so going Back prefills and re-submits update.
  const [business, setBusiness] = useState<BusinessDetailsInput | undefined>();
  const [outlet, setOutlet] = useState<OutletInput | undefined>();
  const [localization, setLocalization] = useState<LocalizationInput | undefined>();

  // Restore in-progress state (e.g. after an accidental refresh) before the
  // first paint so the user lands back on the step they left off.
  useEffect(() => {
    const saved = loadPersisted();
    if (saved) {
      setStep(saved.step);
      setOutletId(saved.outletId);
      setCountry(saved.country);
      setBusiness(saved.business);
      setOutlet(saved.outlet);
      setLocalization(saved.localization);
    }
  }, []);

  // Persist progress on every change so it survives a reload within the session.
  useEffect(() => {
    if (!ready) return;
    if (step >= 5) {
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ step, outletId, country, business, outlet, localization }),
      );
    }
  }, [ready, step, outletId, country, business, outlet, localization]);

  // Warn before leaving the flow via Back so progress isn't lost.
  const guard = useNavigationGuard(ready && step < 5);

  // Guard: onboarding is only for an authenticated user who has NOT set up a
  // business yet. Any other case redirects away — the wizard never renders.
  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    apiFetch<{ tenantId: string | null; role: string }>("/auth/me", { auth: true })
      .then((me) => {
        if (me.role === "super_admin") {
          router.replace("/admin");
        } else if (me.tenantId) {
          router.replace("/dashboard");
        } else {
          setReady(true);
        }
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          clearTokens();
        }
        router.replace("/login");
      });
  }, [router]);

  function quitOnboarding() {
    sessionStorage.removeItem(STORAGE_KEY);
    guard.leave(() => router.replace("/login"));
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-muted">Loading…</div>
    );
  }

  const meta = STEP_TITLES[step];

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {/* Top bar */}
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-2 px-4 font-semibold text-text">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-fg">
            <Coffee className="h-5 w-5" />
          </span>
          BrewDesk
        </div>
      </header>

      {/* Full-width step progress */}
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <Stepper steps={STEP_LABELS} current={step} />
        </div>
      </div>

      {/* Centered, box-free form */}
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-text">{meta.title}</h1>
          {meta.subtitle && <p className="mt-2 text-muted">{meta.subtitle}</p>}
        </div>

        {step === 0 && (
          <BusinessStep
            defaults={business}
            onComplete={(c, values) => {
              setCountry(c);
              setBusiness(values);
              setStep(1);
            }}
          />
        )}
        {step === 1 && (
          <OutletStep
            country={country}
            outletId={outletId}
            defaults={outlet}
            onComplete={(id, values) => {
              setOutletId(id);
              setOutlet(values);
              setStep(2);
            }}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && outletId && (
          <LocalizationStep
            outletId={outletId}
            defaults={localization}
            onComplete={(values) => {
              setLocalization(values);
              setStep(3);
            }}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <MenuStep onComplete={() => setStep(4)} onSkip={() => setStep(4)} onBack={() => setStep(2)} />
        )}
        {step === 4 && outletId && (
          <TablesStep
            outletId={outletId}
            onComplete={() => setStep(5)}
            onSkip={() => setStep(5)}
            onBack={() => setStep(3)}
          />
        )}
        {step === 5 && <FinishStep />}
      </main>

      {/* Confirm before leaving so in-progress setup isn't lost. */}
      <Modal
        open={guard.promptOpen}
        onClose={guard.stay}
        title="Exit setup?"
        description="You can use the Back button to edit earlier steps. If you exit, your saved progress is kept and you can finish later."
        className="max-w-md"
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={guard.stay}>
            Stay and edit
          </Button>
          <Button variant="danger" onClick={quitOnboarding}>
            Exit setup
          </Button>
        </div>
      </Modal>
    </div>
  );
}
