import { z } from 'zod';

/** Create a coupon. Code is uppercased server-side; value meaning depends on type. */
export const createCouponSchema = z.object({
  code: z
    .string()
    .min(3, 'Code must be at least 3 characters')
    .max(30)
    .regex(/^[A-Za-z0-9_-]+$/, 'Letters, numbers, hyphens and underscores only'),
  type: z.enum(['amount', 'percent']).default('percent'),
  value: z.number().positive('Value must be greater than 0'),
  minOrder: z.number().nonnegative().optional(),
  maxRedemptions: z.number().int().positive().optional(),
  customerId: z.string().uuid().optional(),
  expiresAt: z.string().datetime().optional(),
});
export type CreateCouponInput = z.infer<typeof createCouponSchema>;

/** Update a coupon (e.g. toggle active, change limits). */
export const updateCouponSchema = z.object({
  value: z.number().positive().optional(),
  minOrder: z.number().nonnegative().nullable().optional(),
  maxRedemptions: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;

/** Apply a coupon to an order at checkout. */
export const applyCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code required'),
});
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
