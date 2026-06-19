# Design — Dashboard Order Taking & Checkout

## Overview

Turn the existing Orders area into a working POS loop. No backend changes; all
behavior is composed from existing endpoints. The order detail page becomes an
**order workspace**: when an order is `open`, it shows a menu catalog to build the
bill; at any stage it shows lifecycle actions; and it gains a **checkout panel** for
discount, payments, and finalize (visible to money roles only).

## Architecture & routes

- `app/dashboard/orders/page.tsx` — add a role-gated **New order** button + creation modal.
- `app/dashboard/orders/[id]/page.tsx` — expand into the order workspace (replaces the current read-mostly detail).
- No new routes; everything hangs off the existing Orders pages.

## New shared infrastructure

- **Toast system** — `features/dashboard/toast.tsx`: `ToastProvider` + `useToast()`.
  Mounted once in `app/dashboard/layout.tsx`. Provides `toast.success(msg)` and
  `toast.error(msg)`. (R8.1, R8.2)
- **Confirm dialog** — `design-system/confirm-dialog.tsx` built on the existing
  `Modal`, exposed via a `ConfirmProvider` + `useConfirm()` that returns a promise
  resolving to a boolean. Replaces browser `confirm()` app-wide. (R8.3)
- **Session/role context** — `features/dashboard/session-context.tsx`: the layout
  already fetches `/auth/me` for its guard; store and provide `{ role, email, sub }`
  so pages can gate actions without refetching.
- **Permission helper** — `lib/permissions.ts`: `canHandleMoney(role)` →
  `owner|manager|cashier`; `canTakeOrders(role)` → adds `waiter`. (R9.4)

## Components

- **NewOrderModal** — order type selector (dine_in default / takeaway / delivery);
  table dropdown shown only for dine_in, sourced from `GET /tables?outletId=selected`;
  on submit `POST /orders` → route to `/dashboard/orders/:id`. Disabled with message
  when no outlet selected. (R1, R9.1, R9.2)
- **MenuCatalog** — category tabs + search; cards from `GET /menu/categories` +
  `GET /menu/items`; unavailable items dimmed and non-clickable; click → add item.
  Rendered only when order is `open`. Empty state when no menu. (R2)
- **OrderCart** — line items with a **QtyStepper** (`PATCH .../items/:itemId`), note
  edit, remove (`DELETE`, behind `useConfirm`); live subtotal/tax/discount/total from
  the order response. Editing disabled when not `open`. (R3)
- **LifecycleActions** — Send to kitchen / advance / cancel, computed from current
  status against the transition map; toasts; in-flight disable. (R4, R8.4)
- **CheckoutPanel** (money role only) — discount form (amount/percent, 0–100);
  payments list + balance from `GET /orders/:id/payments`; add-payment form (method,
  amount, reference; cash shows change-due computed client-side, not sent); Finalize
  enabled only when balance ≤ 0 → `POST /orders/:id/checkout`. (R5, R6, R7)

## Workspace layout

Two-column on desktop: left = MenuCatalog (open orders only); right = OrderCart +
LifecycleActions + CheckoutPanel stacked. Single column on mobile (catalog on top,
cart/checkout below). Terminal orders hide the catalog and show a read-only summary.

## State & data flow

- Reuse `useApi` for the order (`/orders/:id`) and payment summary; mutations call
  `apiFetch` then `refetch()`. No optimistic updates — the backend returns recomputed
  totals, rendered as the source of truth. (R2.4, R3.2)
- In-flight controls disabled via local `busy` state. (R8.4)
- Role from session context drives client-side gating; backend guard remains the real
  enforcement. (R9.4) 401 → clear session + redirect (handled by `apiFetch`/guard). (R9.5)

## Error handling

- Every mutation wrapped so backend `ApiError.message` surfaces via toast; UI state
  changes only on success. (R2.6, R4.6, R7.6)

## Testing

- No frontend test framework is set up yet. Default verification = `tsc --noEmit` +
  `next build` + manual smoke of the full loop. Automated component tests
  (Vitest + Testing Library) are an optional follow-up task.
