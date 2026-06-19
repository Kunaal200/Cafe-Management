import { z } from 'zod';
import { UserRole } from '../enums';
import { passwordSchema } from './auth';

/**
 * Roles an owner/manager may assign to a staff account.
 * Excludes super_admin (platform) and owner (the account holder).
 */
export const assignableStaffRoles = [
  UserRole.MANAGER,
  UserRole.CASHIER,
  UserRole.WAITER,
  UserRole.KITCHEN,
  UserRole.ACCOUNTANT,
] as const;

const staffRoleSchema = z.enum(
  assignableStaffRoles as unknown as [string, ...string[]],
);

const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username is too long')
  .regex(/^[a-z0-9._-]+$/, 'Use lowercase letters, numbers, dots, hyphens, underscores');

/** Owner creates a staff account (chef/kitchen, cashier, waiter, etc.). */
export const createStaffSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  username: usernameSchema,
  password: passwordSchema,
  role: staffRoleSchema,
  outletId: z.string().uuid().optional(),
  phone: z.string().optional(),
  posPin: z.string().regex(/^[0-9]{4,6}$/, 'PIN must be 4-6 digits').optional(),
});
export type CreateStaffInput = z.infer<typeof createStaffSchema>;

/** Owner updates a staff account's profile/role/status (not password). */
export const updateStaffSchema = z.object({
  fullName: z.string().min(2).optional(),
  role: staffRoleSchema.optional(),
  outletId: z.string().uuid().nullable().optional(),
  phone: z.string().optional(),
  posPin: z.string().regex(/^[0-9]{4,6}$/, 'PIN must be 4-6 digits').optional(),
  isActive: z.boolean().optional(),
});
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;

/** Owner resets a staff member's password. */
export const resetStaffPasswordSchema = z.object({
  password: passwordSchema,
});
export type ResetStaffPasswordInput = z.infer<typeof resetStaffPasswordSchema>;

/** Staff log in with their workspace subdomain + username + password. */
export const staffLoginSchema = z.object({
  subdomain: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9-]+$/, 'Invalid workspace'),
  username: usernameSchema,
  password: z.string().min(1, 'Password required'),
});
export type StaffLoginInput = z.infer<typeof staffLoginSchema>;
