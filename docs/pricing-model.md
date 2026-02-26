# BlueWork Pricing Model

**Document Type:** Design Decision
**Author:** Design Agent + Marketplace Expert
**Date:** 2026-02-26
**Status:** Recommended — Pending Implementation

---

## 1. Decision Summary

BlueWork uses a **customer-set budget with worker accept/counter-offer** model.

Customers declare what they are willing to pay when posting a job. Workers either accept the budget or propose a counter-offer. Both parties must confirm the agreed price before the job begins.

---

## 2. Pricing Flow

```
Customer posts job
  └─ Sets budget range (min–max, e.g., ₱300–₱500)
         ↓
Worker sees job + budget
  ├─ Accept → agreed_price = customer budget_max
  └─ Counter-offer → proposes a different price
         ↓
Customer reviews counter (if any)
  ├─ Confirm → job starts
  └─ Decline → job returns to available pool
         ↓
Job starts with agreed_price locked
         ↓
Payment processed at agreed_price on completion
```

---

## 3. Why This Model for the Philippines

### 3.1 Market Fit

| Factor | Context |
|---|---|
| Distrust of surprise billing | Overcharging by informal service workers is a top consumer complaint in the Philippines. Upfront budget commitment builds trust. |
| Negotiation culture | "Tawad" (bargaining) is expected. The counter-offer step respects this cultural norm without adding friction. |
| Price sensitivity | Households need cost certainty before committing, especially for lower-income customers. |
| Familiar UX pattern | Filipino users are already conditioned by Grab and Angkas to see and confirm price before a service begins. |
| Regional wage disparity | Rates differ significantly between Metro Manila, Cebu, Davao, and provincial areas. A customer-driven budget allows natural market calibration without platform-side rate tables. |

### 3.2 Models Evaluated and Rejected

| Model | Reason Rejected |
|---|---|
| Negotiate on contact | High drop-off, ghosting, and disputes. Common failure pattern on Facebook Marketplace and OLX PH. |
| Platform-fixed rates | Too rigid for regional wage differences. Workers in lower-cost areas reject jobs priced for NCR. |
| Auction / bidding | Complex UX, slow match time. Blue-collar workers in the MVP target segment are not accustomed to bidding interfaces. |
| Worker-only rate card | Customers feel no price control, reducing first-time conversion. |

---

## 4. UX Guidelines

### 4.1 Job Posting (Customer)

- Budget field is **required**, not optional.
- Display it as a range: **Min ₱ — Max ₱**
- Show a **"typical range" hint** per service category to help customers set realistic expectations.
  - Example: *"Most plumbers in your area charge ₱250–₱600 for this type of job."*
  - This is a soft anchor — no hard enforcement in MVP.
- Label: **"Your Budget"** (not "Price" or "Offer") — framing matters for perception.

### 4.2 Worker Job View

- Display the customer's budget range clearly at the top of the job card.
- Two primary actions:
  - **Accept** — agrees to work within the customer's budget max.
  - **Counter-offer** — opens a numeric input for the worker's proposed price.
- Counter-offer input should show the customer's range as reference.

### 4.3 Customer Notification (Counter-offer)

- Push notification: *"[Worker name] sent a counter-offer of ₱[amount] for your [service] job."*
- Customer can **Confirm** or **Decline**.
- If declined, job returns to the available pool for other workers.

### 4.4 Price Lock

- Once both parties confirm, `agreed_price` is locked.
- Neither party can change the price after this point.
- Displayed on job detail screen for both parties throughout the job.

---

## 5. Database Changes Required

The following columns need to be added to the `jobs` table:

```sql
ALTER TABLE jobs ADD COLUMN budget_min   INT;          -- customer's minimum budget (PHP)
ALTER TABLE jobs ADD COLUMN budget_max   INT;          -- customer's maximum budget (PHP)
ALTER TABLE jobs ADD COLUMN agreed_price INT;          -- locked price after both confirm (PHP)
ALTER TABLE jobs ADD COLUMN worker_counter INT;        -- worker's counter-offer, null if accepted as-is
```

**Notes:**
- All amounts stored in Philippine Peso (₱), integer (no decimals for MVP).
- `agreed_price` is NULL until both parties confirm.
- `worker_counter` is NULL if worker accepted without counter-offer.
- Stripe charge amount = `agreed_price` in centavos (`agreed_price * 100`).

---

## 6. Risks and Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Customers set unrealistically low budgets | High | Show typical range hint per category at time of posting |
| Workers systematically counter-offer to inflate price | Medium | Track counter-offer rate per worker; flag outliers in admin dashboard |
| Liquidity risk: workers skip low-budget jobs | Medium | Surface demand data to admin; allow platform to set category floor prices post-MVP |
| Price disputes after job completion | Low | `agreed_price` is locked before job start; used as source of truth for disputes |
| Currency confusion (centavos vs peso in UI) | Low | Always display in ₱ (peso) in UI; only convert to centavos at Stripe call |

---

## 7. Out of Scope for MVP

- Dynamic pricing / surge pricing
- Platform-enforced rate floors per category
- Price history or market rate analytics
- Recurring job pricing or contracts
- Discount codes or promotional pricing

These may be considered in a future sprint once liquidity and transaction data are available.

---

## 8. Related Documents

- `/docs/prd.md` — Section 4 (MVP Scope), Section 3.1 (Customer App)
- `/docs/architecture.md` — Section 4 (Database Schema)
- `/docs/schema.sql` — Jobs table definition
- `/docs/TODO.md` — Track implementation task

---

*This document represents the agreed design direction as of 2026-02-26. Any changes to the pricing model must be reviewed against liquidity risk and payment flow before implementation.*
