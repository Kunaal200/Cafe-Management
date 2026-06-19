import { PublicNavbar } from "@/layouts/public-navbar";
import { PublicFooter } from "@/layouts/public-footer";
import { Hero } from "@/features/marketing/hero";
import { TrustStrip } from "@/features/marketing/trust-strip";
import { Features } from "@/features/marketing/features";
import { HowItWorks } from "@/features/marketing/how-it-works";
import { Pricing } from "@/features/marketing/pricing";
import { Testimonials } from "@/features/marketing/testimonials";
import { CtaBand } from "@/features/marketing/cta";

export default function HomePage() {
  return (
    <>
      <PublicNavbar />
      <main className="flex-1">
        <Hero />
        <TrustStrip />
        <Features />
        <HowItWorks />
        <Pricing />
        <Testimonials />
        <CtaBand />
      </main>
      <PublicFooter />
    </>
  );
}
