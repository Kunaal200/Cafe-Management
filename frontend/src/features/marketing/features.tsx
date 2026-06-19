import {
  Zap,
  ChefHat,
  BookOpen,
  LayoutGrid,
  Users,
  ReceiptText,
  Building2,
  Wallet,
} from "lucide-react";
import { Container, Section } from "@/design-system/layout";
import { Badge } from "@/design-system/badge";

const features = [
  {
    icon: Zap,
    title: "Fast POS billing",
    description:
      "Take dine-in, takeaway, and delivery orders in seconds with a touch-first screen built for busy service.",
  },
  {
    icon: ChefHat,
    title: "Kitchen display",
    description:
      "Orders fly straight to the kitchen. Staff mark items preparing, ready, and served — no paper tickets.",
  },
  {
    icon: BookOpen,
    title: "Menu management",
    description:
      "Organize categories and items, set prices and taxes, and flip items to sold-out instantly.",
  },
  {
    icon: LayoutGrid,
    title: "Tables & floor",
    description:
      "Track every table's status, seat guests, and free tables automatically when a bill is settled.",
  },
  {
    icon: Users,
    title: "Staff roles & logins",
    description:
      "Give chefs, cashiers, and managers their own logins. Each role only sees what it needs.",
  },
  {
    icon: ReceiptText,
    title: "Payments & checkout",
    description:
      "Apply discounts and taxes, split bills across payment methods, and close out cleanly.",
  },
  {
    icon: Wallet,
    title: "Shift & cash control",
    description:
      "Open and close the register with cash reconciliation so the drawer always balances.",
  },
  {
    icon: Building2,
    title: "Multi-outlet ready",
    description:
      "Run one café or many. Each location stays cleanly separated under your account.",
  },
];

export function Features() {
  return (
    <Section id="features" className="bg-surface">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="accent">Everything you need</Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-text sm:text-4xl">
            One platform, the whole operation
          </h2>
          <p className="mt-4 text-lg text-muted">
            Stop stitching together a POS, a notebook, and a spreadsheet. BrewDesk
            handles ordering to payout in one place.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg border border-border bg-bg p-6 transition-shadow hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                <feature.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-text">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{feature.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
