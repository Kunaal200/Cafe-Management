"use client";

import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboOption {
  value: string;
  label: string;
  keywords?: string;
}

interface ComboboxProps {
  options: ComboOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  id?: string;
  invalid?: boolean;
  /** Cap rendered results for performance on large lists. */
  maxResults?: number;
}

/** Searchable single-select dropdown (owned, token-styled). */
export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  id,
  invalid,
  maxResults = 60,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const selected = options.find((o) => o.value === value);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? options.filter((o) => (o.keywords ?? o.label).toLowerCase().includes(q))
      : options;
    return list.slice(0, maxResults);
  }, [options, query, maxResults]);

  return (
    <div className="relative">
      <button
        type="button"
        id={id}
        data-invalid={invalid}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 text-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
          invalid && "border-danger",
          selected ? "text-text" : "text-muted",
        )}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute z-40 mt-1 w-full overflow-hidden rounded-md border border-border bg-surface shadow-lg">
            <div className="flex items-center gap-2 border-b border-border px-3">
              <Search className="h-4 w-4 text-muted" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-10 w-full bg-transparent text-sm text-text outline-none placeholder:text-muted/70"
              />
            </div>
            <ul className="max-h-64 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-sm text-muted">No matches</li>
              )}
              {filtered.map((o) => (
                <li key={o.value}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-surface-muted",
                      o.value === value ? "text-primary" : "text-text",
                    )}
                  >
                    <span className="truncate">{o.label}</span>
                    {o.value === value && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
