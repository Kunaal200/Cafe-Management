import { z } from 'zod';
import { OrderStatus, OrderType } from '../enums';

const orderTypeValues = Object.values(OrderType) as [string, ...string[]];
const orderStatusValues = Object.values(OrderStatus) as [string, ...string[]];

/** A modifier/add-on captured on an order line (e.g. "Extra shot", +0.50). */
export const orderItemModifierSchema = z.object({
  name: z.string().min(1),
  price: z.number().nonnegative().optional(),
});

/** A line item being added to an order. Price/name are snapshotted server-side from the menu. */
export const orderLineInputSchema = z.object({
  menuItemId: z.string().uuid('Valid menu item id required'),
  qty: z.number().int().min(1).max(99),
  notes: z.string().max(200).optional(),
  modifiers: z.array(orderItemModifierSchema).optional(),
});
export type OrderLineInput = z.infer<typeof orderLineInputSchema>;

/** Create a new order (optionally with initial items). */
export const createOrderSchema = z.object({
  outletId: z.string().uuid('Valid outlet id required'),
  type: z.enum(orderTypeValues).default(OrderType.DINE_IN),
  tableId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
  items: z.array(orderLineInputSchema).optional(),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

/** Add one or more line items to an existing order. */
export const addOrderItemsSchema = z.object({
  items: z.array(orderLineInputSchema).min(1, 'Add at least one item'),
});
export type AddOrderItemsInput = z.infer<typeof addOrderItemsSchema>;

/** Update a single order line (quantity / notes). */
export const updateOrderItemSchema = z.object({
  qty: z.number().int().min(1).max(99).optional(),
  notes: z.string().max(200).nullable().optional(),
});
export type UpdateOrderItemInput = z.infer<typeof updateOrderItemSchema>;

/** Advance an order's status (transitions validated server-side). */
export const updateOrderStatusSchema = z.object({
  status: z.enum(orderStatusValues),
});
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

/** Attach or clear the customer on an order. */
export const setOrderCustomerSchema = z.object({
  customerId: z.string().uuid().nullable(),
});
export type SetOrderCustomerInput = z.infer<typeof setOrderCustomerSchema>;
