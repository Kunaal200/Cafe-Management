# Tasks — Dashboard Order Taking & Checkout

- [ ] 1. Shared feedback + permission infrastructure
  - Create `features/dashboard/toast.tsx` (`ToastProvider`, `useToast`) and mount in `app/dashboard/layout.tsx`.
  - Create `design-system/confirm-dialog.tsx` on top of `Modal`, exposed via `ConfirmProvider` + `useConfirm()`.
  - Create `lib/permissions.ts` with `canHandleMoney(role)` and `canTakeOrders(role)`.
  - Create `features/dashboard/session-context.tsx`; have the layout provide `/auth/me` role/email.
  - _Requirements: R8.1, R8.2, R8.3, R9.4_

- [ ] 2. New-order creation flow
  - Add a role-gated **New order** button to `app/dashboard/orders/page.tsx`.
  - Build `NewOrderModal`: type (dine_in default / takeaway / delivery); table select for dine_in from `GET /tables?outletId=selected`; disable + explain when no outlet.
  - On submit `POST /orders`; toast; navigate to `/dashboard/orders/:id`.
  - _Requirements: R1.1–R1.7, R9.1, R9.2_

- [ ] 3. Order workspace scaffold
  - Refactor `app/dashboard/orders/[id]/page.tsx` into a responsive two-column workspace.
  - Status-aware rendering: catalog only for `open`; read-only summary for terminal orders.
  - Gate the checkout panel with `canHandleMoney`.
  - _Requirements: R3.5, R9.4_

- [ ] 4. Menu catalog + add items
  - Build `MenuCatalog`: category tabs + search; cards from `GET /menu/categories` + `GET /menu/items`.
  - Dim/disable unavailable items; add available item via `POST /orders/:id/items` then refetch.
  - Empty state when no categories/items.
  - _Requirements: R2.1–R2.6_

- [ ] 5. Order cart: edit & remove items
  - `OrderCart` with `QtyStepper` → `PATCH /orders/:id/items/:itemId`; inline note edit; remove via `DELETE` behind `useConfirm`.
  - Live subtotal/tax/discount/total; disable editing when status ≠ `open`.
  - _Requirements: R3.1–R3.6_

- [ ] 6. Lifecycle actions (refactor existing)
  - Extract `LifecycleActions`: send to kitchen (open + ≥1 item), valid next transitions, cancel behind confirm; toasts; disable in-flight.
  - _Requirements: R4.1–R4.6, R8.4_

- [ ] 7. Checkout panel — discount
  - In `CheckoutPanel` (money roles), discount form amount/percent (0–100) → `POST /orders/:id/discount`; show as separate bill line.
  - _Requirements: R5.1–R5.5_

- [ ] 8. Checkout panel — payments & split
  - Show total/paid/balance from `GET /orders/:id/payments`; add-payment form (method, amount, reference) → `POST /orders/:id/payments`; allow repeats until balance ≤ 0.
  - Cash: tendered input + change due, recording only the bill amount; validate amount > 0.
  - _Requirements: R6.1–R6.7_

- [ ] 9. Checkout panel — finalize
  - Enable Finalize only when balance ≤ 0 (else show remaining); `POST /orders/:id/checkout`.
  - On success: completion confirmation, reflect `completed` + freed table, offer Back to orders / New order; surface rejections.
  - _Requirements: R7.1–R7.6, R8.1, R8.2_

- [ ] 10. Polish, consistency, and verification
  - Replace browser `confirm()` in `menu/page.tsx` and `tables/page.tsx` with `useConfirm`; add success toasts.
  - Verify: frontend `tsc --noEmit` + `next build`; manual smoke of the full loop.
  - _Requirements: R8.3, R8.4_

- [ ] 11. (Optional) Frontend component tests
  - Set up Vitest + Testing Library; cover `QtyStepper`, checkout balance/finalize gating, role gating.
  - _Requirements: R3.2, R6.6, R7.1, R9.4_
