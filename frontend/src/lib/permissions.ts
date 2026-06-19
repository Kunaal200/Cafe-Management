/**
 * Client-side role gating helpers. These mirror the backend role guards so the
 * UI hides/disables actions a user can't perform. The backend remains the real
 * source of truth — these only shape the interface.
 */
import { UserRole } from "@cafe/shared";

const MONEY_ROLES: string[] = [UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER];
const ORDER_ROLES: string[] = [...MONEY_ROLES, UserRole.WAITER];

/** Can apply discounts, take payments, and finalize checkout. */
export function canHandleMoney(role: string | undefined | null): boolean {
  return role != null && MONEY_ROLES.includes(role);
}

/** Can create orders and edit their items / lifecycle. */
export function canTakeOrders(role: string | undefined | null): boolean {
  return role != null && ORDER_ROLES.includes(role);
}
