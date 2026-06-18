# Architecture & Diagrams

> Visual companion to `SOURCE_OF_TRUTH.md`. Diagrams use **Mermaid** so they stay as text
> (version-controlled, editable). View with any Markdown preview that supports Mermaid (Kiro/VS Code do).
> Last updated: 2026-06-18

## Table of Contents
1. [High-Level System Architecture](#1-high-level-system-architecture)
2. [Multi-Tenancy Model](#2-multi-tenancy-model)
3. [Backend Module / Service Map](#3-backend-module--service-map)
4. [Database ER Diagram (core)](#4-database-er-diagram-core)
5. [Order Lifecycle (sequence)](#5-order-lifecycle-sequence)
6. [Reservation Flow (sequence)](#6-reservation-flow-sequence)
7. [Authentication & RBAC Flow](#7-authentication--rbac-flow)
8. [Offline-First POS Sync](#8-offline-first-pos-sync)
9. [Deployment / Infrastructure](#9-deployment--infrastructure)
10. [Mobile Evolution Path](#10-mobile-evolution-path)
11. [Roadmap Timeline (Gantt)](#11-roadmap-timeline-gantt)
12. [Tenant Onboarding State Machine](#12-tenant-onboarding-state-machine)

---

## 1. High-Level System Architecture

```mermaid
flowchart TD
    subgraph Clients["Client Layer"]
        WEB["Web Dashboard<br/>(React + TS)"]
        PWA["PWA<br/>(installable web)"]
        WAITER["Waiter / Captain App<br/>(React Native)"]
        OWNER["Owner App<br/>(React Native)"]
        CUST["Customer Ordering App<br/>(React Native / web)"]
        KDS["Kitchen Display<br/>(KDS screen)"]
    end

    subgraph Edge["Edge"]
        GW["API Gateway / Load Balancer<br/>(routing, rate limit, TLS)"]
    end

    subgraph Backend["Backend API (all business logic)"]
        AUTH["Auth & RBAC"]
        TEN["Tenant Service"]
        ORD["Orders / POS"]
        MENU["Menu"]
        INV["Inventory & Kitchen"]
        RES["Reservations"]
        CRM["CRM & Loyalty"]
        BILL["Billing & Subscriptions"]
        RPT["Reporting & Analytics"]
        NOTIF["Notifications"]
    end

    subgraph Data["Data Layer"]
        PG[("PostgreSQL<br/>multi-tenant")]
        REDIS[("Redis<br/>cache / queues")]
        OBJ[("Object Storage<br/>images / receipts")]
    end

    subgraph External["External Integrations"]
        PAY["Payment Gateways<br/>Stripe / Razorpay"]
        AGG["Aggregators<br/>Zomato / Swiggy / UberEats"]
        MSG["WhatsApp / SMS / Email"]
        PUSH["FCM / APNs"]
        ACC["Accounting<br/>Tally / Zoho Books"]
    end

    WEB --> GW
    PWA --> GW
    WAITER --> GW
    OWNER --> GW
    CUST --> GW
    KDS --> GW

    GW --> AUTH & TEN & ORD & MENU & INV & RES & CRM & BILL & RPT & NOTIF

    AUTH --> PG
    TEN --> PG
    ORD --> PG
    MENU --> PG
    INV --> PG
    RES --> PG
    CRM --> PG
    BILL --> PG
    RPT --> PG
    ORD --> REDIS
    NOTIF --> REDIS
    MENU --> OBJ

    BILL --> PAY
    ORD --> AGG
    NOTIF --> MSG
    NOTIF --> PUSH
    RPT --> ACC
```

---

## 2. Multi-Tenancy Model

Two common strategies. Recommended start: **shared DB + tenant_id** (simplest to scale for many small tenants),
with the option to promote large/enterprise clients to a dedicated database later.

```mermaid
flowchart LR
    subgraph SharedDB["Strategy A: Shared DB + tenant_id (recommended start)"]
        direction TB
        T1["Tenant A requests"] --> Q1["Query WHERE tenant_id = A"]
        T2["Tenant B requests"] --> Q2["Query WHERE tenant_id = B"]
        Q1 --> DBS[("Single PostgreSQL<br/>every table has tenant_id")]
        Q2 --> DBS
    end

    subgraph PerTenant["Strategy B: DB-per-tenant (for large/enterprise)"]
        direction TB
        E1["Enterprise Tenant X"] --> DBX[("DB X")]
        E2["Enterprise Tenant Y"] --> DBY[("DB Y")]
    end
```

Key rules:
- Every tenant-scoped table carries `tenant_id`.
- Enforce isolation at the data-access layer (and ideally Postgres Row-Level Security) so no query can leak across tenants.
- A `super_admin` (platform owner) operates above tenants.

---

## 3. Backend Module / Service Map

Start as a **modular monolith** (one deployable, clean module boundaries), split into microservices only if scale demands.

```mermaid
flowchart TB
    subgraph Core["Platform Core"]
        A1["Auth & Identity"]
        A2["Tenant & Settings"]
        A3["Subscription & Billing"]
        A4["Audit Log"]
    end

    subgraph Ops["Operations"]
        B1["Menu"]
        B2["Orders / POS"]
        B3["Tables & Floor"]
        B4["Inventory"]
        B5["Central Kitchen"]
        B6["KDS"]
    end

    subgraph Guest["Guest & Growth"]
        C1["Reservations"]
        C2["CRM"]
        C3["Loyalty"]
        C4["Feedback"]
        C5["Marketing"]
    end

    subgraph Insight["Insight & Integration"]
        D1["Reporting & Analytics"]
        D2["Notifications"]
        D3["Aggregator Sync"]
        D4["Payments"]
        D5["Accounting Sync"]
    end

    B2 --> B1
    B2 --> B3
    B2 --> B4
    B4 --> B5
    B2 --> B6
    B2 --> C2
    C1 --> B3
    C2 --> C3
    B2 --> D1
    B2 --> D4
    B2 --> D3
    C5 --> D2
```

---

## 4. Database ER Diagram (core)

Simplified core entities. Every tenant-scoped table includes `tenant_id` (shown on key tables).

```mermaid
erDiagram
    TENANT ||--o{ OUTLET : has
    TENANT ||--o{ USER : has
    TENANT ||--o{ SUBSCRIPTION : has
    OUTLET ||--o{ TABLE : has
    OUTLET ||--o{ MENU_ITEM : offers
    OUTLET ||--o{ ORDER : records
    USER ||--o{ ORDER : creates
    MENU_CATEGORY ||--o{ MENU_ITEM : groups
    MENU_ITEM ||--o{ MENU_ITEM_MODIFIER : has
    MENU_ITEM ||--o{ RECIPE_INGREDIENT : uses
    INGREDIENT ||--o{ RECIPE_INGREDIENT : in
    INGREDIENT ||--o{ STOCK_MOVEMENT : tracked_by
    ORDER ||--o{ ORDER_ITEM : contains
    MENU_ITEM ||--o{ ORDER_ITEM : referenced_by
    ORDER ||--o{ PAYMENT : settled_by
    TABLE ||--o{ ORDER : seats
    CUSTOMER ||--o{ ORDER : places
    CUSTOMER ||--o{ RESERVATION : books
    TABLE ||--o{ RESERVATION : reserved_for
    CUSTOMER ||--o{ LOYALTY_ACCOUNT : owns
    SUPPLIER ||--o{ PURCHASE_ORDER : fulfills
    PURCHASE_ORDER ||--o{ STOCK_MOVEMENT : generates

    TENANT {
        uuid id PK
        string name
        string subdomain
        string plan
        string status
    }
    OUTLET {
        uuid id PK
        uuid tenant_id FK
        string name
        string timezone
        string currency
    }
    USER {
        uuid id PK
        uuid tenant_id FK
        string email
        string role
        uuid outlet_id FK
    }
    MENU_ITEM {
        uuid id PK
        uuid tenant_id FK
        uuid category_id FK
        string name
        decimal price
        bool available
    }
    ORDER {
        uuid id PK
        uuid tenant_id FK
        uuid outlet_id FK
        uuid table_id FK
        uuid customer_id FK
        string type
        string status
        decimal total
        timestamp created_at
    }
    ORDER_ITEM {
        uuid id PK
        uuid order_id FK
        uuid menu_item_id FK
        int qty
        decimal price
    }
    PAYMENT {
        uuid id PK
        uuid order_id FK
        string method
        decimal amount
        string status
    }
    RESERVATION {
        uuid id PK
        uuid tenant_id FK
        uuid table_id FK
        uuid customer_id FK
        timestamp booked_for
        int party_size
        string status
    }
    INGREDIENT {
        uuid id PK
        uuid tenant_id FK
        string name
        decimal stock_qty
        decimal reorder_level
    }
```

---

## 5. Order Lifecycle (sequence)

```mermaid
sequenceDiagram
    actor Waiter
    participant POS as POS / App
    participant API as Backend API
    participant KDS as Kitchen Display
    participant INV as Inventory
    participant PAY as Payment Gateway

    Waiter->>POS: Take order at table
    POS->>API: POST /api/v1/orders
    API->>INV: Check stock / deduct (recipe-level)
    API->>KDS: Push KOT (new order)
    KDS-->>API: Mark "preparing" -> "ready"
    API-->>POS: Status updates (realtime)
    Waiter->>POS: Serve + request bill
    POS->>API: POST /api/v1/orders/{id}/checkout
    API->>PAY: Charge (card / UPI / wallet)
    PAY-->>API: Payment success
    API-->>POS: Receipt (print + digital)
    API->>INV: Finalize stock movement
```

---

## 6. Reservation Flow (sequence)

```mermaid
sequenceDiagram
    actor Guest
    participant Web as Booking Page / Google
    participant API as Backend API
    participant FLOOR as Table/Floor Service
    participant NOTIF as Notifications
    actor Host

    Guest->>Web: Choose date, time, party size
    Web->>API: POST /api/v1/reservations
    API->>FLOOR: Check table availability
    FLOOR-->>API: Slot available
    API->>NOTIF: Confirmation (SMS/WhatsApp/email)
    NOTIF-->>Guest: Booking confirmed
    API-->>Host: New reservation on floor plan
    Note over API,NOTIF: Reminder sent before booking time
    Guest->>Host: Arrives
    Host->>API: Mark seated -> links to order
```

---

## 7. Authentication & RBAC Flow

```mermaid
flowchart TD
    L["User login (email + password)"] --> V{"Valid credentials?"}
    V -- No --> ERR["401 Unauthorized"]
    V -- Yes --> JWT["Issue JWT<br/>(tenant_id, user_id, role)"]
    JWT --> REQ["Client sends JWT on each request"]
    REQ --> MW["Auth Middleware<br/>verify token + extract tenant_id"]
    MW --> RBAC{"Role allowed<br/>for this action?"}
    RBAC -- No --> F["403 Forbidden"]
    RBAC -- Yes --> SCOPE["Scope all queries to tenant_id"]
    SCOPE --> OK["Process request"]
```

Roles (per tenant): `super_admin` (platform), `owner`, `manager`, `cashier`, `waiter`, `kitchen`, `accountant`.

```mermaid
flowchart LR
    subgraph Permissions
        owner["owner: all within tenant"]
        manager["manager: ops + reports, no billing plan"]
        cashier["cashier: billing, orders"]
        waiter["waiter: take/edit orders, tables"]
        kitchen["kitchen: KDS, order status only"]
        accountant["accountant: reports, payments (read)"]
    end
```

---

## 8. Offline-First POS Sync

POS must keep working when internet drops, then reconcile.

```mermaid
flowchart TD
    A["POS action (new order / payment)"] --> B{"Online?"}
    B -- Yes --> C["Send to API immediately"]
    B -- No --> D["Write to local DB<br/>+ enqueue in sync queue"]
    D --> E["Keep operating locally"]
    F["Connectivity restored"] --> G["Flush queue to API<br/>(ordered, idempotent)"]
    G --> H{"Conflict?"}
    H -- No --> I["Server confirms, clear queue"]
    H -- Yes --> J["Resolve (server rules /<br/>last-write + audit)"]
    J --> I
```

Design notes: use idempotency keys per action, server-authoritative IDs, and an audit trail for conflict resolution.

---

## 9. Deployment / Infrastructure

```mermaid
flowchart TB
    subgraph Internet
        U["Users / Devices"]
    end
    U --> CDN["CDN<br/>(static web, images)"]
    U --> LB["Load Balancer + WAF / TLS"]

    subgraph Cloud["Cloud (containers)"]
        API1["API instance 1"]
        API2["API instance 2"]
        WORK["Background Workers<br/>(queue, reports, notifications)"]
    end

    LB --> API1
    LB --> API2
    API1 --> DB[("PostgreSQL<br/>primary + read replica")]
    API2 --> DB
    API1 --> RDS[("Redis")]
    WORK --> RDS
    WORK --> DB
    API1 --> S3[("Object Storage")]

    subgraph Observability
        LOG["Logs"]
        MET["Metrics"]
        TRC["Tracing / Alerts"]
    end
    API1 --> LOG
    API1 --> MET
    API1 --> TRC

    subgraph CICD["CI/CD"]
        GIT["Git repo"] --> PIPE["Build + Test + Deploy"]
        PIPE --> API1
    end
```

---

## 10. Mobile Evolution Path

```mermaid
flowchart LR
    V1["v1: Backend API + Web Dashboard"] --> V15["v1.5: PWA<br/>(installable, basic mobile)"]
    V15 --> V2["v2: React Native Waiter App<br/>Google Play + iOS"]
    V2 --> V25["v2.5: Owner App + Customer App<br/>(reuse same API)"]
    classDef done fill:#cde,stroke:#369;
    class V1 done;
```

Because all logic lives in the API, each mobile app is an additive UI project, not a rewrite.

---

## 11. Roadmap Timeline (Gantt)

> Indicative durations — adjust to your team size.

```mermaid
gantt
    title Development Roadmap (indicative)
    dateFormat  YYYY-MM-DD
    axisFormat  %b %Y

    section Foundation
    Multi-tenancy + Auth + Billing       :f1, 2026-07-01, 45d
    Tenant onboarding + RBAC             :f2, after f1, 20d

    section Phase 1 - Core POS (MVP)
    Menu + Orders + Billing              :p1, after f2, 40d
    Tables + KOT + Offline mode          :p2, after p1, 30d

    section Phase 2 - Inventory
    Stock + Recipes + Suppliers          :p3, after p2, 35d
    Central Kitchen + KDS                :p4, after p3, 25d

    section Phase 3 - Guest
    Reservations + CRM + Loyalty         :p5, after p4, 40d

    section Phase 4 - Online
    Online ordering + Aggregators + Pay  :p6, after p5, 45d

    section Mobile
    PWA                                  :m1, after p2, 20d
    React Native waiter app              :m2, after p5, 50d
```

---

## 12. Tenant Onboarding State Machine

```mermaid
stateDiagram-v2
    [*] --> SignedUp
    SignedUp --> Trial: start free trial
    Trial --> Configuring: add outlet, menu, staff
    Configuring --> Active: go live (first order)
    Trial --> Expired: trial ends, no plan
    Active --> Subscribed: paid plan
    Subscribed --> Active
    Expired --> Subscribed: purchase plan
    Active --> Suspended: payment failed
    Suspended --> Active: payment resolved
    Suspended --> Churned: prolonged non-payment
    Churned --> [*]
```

---

## How to edit these diagrams
- Each diagram is a Mermaid code block. Edit the text and the preview updates.
- Mermaid docs: https://mermaid.js.org/
- Keep this file in sync with `SOURCE_OF_TRUTH.md` when decisions change.
