"use client";

import { useEffect, useState } from "react";
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

/** Common café / restaurant menu categories for quick setup. */
export const CATEGORY_PRESETS: CategoryPreset[] = [
  { name: "Coffee", icon: Coffee, subcategories: ["Hot", "Iced"] },
  { name: "Tea", icon: Coffee, subcategories: ["Hot", "Iced"] },
  { name: "Beverages", icon: CupSoda, subcategories: ["Soft drinks", "Juices"] },
  { name: "Smoothies & Shakes", icon: GlassWater },
  { name: "Breakfast", icon: Egg },
  { name: "Bakery & Pastries", icon: Croissant },
  { name: "Starters", icon: UtensilsCrossed },
  { name: "Soups", icon: Soup },
  { name: "Salads", icon: Salad },
  { name: "Pizza", icon: Pizza },
  { name: "Burgers", icon: Beef },
  { name: "Sandwiches", icon: Sandwich },
  { name: "Main Course", icon: UtensilsCrossed, subcategories: ["Veg", "Non-veg"] },
  { name: "Chicken", icon: Drumstick },
  { name: "Seafood", icon: Fish },
  { name: "Breads", icon: Wheat },
  { name: "Rice & Biryani", icon: Wheat },
  { name: "Desserts", icon: CakeSlice },
  { name: "Ice Cream", icon: IceCreamCone },
  { name: "Snacks", icon: Cookie },
  { name: "Mocktails", icon: Martini },
  { name: "Cocktails", icon: Martini },
  { name: "Beer", icon: Beer },
  { name: "Wine", icon: Wine },
  { name: "Kids Menu", icon: Candy },
  { name: "Specials", icon: Star },
];

/**
 * Multi-select modal of preset categories (icon + name). Categories already
 * present (by lowercased name in `existingNames`) are marked as added and can't
 * be picked again. Calls `onConfirm` with the chosen presets.
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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const existing = new Set(existingNames.map((n) => n.toLowerCase()));

  // Reset selection each time the picker opens.
  useEffect(() => {
    if (open) setSelected(new Set());
  }, [open]);

  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function confirm() {
    const chosen = CATEGORY_PRESETS.filter((p) => selected.has(p.name));
    onConfirm(chosen);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add categories"
      description="Pick from common categories to set up your menu fast."
      className="max-w-2xl"
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {CATEGORY_PRESETS.map((p) => {
          const Icon = p.icon;
          const added = existing.has(p.name.toLowerCase());
          const isSelected = selected.has(p.name);
          return (
            <button
              key={p.name}
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
