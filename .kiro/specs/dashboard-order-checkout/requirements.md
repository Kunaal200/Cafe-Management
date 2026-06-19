# Requirements — Dashboard Order Taking & Checkout

## Introduction

This feature closes the core point-of-sale loop inside the owner/manager dashboard:
**take an order → add menu items → send it to the kitchen → advance it through
preparation → collect payment → finalize and free the table.** Today the dashboard
can only view orders and advance their status; it cannot create orders or take
payments, so an outlet cannot actually be run from it.

All backend endpoints required for this loop already exist and are tenant-scoped
behind JWT + role guards, so this feature is **frontend-only**:

- `POST /orders`, `POST /orders/:id/items`, `PATCH /orders/:id/items/:itemId`,
  `DELETE /orders/:id/items/:itemId`
- `POST /orders/:id/send-kitchen`, `PATCH /orders/:id/status`
- `POST /orders/:id/discount`, `POST /orders/:id/payments`,
  `GET /orders/:id/payments`, `POST /orders/:id/checkout`
- `GET /menu/categories`, `GET /menu/items`, `GET /tables?outletId`

Order/item actions are available to front-of-house roles (`owner`, `manager`,
`cashier`, `waiter`). Money actions (discount, payments, checkout) remain restricted
to `owner`, `manager`, `cashier` — **the existing backend guards are not changed.**

Out of scope: receipt printing, real-time websockets, customer records, register/
shift reconciliation, reports, and full staff management. These are tracked separately.

## Glossary

- **Open order**: an order in `open` status whose items can still be edited.
- **Live order**: any non-terminal order (`open`, `sent_to_kitchen`, `preparing`, `ready`, `served`).
- **Terminal order**: `completed` or `cancelled`.
- **Balance**: order `total` minus the sum of `paid` payments.
- **Selected outlet**: the outlet currently chosen in the dashboard outlet switcher.
- **Money role**: `owner`, `manager`, or `cashier`.

---

## Requirements

### Requirement 1 — Create a new order

**User Story:** As a cashier or waiter, I want to start a new order for a table or
service type, so that I can begin taking a customer's order from the dashboard.

#### Acceptance Criteria

1. WHEN the user is on the Orders page THEN the system SHALL display a "New order" action available to roles `owner`, `manager`, `cashier`, `waiter`.
2. WHEN the user starts a new order THEN the system SHALL require an order type of `dine_in`, `takeaway`, or `delivery`, defaulting to `dine_in`.
3. WHEN the order type is `dine_in` THEN the system SHALL allow selecting a table from the selected outlet's tables.
4. WHEN the order type is `takeaway` or `delivery` THEN the system SHALL NOT require a table.
5. WHEN the user confirms order creation THEN the system SHALL call `POST /orders` with the selected outlet id and chosen type/table, and navigate to that order's workspace.
6. IF no outlet is selected THEN the system SHALL disable order creation and explain that an outlet must be selected first.
7. IF order creation fails THEN the system SHALL surface the backend error message and remain on the creation step without losing entered data.

### Requirement 2 — Browse the menu and add items to an open order

**User Story:** As a cashier or waiter, I want to browse the menu by category and add
items to the order, so that I can build the customer's bill.

#### Acceptance Criteria

1. WHEN editing an open order THEN the system SHALL display menu items grouped or filterable by category, fetched from `GET /menu/categories` and `GET /menu/items`.
2. WHEN the menu is displayed THEN the system SHALL visually indicate items that are unavailable (`isAvailable = false`) and SHALL prevent adding them.
3. WHEN the user adds an available item THEN the system SHALL call `POST /orders/:id/items` with the menu item id and a quantity of at least 1.
4. WHEN an item is added or changed THEN the system SHALL display the order's recomputed subtotal, tax, and total returned by the backend.
5. WHEN the menu has no items or no categories THEN the system SHALL show an empty state directing the user to add menu items.
6. IF adding an item fails THEN the system SHALL surface the error and leave the current order state unchanged in the UI.

### Requirement 3 — Edit and remove items on an open order

**User Story:** As a cashier or waiter, I want to change quantities, add notes, or remove
items on an open order, so that the bill matches what the customer actually wants.

#### Acceptance Criteria

1. WHEN viewing an open order's items THEN the system SHALL allow increasing or decreasing each line item's quantity.
2. WHEN the user changes a line item quantity THEN the system SHALL call `PATCH /orders/:id/items/:itemId` and reflect the recomputed totals.
3. WHEN the user adds or edits a line item note THEN the system SHALL persist it via `PATCH /orders/:id/items/:itemId`.
4. WHEN the user removes a line item THEN the system SHALL call `DELETE /orders/:id/items/:itemId` and update the displayed totals.
5. IF the order is not in `open` status THEN the system SHALL disable item editing and removal and explain that the order can no longer be modified.
6. WHEN a destructive action (remove item) is triggered THEN the system SHALL ask for confirmation before calling the backend.

### Requirement 4 — Send to kitchen and advance order status

**User Story:** As front-of-house staff, I want to send an order to the kitchen and move it
through its lifecycle, so that the kitchen and service stay coordinated.

