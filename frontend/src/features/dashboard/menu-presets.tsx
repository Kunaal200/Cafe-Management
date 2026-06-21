"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Coffee,
  CupSoda,
  Croissant,
  Egg,
  Soup,
  Salad,
  Pizza,
  Sandwich,
  Beef,
  Drumstick,
  Fish,
  IceCreamCone,
  CakeSlice,
  Cookie,
  Beer,
  Wine,
  Martini,
  GlassWater,
  Wheat,
  UtensilsCrossed,
  Star,
  Candy,
  Check,
  type LucideIcon,
} from "lucide-react";
import { Modal } from "@/design-system/modal";
import { Button } from "@/design-system/button";
import { cn } from "@/lib/utils";

export interface CategoryPreset {
  name: string;
  icon: LucideIcon;
  /** Suggested subcategories added alongside the category. */
  subcategories?: string[];
}

export interface PresetGroup {
  cuisine: string;
  presets: CategoryPreset[];
}

/** Common menu categories grouped by cuisine / outlet type, for quick setup. */
export const PRESET_GROUPS: PresetGroup[] = [
  {
    cuisine: "Café & Bakery",
    presets: [
      { name: "Coffee", icon: Coffee, subcategories: ["Hot", "Iced"] },
      { name: "Tea", icon: Coffee, subcategories: ["Hot", "Iced"] },
      { name: "Beverages", icon: CupSoda, subcategories: ["Soft drinks", "Juices"] },
      { name: "Smoothies & Shakes", icon: GlassWater },
      { name: "Breakfast", icon: Egg },
      { name: "Bakery & Pastries", icon: Croissant },
      { name: "Desserts", icon: CakeSlice },
      { name: "Snacks", icon: Cookie },
    ],
  },
  {
    cuisine: "Indian",
    presets: [
      { name: "Starters", icon: UtensilsCrossed, subcategories: ["Veg", "Non-veg"] },
      { name: "Tandoori", icon: Drumstick },
      { name: "Curries", icon: Soup, subcategories: ["Veg", "Non-veg"] },
      { name: "Biryani & Rice", icon: Wheat },
      { name: "Breads", icon: Wheat },
      { name: "South Indian", icon: UtensilsCrossed },
      { name: "Thali", icon: UtensilsCrossed },
      { name: "Sweets", icon: Candy },
    ],
  },
  {
    cuisine: "Italian",
    presets: [
      { name: "Antipasti", icon: Salad },
      { name: "Pizza", icon: Pizza },
      { name: "Pasta", icon: UtensilsCrossed },
      { name: "Risotto", icon: Soup },
      { name: "Salads", icon: Salad },
      { name: "Dolci", icon: CakeSlice },
    ],
  },
  {
    cuisine: "Chinese & Asian",
    presets: [
      { name: "Dim Sum", icon: UtensilsCrossed },
      { name: "Soups", icon: Soup },
      { name: "Noodles", icon: UtensilsCrossed },
      { name: "Fried Rice", icon: Wheat },
      { name: "Sushi", icon: Fish },
      { name: "Stir-fry", icon: Beef },
    ],
  },
  {
    cuisine: "Fast Food",
    presets: [
      { name: "Burgers", icon: Beef },
      { name: "Sandwiches", icon: Sandwich },
      { name: "Pizza", icon: Pizza },
      { name: "Fried Chicken", icon: Drumstick },
      { name: "Sides", icon: Cookie },
      { name: "Ice Cream", icon: IceCreamCone },
      { name: "Combos", icon: UtensilsCrossed },
    ],
  },
  {
    cuisine: "Bar & Drinks",
    presets: [
      { name: "Cocktails", icon: Martini },
      { name: "Mocktails", icon: Martini },
      { name: "Beer", icon: Beer },
      { name: "Wine", icon: Wine },
      { name: "Spirits", icon: Wine },
      { name: "Bar Bites", icon: Cookie },
    ],
  },
  {
    cuisine: "General",
    presets: [
      { name: "Main Course", icon: UtensilsCrossed, subcategories: ["Veg", "Non-veg"] },
      { name: "Seafood", icon: Fish },
      { name: "Salads", icon: Salad },
      { name: "Soups", icon: Soup },
      { name: "Kids Menu", icon: Candy },
      { name: "Specials", icon: Star },
    ],
  },
];

/**
 * Multi-select modal of preset categories grouped by cuisine. Categories already
 * present (by lowercased name in `existingNames`) are marked as added. Selection
 * is keyed by category name, so picking the same name under two cuisines dedupes.
 * Calls `onConfirm` with the chosen presets.
 */
export function CategoryPresetPicker({
  open,
  onClose,
  existingNames,
  onConfirm,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  existingNames: string[];
  onConfirm: (presets: CategoryPreset[]) => void;
  busy?: boolean;
}) {
  const [activeCuisine, setActiveCuisine] = useState(PRESET_GROUPS[0].cuisine);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const existing = useMemo(
    () => new Set(existingNames.map((n) => n.toLowerCase())),
    [existingNames],
  );

  useEffect(() => {
    if (open) {
      setSelected(new Set());
      setActiveCuisine(PRESET_GROUPS[0].cuisine);
    }
  }, [open]);

  const group = PRESET_GROUPS.find((g) => g.cuisine === activeCuisine) ?? PRESET_GROUPS[0];

  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function confirm() {
    // Dedupe by name across cuisines; first match wins.
    const byName = new Map<string, CategoryPreset>();
    for (const g of PRESET_GROUPS) {
      for (const p of g.presets) {
        if (selected.has(p.name) && !byName.has(p.name)) byName.set(p.name, p);
      }
    }
    onConfirm([...byName.values()]);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add categories"
      description="Pick from common categories by cuisine to set up your menu fast."
      className="max-w-2xl"
    >
      {/* Cuisine tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {PRESET_GROUPS.map((g) => (
          <button
            key={g.cuisine}
            type="button"
            onClick={() => setActiveCuisine(g.cuisine)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
              activeCuisine === g.cuisine
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted hover:bg-surface-muted",
            )}
          >
            {g.cuisine}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {group.presets.map((p) => {
          const Icon = p.icon;
          const added = existing.has(p.name.toLowerCase());
          const isSelected = selected.has(p.name);
          return (
            <button
              key={`${group.cuisine}-${p.name}`}
              type="button"
              disabled={added}
              onClick={() => toggle(p.name)}
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-colors",
                added
                  ? "cursor-not-allowed border-border bg-surface-muted opacity-60"
                  : isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border bg-surface hover:border-primary/50 hover:bg-surface-muted",
              )}
            >
              {(isSelected || added) && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-fg">
                  <Check className="h-3 w-3" />
                </span>
              )}
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  isSelected ? "bg-primary/15 text-primary" : "bg-surface-muted text-muted",
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-medium text-text">{p.name}</span>
              {added && <span className="text-[10px] text-muted">Added</span>}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-between gap-2">
        <span className="text-sm text-muted">
          {selected.size > 0 ? `${selected.size} selected` : "Select categories to add"}
        </span>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={confirm} disabled={busy || selected.size === 0}>
            {busy ? "Adding…" : `Add ${selected.size || ""}`.trim()}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
