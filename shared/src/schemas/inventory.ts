import { z } from 'zod';

/** Create / update an inventory item. */
export const createInventoryItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  unit: z.string().min(1).max(12).default('unit'),
  reorderLevel: z.number().nonnegative().optional(),
  perishable: z.boolean().optional(),
});
export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;

export const updateInventoryItemSchema = z.object({
  name: z.string().min(1).optional(),
  unit: z.string().min(1).max(12).optional(),
  reorderLevel: z.number().nonnegative().optional(),
  perishable: z.boolean().optional(),
});
export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>;

/** Receive stock: a new batch with quantity, unit cost, and optional expiry. */
export const receiveStockSchema = z.object({
  qty: z.number().positive('Quantity must be greater than 0'),
  unitCost: z.number().nonnegative('Cost cannot be negative'),
  expiresAt: z.string().datetime().optional(),
  receivedAt: z.string().datetime().optional(),
});
export type ReceiveStockInput = z.infer<typeof receiveStockSchema>;

/** Record consumption / waste / manual adjustment of stock. */
export const stockMovementSchema = z.object({
  type: z.enum(['out', 'waste', 'adjust']),
  qty: z.number().positive('Quantity must be greater than 0'),
  reason: z.string().max(200).optional(),
});
export type StockMovementInput = z.infer<typeof stockMovementSchema>;
