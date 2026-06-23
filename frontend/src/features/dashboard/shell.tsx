"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Coffee,
  LayoutDashboard,
  ReceiptText,
  UtensilsCrossed,
  Grid3x3,
  Users,
  UserRound,
  Boxes,
  Calculator,
  Ticket,
  MessageSquare,
  BarChart3,
  TrendingUp,
  CreditCard,
  Settings,
  Monitor,
  ChefHat,
  LogOut,
  Menu as MenuIcon,
  X,
  ChevronDown,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { clearTokens } from "@/lib/auth";
import { useOutlet } from "./outlet-context";
import { useSession } from "./session-context";

// Grouped nav. Each item lists the roles allowed to see it; undefined = everyone.
const NAV_GROUPS: {
  label?: string;
  items: { href: string; label: string; icon: typeof LayoutDashboard; exact?: boolean; roles?: string[] }[];
}[] = [
  {
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    label: "Operations",
    items: [
      { href: "/dashboard/pos", label: "POS", icon: Monitor, roles: ["owner", "manager", "cashier", "waiter"] },
      { href: "/dashboard/orders", label: "Orders", icon: ReceiptText, roles: ["owner", "manager", "cashier", "waiter", "kitchen"] },
      { href: "/dashboard/kitchen", label: "Kitchen", icon: ChefHat, roles: ["owner", "manager", "kitchen"] },
      { href: "/dashboard/tables", label: "Tables", icon: Grid3x3, roles: ["owner", "manager", "cashier", "waiter"] },
      { href: "/dashboard/register", label: "Register", icon: Calculator, roles: ["owner", "manager", "cashier"] },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/dashboard/menu", label: "Menu", icon: UtensilsCrossed, roles: ["owner", "manager"] },
      { href: "/dashboard/inventory", label: "Inventory", icon: Boxes, roles: ["owner", "manager", "kitchen"] },
    ],
  },
  {
    label: "Partners",
    items: [
      { href: "/dashboard/staff", label: "Staff", icon: Users, roles: ["owner", "manager"] },
      { href: "/dashboard/customers", label: "Customers", icon: UserRound, roles: ["owner", "manager"] },
      { href: "/dashboard/feedback", label: "Feedback", icon: MessageSquare, roles: ["owner", "manager"] },
      { href: "/dashboard/coupons", label: "Coupons", icon: Ticket, roles: ["owner", "manager"] },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/dashboard/reports", label: "Reports", icon: BarChart3, roles: ["owner", "manager"] },
      { href: "/dashboard/margins", label: "Margins", icon: TrendingUp, roles: ["owner", "manager"] },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/dashboard/subscription", label: "Subscription", icon: CreditCard, roles: ["owner"] },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];

function OutletSwitcher() {
  const { outlets, selected, selectOutlet } = useOutlet();
  const [open, setOpen] = useState(false);

  if (outlets.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text hover:bg-surface-muted"
      >
        <span className="max-w-[12rem] truncate">{selected?.name ?? "Select outlet"}</span>
        <ChevronDown className="h-4 w-4 text-muted" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <ul className="absolute right-0 z-40 mt-1 w-60 overflow-hidden rounded-md border border-border bg-surface py-1 shadow-lg">
            {outlets.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => {
                    selectOutlet(o.id);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-surface-muted"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-text">{o.name}</span>
                    {o.city && <span className="block truncate text-xs text-muted">{o.city}</span>}
                  </span>
                  {o.id === selected?.id && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Filter items by role, then drop any group left with no visible items.
  const groups = NAV_GROUPS.map((g) => ({
    label: g.label,
    items: g.items.filter((item) => !item.roles || item.roles.includes(session.role)),
  })).filter((g) => g.items.length > 0);

  function logout() {
    clearTokens();
    router.replace("/login");
  }

  function isActive(item: { href: string; exact?: boolean }) {
    return item.exact ? pathname === item.href : pathname.startsWith(item.href);
  }

  const sidebar = (
    <nav className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 px-5 text-lg font-bold tracking-tight text-text">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-fg">
          <Coffee className="h-5 w-5" />
        </span>
        BrewDesk
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {groups.map((group, gi) => (
          <div key={group.label ?? gi} className="mb-4">
            {group.label && (
              <p className="px-3 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted/70">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted hover:bg-surface-muted hover:text-text",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border p-3">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-surface-muted hover:text-text"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-bg">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-surface lg:block">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-text/40" onClick={() => setMobileOpen(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-border bg-surface">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            className="rounded-md p-2 text-muted hover:bg-surface-muted lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
          <div className="ml-auto">
            <OutletSwitcher />
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
