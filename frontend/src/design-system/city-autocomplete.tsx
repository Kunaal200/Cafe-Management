"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * City field with type-ahead suggestions for the selected country.
 * Fetches the country's city list once (free public API) and filters as you
 * type. Free text is always allowed, and it degrades to a plain input if the
 * lookup fails or no country is selected yet.
 */
export function CityAutocomplete({
  country,
  value,
  onChange,
  id,
}: {
  country?: string; // country name, e.g. "United States"
  value: string;
  onChange: (value: string) => void;
  id?: string;
}) {
  const [cities, setCities] = React.useState<string[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!country) {
      setCities([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch("https://countriesnow.space/api/v0.1/countries/cities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country }),
    })
      .then((r) => r.json())
      .then((res: { error: boolean; data?: string[] }) => {
        if (cancelled) return;
        if (!res.error && Array.isArray(res.data)) setCities(res.data);
      })
      .catch(() => {
        /* silent: fall back to plain input */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [country]);

  const q = value.trim().toLowerCase();
  // Show matches while typing; on focus with an empty field, show a starter list.
  const matches = cities.length
    ? (q ? cities.filter((c) => c.toLowerCase().includes(q)) : cities).slice(0, 8)
    : [];

  return (
    <div className="relative">
      <input
        id={id}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={
          !country
            ? "Select a country first"
            : loading
              ? "Loading cities…"
              : "Start typing your city"
        }
        autoComplete="off"
        className={cn(
          "h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text",
          "placeholder:text-muted/70",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
        )}
      />
      {open && matches.length > 0 && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <ul className="absolute z-40 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-surface py-1 shadow-lg">
            {matches.map((c) => (
              <li key={c}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(c);
                    setOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-text hover:bg-surface-muted"
                >
                  {c}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
