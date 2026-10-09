# Qubators — Design Blueprint (MVP)

> Derived from: `Qubators Order and Customer Tracker.md` (PRD)
> Purpose: Make the PRD directly designable in Figma / code. No vision changes, only structure.
> Platform: Mobile-first web (PWA). Design at 360px width first.
> Core promise: **Never lose an order again.**
> Core flow: **Record → Track → Get Paid → Deliver → Follow Up**

---

## 1. App Structure (IA)

Bottom nav, 4 items only. Payments, Delivery, Follow-ups are NOT tabs — they are attributes/filters.

```
[Home] - [Orders] - [Customers] - [+ Add]
```

- **Home:** Answers "What needs my attention today?"
- **Orders:** Search + filter + list + detail
- **Customers:** Search + list + detail
- **+ Add:** Global primary action. Opens Add Order sheet. Always visible.

Why this works for WhatsApp sellers:
- 1-tap order capture while chatting
- No learning curve
- Everything else is 2 taps away

---

## 2. MVP Screen Inventory (9 screens only)

1. Home / Dashboard
2. Orders List
3. Order Detail
4. Add Order
5. Customers List
6. Customer Detail
7. Add Customer (lightweight, mostly auto-created)
8. Follow-ups List
9. Onboarding / First-run (first order)

Out of MVP: Accounting, Inventory, Payroll, Analytics, Ecommerce builder, Marketing automation, Chat integrations.

---

## 3. User Flows

### 3.1 New seller → first order
1. Sign up → lands on Home (empty)
2. Empty state CTA: "Record your first order"
3. Tap + Add → fill 3 required fields → Save
4. Sees order on Home + in Orders List
5. Customer auto-created → appears in Customers List

Success: First order recorded in < 60 seconds.

### 3.2 Daily seller — morning check
1. Opens Home → sees: 5 new, 2 unpaid, 3 processing, 4 follow-ups due
2. Taps Follow-ups Due → calls/WhatsApps customer
3. Marks follow-up done → payment updated to Paid
4. Receives new WhatsApp order → taps + Add → saves in <30s

### 3.3 Follow-up loop
Interest → Record → No confirmation → Reminder → Follow up → Confirm → Processing → Paid → Delivered → Saved in history

---

## 4. Screen-by-Screen Specs

### S1. Home / Dashboard
**Goal:** Show action, not data.

Top to bottom:
- Header: "Good morning, {Name}" + date
- 4 action cards (tap → filtered Orders List):
  - Pending Payments: ₦125,000 (3 orders)
  - New Orders: 8
  - Processing: 4
  - Follow-ups Due: 6
- "Needs attention" list (max 5, sorted by urgency: overdue follow-ups first, then unpaid, then new)
- Recent Orders (last 5)

Empty state:
> "No orders yet. Tap + to record your first order. It takes 30 seconds."

### S2. Orders List
- Search bar: placeholder "Search name, phone, product"
- Filter chips (single-select): All | New | Confirmed | Processing | Delivered | Cancelled | Unpaid | Follow-up due
- Sort: Newest first
- Order card contents:
  - Customer name (bold) + date
  - Product x Qty
  - ₦ Total + payment dot: red=Pending, yellow=Partial, green=Paid, grey=Refunded
  - Order status pill: New / Confirmed / Processing / Delivered / Cancelled
- Tap card → Order Detail

Empty filtered state: "No orders here. Try another filter."

### S3. Order Detail
Organized as Who / What / How much / Where / What's next:

- **Who:** Customer name, phone, [WhatsApp] [Call] buttons
- **What:** Product, qty, variation
- **How much:** Total ₦, Amount paid, Balance, Payment status selector [Pending | Partial | Paid | Refunded]
- **Where:** Delivery address/method (free text) + delivery note
- **When:** Order date + Follow-up date + note
- **What's next:** Order status stepper: New > Confirmed > Processing > Delivered + [Cancel order] text button
- Footer actions: [Update Payment] [Change Status] [Add Follow-up]
- Edit: All fields editable inline

Rules:
- Payment status independent from order status. Always show both.
- Example: Processing + Pending = "working on it but money outstanding"

### S4. Add Order
**Goal:** <30 seconds. Single screen, not wizard.

Required (3 only):
- Customer name (text, autocomplete from existing)
- Product / Item (text, autocomplete later from catalog)
- Total amount ₦ (numeric)

Defaults (no input needed):
- Payment = Pending
- Order status = New
- Order date = Today

Collapsed "More details (optional)":
- Phone / WhatsApp
- Qty (default 1), Variation (e.g. S/M/L)
- Delivery address/method
- Follow-up date + reason
- Notes

Behavior:
- If phone matches existing customer → link order
- If new name/phone → auto-create customer
- On Save → toast "Order saved" → go to Order Detail
- Allow Save with only 3 required fields

