"use client";

import * as React from "react";
import { ChevronDown, Search } from "lucide-react";
import { COUNTRIES } from "@/lib/locale";
import { cn } from "@/lib/utils";

/**
 * International phone input: a searchable country dial-code selector + number field.
 * Emits a combined string like "+1 5550001234" via onChange.
 */
export function PhoneInput({
  value,
  onChange,
  defaultCountry = "US",
  invalid,
}: {
  value?: string;
  onChange: (value: string) => void;
  defaultCountry?: string;
  invalid?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [countryCode, setCountryCode] = React.useState(defaultCountry);

  const country = COUNTRIES.find((c) => c.code === countryCode) ?? COUNTRIES[0];

  const initialNumber = value && value.includes(" ") ? value.slice(value.indexOf(" ") + 1) : "";
  const [number, setNumber] = React.useState(initialNumber);

  function emit(dial: string, num: string) {
    onChange(`${dial} ${num}`.trim());
  }

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? COUNTRIES.filter((c) => `${c.name} ${c.dialCode} ${c.code}`.toLowerCase().includes(q))
      : COUNTRIES;
    return list.slice(0, 60);
  }, [query]);

  return (
    <div className="flex gap-2">
      <div className="relative">
        <button
          type="button"
          data-invalid={invalid}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex h-10 items-center gap-1 rounded-md border border-border bg-surface px-3 text-sm text-text",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            invalid && "border-danger",
          )}
        >
          <span>{country.flag}</span>
          <span>{country.dialCode}</span>
          <ChevronDown className="h-4 w-4 text-muted" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
            <div className="absolute z-40 mt-1 w-72 overflow-hidden rounded-md border border-border bg-surface shadow-lg">
              <div className="flex items-center gap-2 border-b border-border px-3">
                <Search className="h-4 w-4 text-muted" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search country"
                  className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted/70"
                />
              </div>
              <ul className="max-h-64 overflow-y-auto py-1">
                {filtered.map((c) => (
                  <li key={c.code}>
                    <button
                      type="button"
                      onClick={() => {
                        setCountryCode(c.code);
                        setOpen(false);
                        setQuery("");
                        emit(c.dialCode, number);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text hover:bg-surface-muted"
                    >
                      <span>{c.flag}</span>
                      <span className="flex-1 truncate">{c.name}</span>
                      <span className="text-muted">{c.dialCode}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>

      <input
        type="tel"
        inputMode="tel"
        value={number}
        onChange={(e) => {
          setNumber(e.target.value);
          emit(country.dialCode, e.target.value);
        }}
        placeholder="555 000 1234"
        aria-invalid={invalid}
        className={cn(
          "h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text",
          "placeholder:text-muted/70",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
          "aria-[invalid=true]:border-danger",
        )}
      />
    </div>
  );
}
