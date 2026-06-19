import { z } from 'zod';
import { PaymentMethod } from '../enums';

const paymentMethodValues = Object.values(PaymentMethod) as [string, ...string[]];

/** Apply a discount to an order, either a flat amount or a percentage of the gross. */
export const applyDiscountSchema = z.object({
  type: z.enum(['amount', 'percent']),
  value: z.number().nonnegative('Discount cannot be negative'),
});
export type ApplyDiscountInput = z.infer<typeof applyDiscountSchema>;

/** Record a payment against an order. Multiple payments = split bill. */
export const addPaymentSchema = z.object({
  method: z.enum(paymentMethodValues),
  amount: z.number().positive('Payment amount must be greater than 0'),
  reference: z.string().max(100).optional(),
});
export type AddPaymentInput = z.infer<typeof addPaymentSchema>;
