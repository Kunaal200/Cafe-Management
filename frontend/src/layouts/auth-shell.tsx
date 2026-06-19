import Link from "next/link";
import { Coffee } from "lucide-react";

/** Centered card layout used by login / signup / verification screens. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2 text-lg font-semibold text-text">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-fg">
          <Coffee className="h-5 w-5" />
        </span>
        BrewDesk
      </Link>

      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-text">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
        {children}
      </div>

      {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
    </div>
  );
}
