import { z } from 'zod';

/** Open a cash register/shift for an outlet with a starting float. */
export const openShiftSchema = z.object({
  outletId: z.string().uuid('Valid outlet id required'),
  openingCash: z.number().nonnegative('Opening cash cannot be negative'),
});
export type OpenShiftInput = z.infer<typeof openShiftSchema>;

/** Close the current shift; the counted cash is reconciled against expected. */
export const closeShiftSchema = z.object({
  closingCash: z.number().nonnegative('Closing cash cannot be negative'),
});
export type CloseShiftInput = z.infer<typeof closeShiftSchema>;
