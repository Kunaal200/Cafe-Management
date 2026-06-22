"use client";

import { Flame, Candy, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MenuItem } from "@/lib/types";

/**
 * Compact attribute badges for a menu item: veg/non-veg dot, spicy, sweet,
 * and serving size. Rendered on the Menu page and the order catalog.
 */
export function MenuItemBadges({ item, className }: { item: MenuItem; className?: string }) {
  const hasAny =
    item.isVeg != null || item.isSpicy || item.isSweet || (item.serves ?? 0) > 0;
  if (!hasAny) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {item.isVeg != null && (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium",
            item.isVeg ? "bg-success/10 text-success" : "bg-danger/10 text-danger",
          )}
        >
          <span
            className={cn(
              "flex h-3 w-3 items-center justify-center rounded-sm border",
              item.isVeg ? "border-success" : "border-danger",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                item.isVeg ? "bg-success" : "bg-danger",
              )}
            />
          </span>
          {item.isVeg ? "Veg" : "Non-veg"}
        </span>
      )}
      {item.isSpicy && (
        <span className="inline-flex items-center gap-0.5 rounded-full bg-danger/10 px-1.5 py-0.5 text-[11px] font-medium text-danger">
          <Flame className="h-3 w-3" /> Spicy
        </span>
      )}
      {item.isSweet && (
        <span className="inline-flex items-center gap-0.5 rounded-full bg-accent/10 px-1.5 py-0.5 text-[11px] font-medium text-accent">
          <Candy className="h-3 w-3" /> Sweet
        </span>
      )}
      {(item.serves ?? 0) > 0 && (
        <span className="inline-flex items-center gap-0.5 rounded-full bg-surface-muted px-1.5 py-0.5 text-[11px] font-medium text-muted">
          <Users className="h-3 w-3" /> Serves {item.serves}
        </span>
      )}
    </div>
  );
}
