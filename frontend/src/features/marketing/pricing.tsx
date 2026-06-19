import Link from "next/link";
import { Check } from "lucide-react";
import { Container, Section } from "@/design-system/layout";
import { Badge } from "@/design-system/badge";
import { buttonVariants } from "@/design-system/button";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Starter",
    price: "$29",
    cadence: "/outlet / month",
    description: "Everything a single café needs to run service.",
    features: ["POS & checkout", "Menu & tables", "Kitchen display", "1 outlet"],
    cta: "Start free trial",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$59",
    cadence: "/outlet / month",
    description: "For growing businesses with a full team.",
    features: ["Everything in Starter", "Staff roles & logins", "Shift & cash control", "Discounts & split bills"],
    cta: "Start free trial",
    highlighted: true,
  },
  {
    name: "Multi-outlet",
    price: "Custom",
    cadence: "",
    description: "Run many locations under one account.",
    features: ["Everything in Growth", "Unlimited outlets", "Priority support", "Onboarding help"],
    cta: "Contact sales",
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <Section id="pricing" className="bg-surface">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="accent">Pricing</Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-text sm:text-4xl">
            Simple per-outlet pricing
          </h2>
          <p className="mt-4 text-lg text-muted">
            Start with a 14-day free trial. Upgrade, downgrade, or cancel anytime.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "flex flex-col rounded-lg border bg-bg p-8",
                plan.highlighted ? "border-primary shadow-lg ring-1 ring-primary" : "border-border",
              )}
            >
              {plan.highlighted && (
                <Badge variant="primary" className="mb-4 self-start">
                  Most popular
                </Badge>
              )}
              <h3 className="text-lg font-semibold text-text">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-text">{plan.price}</span>
                <span className="text-sm text-muted">{plan.cadence}</span>
              </div>
              <p className="mt-3 text-sm text-muted">{plan.description}</p>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-text">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className={cn(
                  buttonVariants({ variant: plan.highlighted ? "primary" : "secondary" }),
                  "mt-8 w-full",
                )}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
