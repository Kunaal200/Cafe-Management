import { Container, Section } from "@/design-system/layout";
import { Badge } from "@/design-system/badge";

const steps = [
  {
    step: "1",
    title: "Create your account",
    description: "Sign up in under a minute and verify your email. No card needed to start.",
  },
  {
    step: "2",
    title: "Set up your café",
    description:
      "A guided wizard creates your outlet, taxes, menu, and tables — so you're ready fast.",
  },
  {
    step: "3",
    title: "Start taking orders",
    description:
      "Open the register, take your first order, send it to the kitchen, and get paid.",
  },
];

export function HowItWorks() {
  return (
    <Section id="how-it-works" className="bg-bg">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="primary">How it works</Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-text sm:text-4xl">
            Up and running in three steps
          </h2>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {steps.map((item) => (
            <div key={item.step} className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-fg">
                {item.step}
              </span>
              <h3 className="mt-5 text-lg font-semibold text-text">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
