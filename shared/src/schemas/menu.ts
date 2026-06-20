import { z } from 'zod';

/** Menu category create/update. */
export const createMenuCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  sortOrder: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});
export type CreateMenuCategoryInput = z.infer<typeof createMenuCategorySchema>;

export const updateMenuCategorySchema = createMenuCategorySchema.partial();
export type UpdateMenuCategoryInput = z.infer<typeof updateMenuCategorySchema>;

/** Menu item create/update. Price is a non-negative number with up to 2 decimals. */
export const createMenuItemSchema = z.object({
  categoryId: z.string().uuid('Valid category id required'),
  name: z.string().min(1, 'Item name is required'),
  description: z.string().max(500).optional(),
  price: z.number().nonnegative('Price cannot be negative'),
  photoUrl: z.string().url().optional(),
  isVeg: z.boolean().optional(),
  isSpicy: z.boolean().optional(),
  isSweet: z.boolean().optional(),
  serves: z.number().int().min(1).max(50).optional(),
  isAvailable: z.boolean().optional(),
  taxRuleId: z.string().uuid().optional(),
});
export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;

export const updateMenuItemSchema = createMenuItemSchema.partial();
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;

/** Availability toggle for a menu item. */
export const toggleAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});
export type ToggleAvailabilityInput = z.infer<typeof toggleAvailabilitySchema>;
