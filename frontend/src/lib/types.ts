/**
 * API response types for the dashboard.
 * These mirror the backend Prisma models. Money fields arrive as strings
 * (Prisma Decimal is JSON-serialized as a string), so we type them as such.
 */
import type { OrderStatus, OrderType, TableStatus } from "@cafe/shared";

export interface Outlet {
  id: string;
  name: string;
  city: string | null;
  currency: string;
  timezone: string;
  serviceTypes: string[];
  seatingCapacity: number | null;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  name: string;
  qty: number;
  unitPrice: string;
  notes: string | null;
  modifiers?: { name: string; price?: number }[] | null;
}

export interface OrderTable {
  id: string;
  name: string;
  area: string | null;
}

export interface Payment {
  id: string;
  method: string;
  amount: string;
  status: string;
  reference: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: number;
  outletId: string;
  tableId: string | null;
  type: OrderType;
  status: OrderStatus;
  subtotal: string;
  taxTotal: string;
  discount: string;
  total: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  table?: OrderTable | null;
  payments?: Payment[];
}

export interface MenuCategory {
  id: string;
  parentId: string | null;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: string;
  isVeg: boolean | null;
  isSpicy: boolean;
  isSweet: boolean;
  serves: number | null;
  isAvailable: boolean;
}

export interface RestaurantTable {
  id: string;
  outletId: string;
  name: string;
  area: string | null;
  capacity: number;
  status: TableStatus;
}

export interface Subscription {
  id: string;
  plan: string;
  status: string;
  billingCycle: string;
  trialEndsAt: string | null;
  trialDaysLeft: number;
}

export interface MeResponse {
  sub: string;
  tenantId: string | null;
  role: string;
  email: string;
}

export interface PaymentSummary {
  orderId: string;
  total: number;
  paid: number;
  balance: number;
  fullyPaid: boolean;
  payments: Payment[];
}

export interface Staff {
  id: string;
  fullName: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  outletId: string | null;
  isActive: boolean;
  posPin: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterShift {
  id: string;
  outletId: string;
  openedById: string | null;
  openingCash: string;
  closingCash: string | null;
  openedAt: string;
  closedAt: string | null;
}

export interface ShiftReconciliation {
  openingCash: number;
  expectedCash: number;
  countedCash: number;
  difference: number;
}