### S5. Customers List
- Search: name, phone
- Customer card: Name, phone, X orders • ₦ total spent • Last order date • Follow-up badge if due
- Sort: Recent activity first
- Tap → Customer Detail

### S6. Customer Detail
- Header: Name, phone, [WhatsApp] [Call], Notes (editable)
- Stats row: X orders | X completed | ₦ total | Last order: Sept 2026
- Example: Sarah — 5 orders, 4 completed, 1 current, ₦85,000 total, follow-up tomorrow
- Tabs:
  - Current Orders
  - Past Orders
  - Follow-ups
- CTA: [+ New order for Sarah]

### S7. Add Customer
- Minimal: Name (required), Phone (optional but recommended), Notes
- Note: In MVP, 90% of customers will be auto-created from Add Order. This screen is fallback + edit.

### S8. Follow-ups List
- Grouped: Overdue | Today | Tomorrow | Later
- Row: Customer name, Reason (e.g. "Payment pending", "No confirmation"), Due date, Related order link
- Swipe / button: [Mark done] [WhatsApp]
- Create follow-up from: Order Detail or Customer Detail (date + reason + note)

Common reasons (preset chips):
- Not confirmed
- Payment pending
- Asked for info
- Will order later
- Awaiting delivery
- Reconnect / repeat purchase

### S9. Onboarding / First-run
- 3 slides max:
  1. "Never lose an order again."
  2. "Your WhatsApp orders, organized."
  3. "Record your first order →"
- Skip button always
- Ends on empty Home with highlighted + button

---

## 5. Data Model (for designer → dev handoff)

### Order
- id
- customer_id (link)
- items: [{ product_name, qty, variation }]
- total_amount (₦)
- amount_paid (₦) → balance = total - paid
- payment_status: Pending | Partially Paid | Paid | Refunded
- order_status: New | Confirmed | Processing | Delivered | Cancelled
- delivery_info: address/method (text)
- order_date (default today)
- follow_up_date + follow_up_reason + follow_up_note
- notes
- source: WhatsApp | Instagram | Other (optional tag)

### Customer
- id
- name
- phone / WhatsApp
- orders[] (derived)
- total_spent (sum of totals)
- total_orders, completed_orders, current_orders
- last_order_date
- notes
- follow-ups[]

### Follow-up
- id
- customer_id, order_id (optional link)
- due_date
- reason (preset + custom)
- status: Open | Done
- created_date

---

## 6. Statuses & Rules

**Order status journey (linear, simple):**
New → Confirmed → Processing → Delivered
↘ Cancelled (from any stage)

**Payment (independent):**
Pending (red) → Partially Paid (yellow) → Paid (green) → Refunded (grey)

Display rule: Always show both pills together on cards. Never hide payment behind order status.

---

## 7. Components Needed (Figma)

Only build these for MVP:

1. BottomNav (4 items)
2. ActionCard (number + label)
3. OrderCard
4. CustomerCard
5. FollowUpRow
6. StatusPill-Order (5 variants)
7. StatusPill-Payment (4 variants)
8. FilterChip
9. SearchBar
10. PrimaryButton (+ Add Order, Save)
11. SecondaryButton (WhatsApp green)
12. TextInput, AmountInput (₦), DatePicker, Selector (status)
13. EmptyState (illustration + text + CTA)
14. Toast ("Order saved", "Follow-up done")

Colors: Keep neutral + status colors. WhatsApp green #25D366 for WhatsApp actions only.

Typography: 1 font family, 3 sizes (Title / Body / Caption). Must be legible on small Android screens.

---

## 8. Content & Language

Use seller language, not enterprise CRM:

- Say "Who has not paid?" not "Outstanding receivables"
- Say "Who needs follow-up?" not "Pending engagements"
- Currency: ₦ with thousands separator (e.g. ₦45,000)
- Dates: "Today", "Tomorrow", "Yesterday", not just 02/10/2026

Example order summary (use in UI):
> Ada — 2 handbags — ₦45,000 — Partially Paid — Processing — Follow-up tomorrow — Delivery: Ikeja

---

## 9. What to Design First (priority order)

1. Add Order + Order Detail (core loop — if this is slow, product fails)
2. Orders List + Home (attention view)
3. Follow-ups List (retention driver)
4. Customers List + Detail (history value)
5. Onboarding empty states

Prototype test: Can a seller record Ada's 2 handbags order in <30s while chatting on WhatsApp? If yes, MVP works.

---

## 10. Open Questions for Next Iteration

- Do we need product catalog in MVP or post-MVP? PRD says secondary — keep as autocomplete only for now.
- Delivery status separate or part of order status? Recommendation: keep part of order status for MVP.
- Notifications: in-app only for MVP, push/SMS later?
- Team access / multi-user: post-MVP.

---

*End of Design Blueprint — ready for wireframes.*
