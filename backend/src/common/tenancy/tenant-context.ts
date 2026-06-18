import { AsyncLocalStorage } from 'node:async_hooks';

export interface TenantContext {
  tenantId: string | null;
  userId: string | null;
  role: string | null;
}

/**
 * AsyncLocalStorage-based tenant context.
 * Set per request by the auth layer; read anywhere in the request lifecycle
 * to scope queries by tenant without threading tenantId through every call.
 */
export const tenantStorage = new AsyncLocalStorage<TenantContext>();

export function getTenantContext(): TenantContext {
  return tenantStorage.getStore() ?? { tenantId: null, userId: null, role: null };
}

export function getTenantIdOrThrow(): string {
  const ctx = getTenantContext();
  if (!ctx.tenantId) {
    throw new Error('Tenant context is not set for this request');
  }
  return ctx.tenantId;
}
