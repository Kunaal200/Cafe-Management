import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Container } from "@/design-system/layout";
import { Badge } from "@/design-system/badge";
import { buttonVariants } from "@/design-system/button";
import { cn } from "@/lib/utils";

const highlights = ["14-day free trial", "No card required", "Set up in minutes"];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-surface">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
      <Container className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="primary">Café & restaurant management, simplified</Badge>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-text sm:text-5xl lg:text-6xl">
            Run your whole café from one screen
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted">
            Take orders, send them to the kitchen, accept payments, and watch your
            sales live. BrewDesk replaces the patchwork of tools with a single,
            fast system your whole team can use.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup" className={cn(buttonVariants({ size: "lg" }))}>
              Start free trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#features" className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}>
              See features
            </a>
          </div>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted">
            {highlights.map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-success" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
