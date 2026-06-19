import { Container } from "@/design-system/layout";

const businessTypes = ["Cafés", "Quick-service", "Fine dining", "Bars", "Cloud kitchens", "Bakeries"];

export function TrustStrip() {
  return (
    <div className="border-b border-border bg-bg">
      <Container className="py-8">
        <p className="text-center text-sm font-medium text-muted">
          Built for every kind of food business
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {businessTypes.map((type) => (
            <span key={type} className="text-base font-semibold text-text/70">
              {type}
            </span>
          ))}
        </div>
      </Container>
    </div>
  );
}
