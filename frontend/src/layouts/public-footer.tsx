import Link from "next/link";
import { Coffee } from "lucide-react";
import { Container } from "@/design-system/layout";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "How it works", href: "#how-it-works" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Contact", href: "#" },
      { label: "Blog", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <Container className="py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 font-semibold text-text">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-fg">
                <Coffee className="h-5 w-5" />
              </span>
              BrewDesk
            </div>
            <p className="mt-3 text-sm text-muted">
              The all-in-one platform to run your café or restaurant.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-text">{col.title}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-muted transition-colors hover:text-text">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-border pt-6 text-sm text-muted">
          © {new Date().getFullYear()} BrewDesk. All rights reserved.
        </div>
      </Container>
    </footer>
  );
}
