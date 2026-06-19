import Link from "next/link";
import { Coffee } from "lucide-react";
import { Container } from "@/design-system/layout";
import { buttonVariants } from "@/design-system/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

export function PublicNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-text">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-fg">
            <Coffee className="h-5 w-5" />
          </span>
          BrewDesk
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted transition-colors hover:text-text"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            Log in
          </Link>
          <Link href="/signup" className={cn(buttonVariants({ variant: "primary", size: "sm" }))}>
            Start free trial
          </Link>
        </div>
      </Container>
    </header>
  );
}
