import { z } from 'zod';

/** Create / update a customer. */
export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional(),
  notes: z.string().max(500).optional(),
});
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = createCustomerSchema;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

/** Record feedback (rating 1–5 + optional comment), optionally for a customer/order. */
export const createFeedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
  customerId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
});
export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
