import { z } from 'zod';

/** Set the full recipe (ingredient list) for a menu item. Replaces existing. */
export const setRecipeSchema = z.object({
  ingredients: z
    .array(
      z.object({
        inventoryItemId: z.string().uuid('Valid inventory item required'),
        qty: z.number().positive('Quantity must be greater than 0'),
      }),
    )
    .default([]),
});
export type SetRecipeInput = z.infer<typeof setRecipeSchema>;
