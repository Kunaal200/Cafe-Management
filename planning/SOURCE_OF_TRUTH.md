# Cafe & Restaurant Management System — Source of Truth

> This is the single source-of-truth document for the project. Everything we plan, decide, and change lives here.
> Edit freely. Mark decisions as you confirm or change them.

> **For a short, manager-friendly summary, see [`PROJECT_OVERVIEW.md`](./PROJECT_OVERVIEW.md).**

- **Project:** Multi-tenant Cafe & Restaurant Management System
- **Goal:** A SaaS platform any cafe/restaurant owner can sign up for and use to run their business.
- **Status:** Planning
- **Last updated:** 2026-06-18
- **Diagrams & architecture:** see [`ARCHITECTURE.md`](./ARCHITECTURE.md) (Mermaid diagrams: system architecture, multi-tenancy, ER diagram, order/reservation flows, deployment, roadmap Gantt, and more)
- **Frontend pages:** see [`FRONTEND_PAGES.md`](./FRONTEND_PAGES.md) (all screens by portal, features per page, page counts, MVP set)
- **Onboarding wizard:** see [`ONBOARDING.md`](./ONBOARDING.md) (first-time signup flow, fields per step, and how each configures the cafe environment)
- **Frontend tooling & design system:** see [`FRONTEND_DESIGN_SYSTEM.md`](./FRONTEND_DESIGN_SYSTEM.md) (tooling decision incl. Stitch/v0, recommended stack, design tokens, core components, build order)
- **Development checklist:** see [`DEVELOPMENT_CHECKLIST.md`](./DEVELOPMENT_CHECKLIST.md) (sequenced, actionable start-of-development checklist from setup to MVP deployment)

---

## 1. Vision

Build a multi-tenant SaaS where each cafe/restaurant owner gets their own isolated workspace to manage
operations (POS, billing, menu, inventory), front-of-house (reservations, tables), customers (CRM, loyalty),
and growth (online ordering, analytics). Designed API-first so web today and mobile apps (Android + iOS)
can be added in later versions without a rewrite.

### The market gap we are targeting
No single competitor combines deep operations + reservations + marketing + modern UX at an affordable price
for small/independent cafes. That is our opening.

---

## 2. Competitor Analysis

> Source details rephrased for compliance with licensing restrictions. Pulled from each vendor's site, June 2026.

### Petpooja (India / UAE / Thailand / US)
Benchmark for **operations & back-office depth**.
- Billing with multiple counters synced to a master station, KOT generation, split/merge tables, discounts, coupons
- Deep inventory: central kitchen for single & multi-outlet, supplier management, item-wise stock, low-stock alerts, food cost reports, damaged-stock returns
- Menu management with separate menus per dining area + full pricing control
- 80+ reports; multi-outlet reporting on one screen (sales, inventory, staff performance)
- Add-on marketplace: Captain app, KDS, customer feedback, scan & pay, reservation manager, token management
- ERP integrations (Tally, SAP, Dynamics NAV) for large chains
- **Takeaway:** Hard to beat on inventory & reporting depth.

### LimeTray
**All-in-one suite** (operations + marketing).
- Cloud POS, inventory, KDS, third-party aggregator order management (edit menus across aggregators centrally)
- Built-in CRM, loyalty programs, feedback systems
- Vertical packaging (QSR, fine dine, cafe, bar, cloud kitchen)
- Multi-outlet central dashboard with outlet-wise reports
- Enterprise marketing: push notifications, location-based tracking
- **Takeaway:** Strong on bundling retention/marketing with ops.

### EatApp
Specialist in **reservations & guest experience** (not full POS).
- Online reservations with Google Reservations integration
- Table management, floor plan, waitlist
- Restaurant CRM with guest database & history
- AI tools, multi-location guest management, strong mobile app
- **Takeaway:** Best-in-class front-of-house. A module for us to build, not their whole-suite approach.

### Zoho (POS + Creator)
**Flexible business platform**, less restaurant-specific.
- Retail POS: real-time inventory across locations, reorder levels, low-stock alerts, barcode scanning
- Centralized customer management with history & preferences
- Reports/dashboards, menu performance by time/day
- Zoho Creator no-code custom apps
- Edge: integration with wider Zoho ecosystem (Books, CRM, Inventory, Payroll)
- **Takeaway:** Generalist; strength is ecosystem & customization, not restaurant-native depth.

