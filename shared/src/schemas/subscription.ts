import { z } from 'zod';

/** Change the tenant's plan and/or billing cycle. */
export const changePlanSchema = z.object({
  plan: z.string().min(1, 'Plan is required'),
  billingCycle: z.enum(['monthly', 'annual']),
});
export type ChangePlanInput = z.infer<typeof changePlanSchema>;
