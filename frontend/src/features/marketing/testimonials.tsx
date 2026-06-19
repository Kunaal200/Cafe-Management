import { Star } from "lucide-react";
import { Container, Section } from "@/design-system/layout";
import { Badge } from "@/design-system/badge";

// Placeholder testimonials — replace with real customer quotes before launch.
const testimonials = [
  {
    quote:
      "Service got noticeably faster. Orders reach the kitchen instantly and the floor staff aren't running back and forth.",
    name: "Priya N.",
    role: "Owner, Corner Brew",
  },
  {
    quote:
      "Closing the register used to be a headache. Now the cash reconciliation just adds up at the end of every shift.",
    name: "Marco D.",
    role: "Manager, Trattoria Sole",
  },
  {
    quote:
      "Setting up our menu and tables took a few minutes. We were taking orders the same afternoon.",
    name: "Aisha R.",
    role: "Founder, Bloom Bakehouse",
  },
];

export function Testimonials() {
  return (
    <Section className="bg-bg">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="primary">Loved by operators</Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-text sm:text-4xl">
            Built for the people behind the counter
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.name} className="flex flex-col rounded-lg border border-border bg-surface p-6">
              <div className="flex gap-0.5 text-warning">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-sm leading-6 text-text">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-5">
                <div className="text-sm font-semibold text-text">{t.name}</div>
                <div className="text-sm text-muted">{t.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </Section>
  );
}
