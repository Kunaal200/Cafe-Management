import { z } from 'zod';
import { BusinessType, OrderType, TaxMode } from '../enums';

const businessTypeValues = Object.values(BusinessType) as [string, ...string[]];
const orderTypeValues = Object.values(OrderType) as [string, ...string[]];
const taxModeValues = Object.values(TaxMode) as [string, ...string[]];

/** Step 2 — Business details (creates the tenant). */
export const businessDetailsSchema = z.object({
  businessName: z.string().min(2, 'Business name is required'),
  businessType: z.enum(businessTypeValues),
  country: z.string().min(2, 'Country is required'),
  subdomain: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphens only'),
  logoUrl: z.string().url().optional(),
});
export type BusinessDetailsInput = z.infer<typeof businessDetailsSchema>;

/** Step 3 — First outlet. */
export const outletSchema = z.object({
  name: z.string().min(2, 'Outlet name is required'),
  addressLine: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  serviceTypes: z.array(z.enum(orderTypeValues)).min(1, 'Pick at least one service type'),
  seatingCapacity: z.number().int().nonnegative().optional(),
});
export type OutletInput = z.infer<typeof outletSchema>;

/** Step 4 — Localization & tax. */
export const localizationSchema = z.object({
  currency: z.string().length(3, 'Use 3-letter currency code'),
  timezone: z.string().min(1),
  taxName: z.string().min(1, 'Tax name required (e.g., GST, VAT)'),
  taxRate: z.number().min(0).max(100),
  taxMode: z.enum(taxModeValues),
  taxRegistrationNumber: z.string().optional(),
});
export type LocalizationInput = z.infer<typeof localizationSchema>;

/** Subdomain availability check. */
export const subdomainCheckSchema = z.object({
  subdomain: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphens only'),
});
export type SubdomainCheckInput = z.infer<typeof subdomainCheckSchema>;

/** Step 5 — Menu seed (template or manual). Categories carry items and optional
 * one-level subcategories (which also carry items). */
const menuItemSeedSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  price: z.number().nonnegative('Price cannot be negative'),
  isVeg: z.boolean().optional(),
});

export const menuSeedSchema = z.object({
  categories: z
    .array(
      z.object({
        name: z.string().min(1, 'Category name is required'),
        items: z.array(menuItemSeedSchema).default([]),
        subcategories: z
          .array(
            z.object({
              name: z.string().min(1, 'Subcategory name is required'),
              items: z.array(menuItemSeedSchema).default([]),
            }),
          )
          .default([]),
      }),
    )
    .min(1, 'Add at least one category'),
});
export type MenuSeedInput = z.infer<typeof menuSeedSchema>;

/** Step 6 — Tables quick setup. Auto-generates N tables (T1..Tn) for an outlet. */
export const tablesSeedSchema = z.object({
  count: z.number().int().min(1).max(200),
  area: z.string().optional(),
  capacity: z.number().int().min(1).optional(),
});
export type TablesSeedInput = z.infer<typeof tablesSeedSchema>;