#### Acceptance Criteria

1. WHEN an order is `open` and has at least one item THEN the system SHALL offer a "Send to kitchen" action that calls `POST /orders/:id/send-kitchen`.
2. WHEN an order is `open` and has no items THEN the system SHALL disable "Send to kitchen".
3. WHEN an order is in a status that permits advancement THEN the system SHALL offer only the valid next transition(s) per the backend lifecycle (`sent_to_kitchen → preparing → ready → served → completed`).
4. WHEN the user advances status THEN the system SHALL call `PATCH /orders/:id/status` with the target status and reflect the new status.
5. WHEN an order can be cancelled (`open`, `sent_to_kitchen`, `preparing`) THEN the system SHALL offer a "Cancel order" action that requires confirmation.
6. IF a status transition is rejected by the backend THEN the system SHALL surface the error and keep the displayed status unchanged.

### Requirement 5 — Apply a discount

**User Story:** As a money-role user, I want to apply a discount to an order, so that I can
honor promotions or price adjustments before payment.

#### Acceptance Criteria

1. WHEN a non-terminal order is open for checkout THEN the system SHALL allow applying a discount as either a flat `amount` or a `percent`.
2. WHEN the user applies a discount THEN the system SHALL call `POST /orders/:id/discount` with the type and a non-negative value, and display the updated total.
3. WHEN a percentage discount is entered THEN the system SHALL constrain the value to a sensible range (0–100).
4. WHEN a discount has been applied THEN the system SHALL clearly show the discount amount as a separate line in the bill summary.
5. WHEN the user is not a money role THEN the system SHALL hide or disable discount controls.

### Requirement 6 — Take payments (including split bill)

**User Story:** As a cashier, I want to record one or more payments by method, so that I can
collect the full bill, including split payments across methods.

#### Acceptance Criteria

1. WHEN collecting payment THEN the system SHALL display the order total, amount paid so far, and the outstanding balance from `GET /orders/:id/payments`.
2. WHEN the user records a payment THEN the system SHALL call `POST /orders/:id/payments` with a payment method (`cash`, `card`, `upi`, `wallet`, `online`), a positive amount, and an optional reference.
3. WHEN a payment is recorded THEN the system SHALL refresh and display the new paid total and remaining balance.
4. WHEN the balance remains greater than zero THEN the system SHALL allow recording additional payments (split bill).
5. WHEN paying by cash THEN the system SHALL allow entering a tendered amount and SHALL display change due, without sending change as a payment.
6. IF a payment amount is not greater than zero THEN the system SHALL prevent submission and show a validation message.
7. WHEN the user is not a money role THEN the system SHALL hide or disable payment controls.

### Requirement 7 — Finalize checkout

**User Story:** As a cashier, I want to finalize a fully paid order, so that the bill is closed
and the table is freed for the next customer.

#### Acceptance Criteria

1. WHEN an order's balance is zero or less THEN the system SHALL enable a "Finalize"/"Complete order" action.
2. WHEN an order has an outstanding balance THEN the system SHALL disable finalize and indicate the remaining amount.
3. WHEN the user finalizes THEN the system SHALL call `POST /orders/:id/checkout` and, on success, show the order as `completed`.
4. WHEN a `dine_in` order is finalized THEN the system SHALL reflect that the associated table is now `free`.
5. WHEN finalize succeeds THEN the system SHALL present a clear completion confirmation and a path back to the Orders list or to start a new order.
6. IF finalize is rejected (e.g. not fully paid, already completed, cancelled) THEN the system SHALL surface the backend error and not change the displayed status.

### Requirement 8 — Consistent feedback and confirmations

**User Story:** As any dashboard user, I want clear success and error feedback and protection
against accidental destructive actions, so that I can trust what the system did.

#### Acceptance Criteria

1. WHEN any create, update, payment, or checkout action succeeds THEN the system SHALL show a transient success notification (toast).
2. WHEN any such action fails THEN the system SHALL show an error notification carrying the backend message.
3. WHEN a destructive action (remove item, cancel order) is triggered THEN the system SHALL require explicit confirmation via a dialog rather than a browser `confirm()`.
4. WHEN an action is in progress THEN the system SHALL disable the triggering control and indicate progress to prevent duplicate submissions.

### Requirement 9 — Outlet scoping and access control

**User Story:** As an owner operating multiple outlets, I want order taking to be scoped to the
selected outlet and limited to appropriate roles, so that data stays correct and secure.

#### Acceptance Criteria

1. WHEN creating an order THEN the system SHALL associate it with the currently selected outlet.
2. WHEN listing tables for order creation THEN the system SHALL only show tables belonging to the selected outlet.
3. WHEN the selected outlet changes THEN the system SHALL reflect the new outlet's tables and menu context for subsequent order creation.
4. WHEN a user's role does not permit an action THEN the system SHALL hide or disable that action client-side, and SHALL still rely on the backend role guard as the source of truth.
5. IF the backend returns 401 THEN the system SHALL clear the session and redirect to login, consistent with the rest of the dashboard.