### Comparison Matrix

| Area | Petpooja | LimeTray | EatApp | Zoho |
|---|---|---|---|---|
| POS / billing | Excellent | Strong | None | Moderate (retail) |
| Inventory / central kitchen | Excellent | Strong | None | Moderate |
| Reservations / table mgmt | Add-on | Basic | Excellent | None |
| CRM / loyalty / marketing | Add-on | Excellent | Good (CRM) | Good (ecosystem) |
| Aggregator integration | Strong | Excellent | None | Weak |
| Reporting | Excellent (80+) | Strong | Moderate | Strong |
| Multi-outlet | Excellent | Excellent | Good | Good |

---

## 3. Feature Roadmap (by phase)

### Foundation — Multi-Tenancy & Platform (build first)
- [ ] Tenant isolation model (shared DB with tenant_id, or DB-per-tenant for large clients)
- [ ] Tenant onboarding/signup, per-tenant subdomain or workspace
- [ ] Role-based access control (super admin, owner, manager, cashier, waiter, kitchen, accountant)
- [ ] Subscription & billing (plan tiers, per-outlet pricing, trials, usage limits)
- [ ] Per-tenant settings: branding, currency, tax rules, timezone, language
- [ ] Audit logs & activity tracking

### Phase 1 — Core POS & Operations (MVP)
- [ ] Billing/checkout: split bill, merge tables, discounts, coupons, multiple payment modes
- [ ] KOT (Kitchen Order Ticket) generation & routing
- [ ] Menu management: categories, modifiers/add-ons, per-area menus, pricing control
- [ ] Table & floor management (dine-in, takeaway, delivery order types)
- [ ] Offline mode (POS works without internet, syncs later) — critical
- [ ] Receipt printing & digital receipts
- [ ] Daily cash register / shift open-close reconciliation

### Phase 2 — Inventory & Kitchen
- [ ] Stock management with recipe-level deduction (ingredient mapping per item)
- [ ] Low-stock alerts & reorder points
- [ ] Supplier/vendor management & purchase orders
- [ ] Central kitchen / commissary module for multi-outlet stock transfer
- [ ] Food cost & wastage reports
- [ ] Kitchen Display System (KDS) with order status tracking

### Phase 3 — Front-of-House & Customer
- [ ] Reservation system with floor plan & waitlist (our differentiator)
- [ ] QR-code scan-to-order and scan-to-pay at table
- [ ] Customer CRM: guest profiles, visit history, preferences
- [ ] Loyalty programs & points
- [ ] Feedback/review collection
- [ ] Token/queue management for QSR

### Phase 4 — Online & Integrations
- [ ] Online ordering website/app per tenant (white-label)
- [ ] Third-party aggregator integration (Zomato, Swiggy, Uber Eats, DoorDash) with menu sync
- [ ] Payment gateway integrations (Stripe, Razorpay, etc.)
- [ ] WhatsApp/SMS/email notifications
- [ ] Accounting integrations (Tally, QuickBooks, Zoho Books)

### Phase 5 — Analytics & Growth
- [ ] Multi-outlet dashboard on one screen
- [ ] Sales, inventory, staff performance, item-wise reports
- [ ] AI: demand forecasting, menu optimization, smart reordering
- [ ] Marketing automation (campaigns, push notifications, segment targeting)
- [ ] Staff management: attendance, shifts, payroll basics, tip handling

### Cross-cutting concerns
- [ ] Mobile apps: Captain/waiter app, owner dashboard app
- [ ] Compliance: GST/VAT/regional tax engines (varies by country)
- [ ] Data security: PCI-DSS for payments, encryption, per-tenant isolation
- [ ] Scalability: handle peak meal-time load across thousands of tenants

---

## 4. Architecture Strategy (API-first, mobile-ready)

The single most important principle: build **API-first** so the same backend serves web today and mobile apps later.

```
┌─────────────────────────────────────────────┐
│   Clients (added over time)                   │
│   Web app  │  Owner mobile app │ Waiter app   │
└──────────────────┬──────────────────────────┘
                   │  (HTTPS / REST or GraphQL API)
┌──────────────────▼──────────────────────────┐
│   Backend API  (ALL business logic here)      │
│   auth · billing · orders · inventory · menu  │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│   Database (multi-tenant)                     │
└───────────────────────────────────────────────┘
```

