# Progress Checklist

> Snapshot of what's built versus what's left, tracked against the work done so far.
> Companion to `DEVELOPMENT_CHECKLIST.md` (the original sequenced plan).
> Last updated: 2026-06-19

Legend: [x] done · [~] partial · [ ] not started

---

## Backend (NestJS + Prisma + PostgreSQL + Redis)

### Foundation
- [x] Modular NestJS scaffold, `/api/v1` versioning, Swagger docs
- [x] Prisma + PostgreSQL, migrations, seed data
- [x] Redis (cache / OTP store)
- [x] Centralized error handling, request validation (Zod), logging
- [x] Multi-tenancy: `tenant_id` scoping + AsyncLocalStorage tenant context middleware
- [x] Auth: JWT access/refresh, argon2 hashing, OTP (dev-logged), RBAC roles, guards
- [ ] Postgres Row-Level Security safety net (app-layer scoping in place)
- [ ] Automated tests (unit/integration) — jest configured, tests pending

### Domain endpoints
- [x] Auth: signup, verify-otp, login, staff-login, refresh, me
- [x] Onboarding: business, outlet, localization/tax, menu seed (now with subcategories), tables seed, complete
- [x] Outlets: list + get (added for dashboard outlet switcher)
- [x] Menu: categories + items CRUD, availability toggle
- [x] Menu: hierarchical categories (parent/subcategory, one level)
- [x] Menu items: veg, spicy, sweet, serves attributes
- [x] Tables: CRUD + status
- [x] Orders: create, items add/update/remove, send-to-kitchen, status lifecycle, list/detail
- [x] Orders: sequential `orderNumber`
- [x] Checkout: discount, payments (split), payment summary, finalize (frees table)
- [x] Register/shift: open, close + cash reconciliation, current, history
- [x] Subscription: read current + change plan
- [x] Staff: full CRUD + reset password
- [ ] Standalone Tenant/Outlet update (CRUD) endpoints — only created via onboarding
- [ ] Reporting/analytics aggregation endpoint (reports currently computed client-side)
- [ ] Profile/account update endpoints (settings is read-only)

---

## Frontend (Next.js + Tailwind + custom design system)

### Public / Auth / Onboarding
- [x] Marketing landing (hero, features, pricing, testimonials, CTA, nav/footer)
- [x] Signup with OTP, Login
- [x] Onboarding wizard: business → outlet → localization → menu → tables → finish
- [x] Country / currency / timezone full datasets + searchable; city autocomplete
- [x] Onboarding: interactive multi-category + subcategory menu builder
- [x] Onboarding: confirm-before-leave guard + progress persistence (sessionStorage)

### Dashboard shell & infra
- [x] App shell: sidebar nav, top bar, outlet switcher, auth+tenant guard, logout
- [x] Session/role context, permission helpers (money vs order roles)
- [x] Toast notifications + promise-based confirm dialog
- [x] Reusable data-fetch hook, money/date formatting, design-system primitives

### Dashboard pages
- [x] Home: stats (orders/revenue/live), live order feed (polling)
- [x] Orders: filterable list + create new order (type/table)
- [x] Order workspace: menu catalog, editable cart (qty/notes/remove), lifecycle actions
- [x] Checkout: discount + payment modal (split, cash change live), finalize
- [x] Menu: hierarchical categories/subcategories, items CRUD, availability, badges (veg/spicy/sweet/serves)
- [x] Tables: floor grid, add/delete, status cycling
- [x] Register: open/close shift, reconciliation, history
- [x] Staff: list/create/edit/reset-password/delete
- [x] Reports: revenue/avg/top-items/order-type (client-side, date-range filter)
- [x] Subscription: plan management (monthly/annual)
- [~] Settings: profile + outlet info shown (read-only; editing pending)

---

## Cross-cutting / polish
- [x] Sequential, human-friendly order numbers
- [x] Consistent toasts + confirm dialogs across destructive actions
- [x] Role-gated actions client-side (backend guards remain source of truth)
- [ ] Role-filtered sidebar nav (e.g. hide Subscription/Staff from cashier)
- [ ] Real-time updates (websockets) — currently polling
- [ ] Orders list search + pagination for large histories
- [ ] Empty-state/skeleton polish, accessibility pass

---

## Not started (next candidates)
- [ ] POS / KDS dedicated apps (touch-first order + kitchen display)
- [ ] Editable settings (profile, outlet, password) + backend endpoints
- [ ] Dedicated reporting backend (payment-method mix, daily trends, multi-outlet)
- [ ] Customers / CRM (model exists, no UI)
- [ ] Receipt printing
- [ ] Email/SMS provider for OTP & confirmations (Stage 7)
- [ ] Payment gateway integration (Stripe/Razorpay)
- [ ] CI/CD, staging, deployment, monitoring (Stage 9)
- [ ] Resume onboarding after mid-flow refresh (needs tenant status on /auth/me)

---

## Known follow-ups / tech debt
- Reports derive from the orders list, so no payment-method breakdown and no pagination.
- Settings is read-only (no profile/outlet update endpoints yet).
- Migrations applied to local DB only; other environments need `prisma migrate deploy`.
- No automated tests on backend or frontend yet; verification is typecheck + build + manual smoke.
