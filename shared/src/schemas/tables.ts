import { z } from 'zod';
import { TableStatus } from '../enums';

const tableStatusValues = Object.values(TableStatus) as [string, ...string[]];

/** Create a single table under an outlet. */
export const createTableSchema = z.object({
  outletId: z.string().uuid('Valid outlet id required'),
  name: z.string().min(1, 'Table name is required'),
  area: z.string().optional(),
  capacity: z.number().int().min(1).max(50).optional(),
});
export type CreateTableInput = z.infer<typeof createTableSchema>;

/** Update a table's details or status. */
export const updateTableSchema = z.object({
  name: z.string().min(1).optional(),
  area: z.string().nullable().optional(),
  capacity: z.number().int().min(1).max(50).optional(),
  status: z.enum(tableStatusValues).optional(),
});
export type UpdateTableInput = z.infer<typeof updateTableSchema>;

/** Change only the status (free / occupied / reserved). */
export const tableStatusSchema = z.object({
  status: z.enum(tableStatusValues),
});
export type TableStatusInput = z.infer<typeof tableStatusSchema>;
