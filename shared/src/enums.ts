/**
 * Shared enums used across backend and frontend.
 * Keep these as the single source of truth for cross-cutting domain values.
 */

export const UserRole = {
  SUPER_ADMIN: 'super_admin',
  OWNER: 'owner',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  WAITER: 'waiter',
  KITCHEN: 'kitchen',
  ACCOUNTANT: 'accountant',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const TenantStatus = {
  SIGNED_UP: 'signed_up',
  TRIAL: 'trial',
  CONFIGURING: 'configuring',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  CHURNED: 'churned',
} as const;
export type TenantStatus = (typeof TenantStatus)[keyof typeof TenantStatus];

export const OrderType = {
  DINE_IN: 'dine_in',
  TAKEAWAY: 'takeaway',
  DELIVERY: 'delivery',
} as const;
export type OrderType = (typeof OrderType)[keyof typeof OrderType];

export const OrderStatus = {
  OPEN: 'open',
  SENT_TO_KITCHEN: 'sent_to_kitchen',
  PREPARING: 'preparing',
  READY: 'ready',
  SERVED: 'served',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const TableStatus = {
  FREE: 'free',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved',
} as const;
export type TableStatus = (typeof TableStatus)[keyof typeof TableStatus];

export const PaymentMethod = {
  CASH: 'cash',
  CARD: 'card',
  UPI: 'upi',
  WALLET: 'wallet',
  ONLINE: 'online',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PaymentStatus = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const BusinessType = {
  CAFE: 'cafe',
  FINE_DINE: 'fine_dine',
  QSR: 'qsr',
  BAR: 'bar',
  CLOUD_KITCHEN: 'cloud_kitchen',
  BAKERY: 'bakery',
} as const;
export type BusinessType = (typeof BusinessType)[keyof typeof BusinessType];

export const TaxMode = {
  INCLUSIVE: 'inclusive',
  EXCLUSIVE: 'exclusive',
} as const;
export type TaxMode = (typeof TaxMode)[keyof typeof TaxMode];
