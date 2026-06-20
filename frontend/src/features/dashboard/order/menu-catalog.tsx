"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useApi } from "@/lib/use-api";
import { StateBlock } from "@/features/dashboard/ui";
import { MenuItemBadges } from "@/features/dashboard/menu-badges";
import { useOutlet } from "@/features/dashboard/outlet-context";
import type { MenuCategory, MenuItem } from "@/lib/types";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Menu browser for building an order. Tabs by category + search. Unavailable
 * items are dimmed and cannot be added. Clicking an available item calls onAdd.
 */
export function MenuCatalog({
  onAdd,
  adding,
}: {
  onAdd: (item: MenuItem) => void;
  adding: boolean;
}) {
  const { currency } = useOutlet();
  const categories = useApi<MenuCategory[]>("/menu/categories");
  const items = useApi<MenuItem[]>("/menu/items");

  const [activeCat, setActiveCat] = useState<string>("all");
  const [query, setQuery] = useState("");

  const cats = categories.data ?? [];
  const allItems = items.data ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allItems.filter((it) => {
      const matchesCat = activeCat === "all" || it.categoryId === activeCat;
      const matchesQuery = !q || it.name.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [allItems, activeCat, query]);

  const loading = (categories.loading && !categories.data) || (items.loading && !items.data);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the menu"
          className="h-10 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm text-text placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
        />
      </div>

      {cats.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <CatTab label="All" active={activeCat === "all"} onClick={() => setActiveCat("all")} />
          {cats.map((c) => (
            <CatTab
              key={c.id}
              label={c.name}
              active={activeCat === c.id}
              onClick={() => setActiveCat(c.id)}
            />
          ))}
        </div>
      )}

      <StateBlock
        loading={loading}
        error={categories.error ?? items.error}
        empty={allItems.length === 0}
        emptyText="No menu items yet. Add items on the Menu page first."
      >
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">No items match your search.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filtered.map((it) => (
              <button
                key={it.id}
                type="button"
                disabled={!it.isAvailable || adding}
                onClick={() => onAdd(it)}
                className={cn(
                  "group flex flex-col items-start gap-1 rounded-lg border border-border bg-surface p-3 text-left transition-colors",
                  it.isAvailable
                    ? "hover:border-primary hover:bg-primary/5"
                    : "cursor-not-allowed opacity-50",
                  adding && "cursor-wait",
                )}
              >
                <span className="line-clamp-2 text-sm font-medium text-text">{it.name}</span>
                <span className="text-sm text-muted">{money(it.price, currency)}</span>
                <MenuItemBadges item={it} className="mt-0.5" />
                {it.isAvailable ? (
                  <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    <Plus className="h-3 w-3" /> Add
                  </span>
                ) : (
                  <span className="mt-1 text-xs text-muted">Unavailable</span>
                )}
              </button>
            ))}
          </div>
        )}
      </StateBlock>
    </div>
  );
}

function CatTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted hover:bg-surface-muted",
      )}
    >
      {label}
    </button>
  );
}
