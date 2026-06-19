import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container, Section } from "@/design-system/layout";
import { buttonVariants } from "@/design-system/button";
import { cn } from "@/lib/utils";

export function CtaBand() {
  return (
    <Section className="bg-surface">
      <Container>
        <div className="rounded-2xl bg-primary px-6 py-14 text-center sm:px-12">
          <h2 className="text-3xl font-bold tracking-tight text-primary-fg sm:text-4xl">
            Ready to run a smoother café?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-primary-fg/80">
            Start your 14-day free trial today. No credit card required — set up
            your menu and take your first order in minutes.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "bg-white")}
            >
              Start free trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "ghost", size: "lg" }),
                "text-primary-fg hover:bg-white/10",
              )}
            >
              Log in
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
}
