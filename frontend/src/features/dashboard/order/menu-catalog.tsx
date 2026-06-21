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
 * Menu browser for building an order. Top-level category tabs; selecting one
 * shows its items plus its subcategories' items grouped under subheadings.
 * Search filters across the whole menu. Unavailable items can't be added.
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

  const allCats = categories.data ?? [];
  const allItems = items.data ?? [];

  const topCats = useMemo(() => allCats.filter((c) => !c.parentId), [allCats]);
  const subsByParent = useMemo(() => {
    const map = new Map<string, MenuCategory[]>();
    for (const c of allCats) {
      if (c.parentId) {
        const list = map.get(c.parentId) ?? [];
        list.push(c);
        map.set(c.parentId, list);
      }
    }
    return map;
  }, [allCats]);
  const itemsByCat = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const it of allItems) {
      const list = map.get(it.categoryId) ?? [];
      list.push(it);
      map.set(it.categoryId, list);
    }
    return map;
  }, [allItems]);

  const q = query.trim().toLowerCase();
  const searchResults = useMemo(
    () => (q ? allItems.filter((it) => it.name.toLowerCase().includes(q)) : []),
    [allItems, q],
  );

  const loading = (categories.loading && !categories.data) || (items.loading && !items.data);
  const activeTop = activeCat === "all" ? null : topCats.find((c) => c.id === activeCat);

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

      {!q && topCats.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <CatTab label="All" active={activeCat === "all"} onClick={() => setActiveCat("all")} />
          {topCats.map((c) => (
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
        {q ? (
          // Search mode: flat results across the whole menu.
          <ItemGrid items={searchResults} currency={currency} adding={adding} onAdd={onAdd} emptyText="No items match your search." />
        ) : activeTop ? (
          // Category mode: direct items + each subcategory's items.
          <div className="space-y-5">
            <ItemGrid
              items={itemsByCat.get(activeTop.id) ?? []}
              currency={currency}
              adding={adding}
              onAdd={onAdd}
              emptyText="No items directly in this category."
            />
            {(subsByParent.get(activeTop.id) ?? []).map((sub) => {
              const subItems = itemsByCat.get(sub.id) ?? [];
              if (subItems.length === 0) return null;
              return (
                <div key={sub.id}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    {sub.name}
                  </h3>
                  <ItemGrid items={subItems} currency={currency} adding={adding} onAdd={onAdd} />
                </div>
              );
            })}
          </div>
        ) : (
          // All mode: everything in one grid.
          <ItemGrid items={allItems} currency={currency} adding={adding} onAdd={onAdd} />
        )}
      </StateBlock>
    </div>
  );
}

function ItemGrid({
  items,
  currency,
  adding,
  onAdd,
  emptyText,
}: {
  items: MenuItem[];
  currency: string;
  adding: boolean;
  onAdd: (item: MenuItem) => void;
  emptyText?: string;
}) {
  if (items.length === 0) {
    return emptyText ? <p className="py-4 text-sm text-muted">{emptyText}</p> : null;
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          disabled={!it.isAvailable || adding}
          onClick={() => onAdd(it)}
          className={cn(
            "group flex flex-col items-start gap-1 rounded-lg border border-border bg-surface p-3 text-left transition-colors",
            it.isAvailable ? "hover:border-primary hover:bg-primary/5" : "cursor-not-allowed opacity-50",
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
