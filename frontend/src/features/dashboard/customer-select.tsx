"use client";

import { useMemo, useState } from "react";
import { Search, X, UserRound } from "lucide-react";
import { useApi } from "@/lib/use-api";
import { cn } from "@/lib/utils";

interface CustomerRow {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
}

/**
 * Type-ahead picker over existing customers. Emits the selected customer's id
 * (or null when cleared). Used in the new-order flow and the order workspace so
 * staff can attach a returning customer.
 */
export function CustomerSelect({
  value,
  selectedLabel,
  onSelect,
  placeholder = "Search customers by name or phone",
}: {
  value: string | null;
  selectedLabel?: string | null;
  onSelect: (id: string | null, label?: string) => void;
  placeholder?: string;
}) {
  const { data } = useApi<CustomerRow[]>("/customers");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const all = data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return all.slice(0, 8);
    return all
      .filter((c) =>
        `${c.name ?? ""} ${c.phone ?? ""} ${c.email ?? ""}`.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [data, query]);

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm">
        <span className="inline-flex items-center gap-2 text-text">
          <UserRound className="h-4 w-4 text-muted" />
          {selectedLabel || "Customer"}
        </span>
        <button
          type="button"
          onClick={() => onSelect(null)}
          aria-label="Remove customer"
          className="rounded p-1 text-muted hover:text-danger"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="h-10 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm text-text placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
      />
      {open && matches.length > 0 && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <ul className="absolute z-40 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-surface py-1 shadow-lg">
            {matches.map((c) => {
              const label = c.name || c.phone || c.email || "Customer";
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(c.id, label);
                      setQuery("");
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full flex-col items-start px-3 py-2 text-left hover:bg-surface-muted",
                    )}
                  >
                    <span className="text-sm font-medium text-text">{label}</span>
                    {(c.phone || c.email) && (
                      <span className="text-xs text-muted">{c.phone || c.email}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