### Path from start to mobile
1. Build a standalone backend API first (all logic as endpoints, JWT auth).
2. Build the web app as an API client (proves the API is complete).
3. Add mobile apps later as a new UI project reusing the same API — additive, not a rewrite.

### Decisions to lock in now so mobile is painless later
1. **API-first** — never put business logic in the web UI.
2. **Stateless auth (JWT)** — same token system for web & mobile.
3. **Versioned APIs** (`/api/v1/...`) — evolve without breaking installed app versions.
4. **Offline-first mobile data layer** — local DB + sync queue for POS reliability.
5. **Push notifications** — design for Firebase Cloud Messaging (Android) + APNs (iOS); store device tokens per user.
6. **Hardware abstraction** — receipt printers, cash drawers, KDS behind a clean interface.

### App store realities
- **Google Play:** ~$25 one-time fee, faster review.
- **Apple App Store:** $99/year, stricter review, needs Mac/cloud-Mac toolchain to build.
- A single React Native or Flutter codebase publishes to both.

---

## 5. Recommended Tech Stack (proposed — to confirm)

| Layer | Recommendation | Alternatives |
|---|---|---|
| Backend API | Node.js (NestJS) | Python (Django/FastAPI), Java (Spring Boot) |
| Web frontend | React + TypeScript | Vue, Angular |
| Mobile (future) | React Native | Flutter |
| Database | PostgreSQL | MySQL |
| Auth | JWT (stateless) | OAuth2 / managed auth |
| Mobile stepping stone | PWA (installable web app) | — |

Rationale: React on web + React Native on mobile maximizes skill/code reuse; TypeScript shares types,
validation, and API-client code across web and mobile. PostgreSQL handles multi-tenancy well.

---

## 6. Suggested Release Plan

1. **v1:** Multi-tenant backend API + web dashboard (POS, menu, billing). API-first.
2. **v1.5:** Make web app a PWA for basic mobile access on tablets/phones.
3. **v2:** React Native (or Flutter) waiter/captain app → Google Play + iOS.
4. **v2.5:** Owner analytics app + customer-facing ordering app — all reusing the same backend.

---

## 7. Differentiation Strategy
1. Nail offline-first POS reliability (common pain point in cloud systems).
2. Bundle reservations + CRM + loyalty into the core (competitors charge extra).
3. Modern, fast UX with quick onboarding.
4. Transparent, affordable per-outlet pricing for small cafes.

---

## 8. Open Questions / To Decide
> Add your corrections and decisions here.

- [ ] Target market/regions first (affects tax, currency, aggregators, payment gateways)?
- [ ] Multi-tenancy model: shared DB vs DB-per-tenant?
- [ ] Confirm tech stack choices in section 5.
- [ ] Pricing model details (per outlet, per seat, flat tiers)?
- [ ] Which features are must-have for v1 vs later?

---

## 9. Change Log
- 2026-06-18 — Initial planning document created (competitor analysis, feature roadmap, architecture, tech stack, release plan).
- 2026-06-18 — Added `ARCHITECTURE.md` with Mermaid diagrams (system architecture, multi-tenancy, module map, ER diagram, order & reservation sequences, auth/RBAC, offline sync, deployment, mobile path, roadmap Gantt, onboarding state machine).
- 2026-06-18 — Added `FRONTEND_PAGES.md` (screen breakdown by portal, features per page, ~60 total pages, ~22-page MVP set, shared UI building blocks).
- 2026-06-18 — Added `ONBOARDING.md` (9-step first-time signup wizard, fields per step, field-to-configuration map, environment provisioning, ~10-11 onboarding screens).
- 2026-06-18 — Added `FRONTEND_DESIGN_SYSTEM.md` (frontend tooling decision incl. Stitch/v0 usage, recommended stack, design tokens, core component library, folder structure, build order).
- 2026-06-18 — Added `DEVELOPMENT_CHECKLIST.md` (10-stage sequenced development checklist from decisions/setup through MVP deployment, plus critical path and first-week plan).
- 2026-06-18 — Added `PROJECT_OVERVIEW.md` (short, manager-friendly executive summary: what we're building, problem, users, capabilities, delivery plan, scope, differentiation).
