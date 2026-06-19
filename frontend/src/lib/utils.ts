import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names safely: combines conditional classes (clsx) and
 * de-duplicates conflicting Tailwind utilities (tailwind-merge).
 * Every component uses this so prop-based overrides always win cleanly.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
