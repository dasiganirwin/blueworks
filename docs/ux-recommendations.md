# BlueWork — UX Recommendations

**Audited by:** Design Agent
**Date:** 2026-02-25
**Scope:** All frontend pages across Customer, Worker, and Admin roles

---

## 1. Critical Issues (🔴 Fix Immediately)

### 1.1 Admin Disputes — `dispute_id` undefined on resolve

**File:** `frontend/src/app/(admin)/admin/disputes/page.jsx:51`

**Problem:**
The disputes list is sourced from `/jobs?status=disputed`. The job object may not include a `dispute_id` field unless the backend explicitly joins it. When an admin clicks "Resolve", the code calls `disputesApi.getById(selected.dispute_id)` with `undefined`, sending a request to `/disputes/undefined`. The resolve flow silently fails with no feedback to the admin.

**Recommendation:**
- Confirm the backend returns `dispute_id` in the disputed jobs list response.
- If not, either update the backend to join the dispute record, or switch to fetching from a dedicated `/disputes` endpoint.

---

### 1.2 Admin Disputes — Raw `fetch` bypasses axios auth interceptor

**File:** `frontend/src/app/(admin)/admin/disputes/page.jsx:32`

**Problem:**
```js
fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs?status=disputed`, {
  headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
})
```
This raw `fetch` call manually attaches the access token but bypasses the axios interceptor that handles 401 → token refresh → retry. If the admin's token expires mid-session, disputes silently fail to load instead of refreshing automatically.

**Recommendation:**
Replace with the axios wrapper:
```js
jobsApi.list({ status: 'disputed' })
```

---

## 2. Medium Issues (🟡 Fix in Next Polish Sprint)

### 2.1 Worker Earnings — "Currency" stats card is not useful

**File:** `frontend/src/app/(worker)/worker/earnings/page.jsx:71`

**Problem:**
The second summary card displays `PHP` in a large bold font. Workers already know their currency. This wastes a prime summary slot.

**Recommendation:**
Replace with a more actionable metric:
- **Jobs Completed** (count of completed transactions)
- **Pending Payout** (sum of completed jobs not yet paid out)

---

### 2.2 Inconsistent filter UI pattern across list pages

**Problem:**
Different pages use different UI controls for the same filtering pattern:

| Page | Control Used |
|---|---|
| My Jobs (Customer) | `<Select>` dropdown |
| Nearby Jobs (Worker) | Pill buttons |
| Admin Payments | Pill buttons |
| Admin Workers | `<Select>` dropdown |

**Recommendation:**
Standardize on **pill buttons** for status filters with ≤6 options. They are visually scannable, show all options at once, and avoid the hidden-option problem of dropdowns. Reserve `<Select>` for filters with many options (e.g., date range, long category lists).

---

### 2.3 Worker Dashboard — 3 parallel API calls for active jobs

**File:** `frontend/src/app/(worker)/worker/dashboard/page.jsx:22–25`

**Problem:**
```js
Promise.all([
  jobsApi.list({ status: 'accepted' }),
  jobsApi.list({ status: 'en_route' }),
  jobsApi.list({ status: 'in_progress' }),
  workersApi.getById(user.id),
])
```
Three separate requests are fired to assemble a single active jobs list. Each request costs a round-trip and adds latency.

**Recommendation:**
- Short-term: Keep as-is (acceptable for MVP).
- Sprint 5: Add backend support for multi-status filtering (e.g., `?status=accepted,en_route,in_progress`) to reduce to one call.

---

### 2.4 Notifications page uses a non-standard layout class

**File:** `frontend/src/app/(customer)/notifications/page.jsx:70`

**Problem:**
```jsx
<div className="max-w-2xl mx-auto px-4 py-8">
```
Every other page uses the `page-container` utility class. This page has a different max-width (`2xl` vs project standard) and different vertical padding (`py-8`), breaking layout rhythm on mobile and desktop.

**Recommendation:**
Replace with `page-container` or align with the project-wide container class.

---

### 2.5 Admin Dashboard — No error state on analytics failure

**File:** `frontend/src/app/(admin)/admin/dashboard/page.jsx:12`

**Problem:**
If `adminApi.getAnalytics()` throws, the `.catch` is absent — all metric values silently display `—`. An admin reviewing the dashboard has no way to know whether data genuinely shows zeros or failed to load.

**Recommendation:**
Add an error state with a retry button:
```jsx
} catch {
  setError(true);
} finally {
  setLoading(false);
}
```
Render a banner or inline message with a "Retry" link when `error` is true.

---

### 2.6 Admin Workers — Empty state missing icon and context

**File:** `frontend/src/app/(admin)/admin/workers/page.jsx:96`

**Problem:**
```jsx
<div className="text-center py-16 text-gray-400">No workers with this status.</div>
```
All other empty states in the app include an SVG icon and contextual copy. This is plain text only.

**Recommendation:**
Add a consistent empty state with an icon (e.g., a person/user outline SVG) and context-aware copy:
- Pending Approval: "No workers awaiting approval."
- Active: "No active workers yet."
- Suspended: "No suspended workers."

---

### 2.7 Worker Earnings — `paid_at` null causes "Invalid Date"

**File:** `frontend/src/app/(worker)/worker/earnings/page.jsx:142`

**Problem:**
```jsx
{tx.method} · {formatDate(tx.paid_at)}
```
For transactions with `status: 'disputed'` or `status: 'refunded'`, `paid_at` may be `null`. Passing `null` to `formatDate` likely renders "Invalid Date" in the transaction row.

**Recommendation:**
```jsx
{tx.method} · {formatDate(tx.paid_at ?? tx.created_at)}
```

---

### 2.8 JobCard — No price or budget displayed

**File:** `frontend/src/components/jobs/JobCard.jsx`

**Problem:**
Job cards (used across Nearby Jobs, My Jobs, and Worker Dashboard) show category, description, location, and date — but no job value or agreed rate. Workers browsing nearby jobs have no way to evaluate a job's worth before tapping in.

**Recommendation:**
- If BlueWork uses market-rate pricing (no customer-set budget), add a note to the PRD confirming this and display the platform's rate guideline.
- If a `budget` or `rate` field exists or is planned, surface it on the card.

---

## 3. Low Priority (🟢 Polish When Time Allows)

### 3.1 Truncated dispute description has no ellipsis

**File:** `frontend/src/app/(admin)/admin/disputes/page.jsx:82`

`d.description?.slice(0, 80)` cuts text without appending `…`. Replace with:
```js
d.description?.length > 80
  ? d.description.slice(0, 80) + '…'
  : d.description
```
Or use CSS `line-clamp-2` on the paragraph element.

---

### 3.2 "Aircon Tech" label is inconsistent across the app

| Location | Label Used |
|---|---|
| Customer Dashboard categories | `Aircon Tech` |
| Worker Profile skills | `Aircon Technician` |
| Nearby Jobs filter pill | raw slug `aircon-tech` (capitalized as `Aircon-tech`) |

Standardize to a single display label. Recommended: **Aircon Tech** (short, fits filter pills).

---

### 3.3 Worker Dashboard — Earnings card affordance is unclear

**File:** `frontend/src/app/(worker)/worker/dashboard/page.jsx:79`

```jsx
<p className="text-2xl font-bold text-brand-600 mt-1">View →</p>
```

"View →" styled as a large stat reads like data, not an interactive element. The card is clickable but there's no visual cue (hover state border change is subtle on mobile).

**Recommendation:**
Replace the large "View →" text with the actual total earnings value (fetched from the worker's earnings summary) and add a small "View all →" link at the bottom of the card.

---

### 3.4 Admin Workers — "Approve" shows for suspended workers

**File:** `frontend/src/app/(admin)/admin/workers/page.jsx:130`

```jsx
{w.status !== 'active' && (
  <Button size="sm" onClick={() => setModal({ worker: w, action: 'approve' })}>Approve</Button>
)}
```

A suspended worker can be re-approved to active via this button. Confirm with product whether **reinstatement** is an intentional feature. If not, change the condition to `w.status === 'pending_approval'`.

---

### 3.5 Greeting emoji inconsistency

- Customer dashboard: `Hi, {name} 👋` (has emoji)
- Worker dashboard: `Hi, {name}` (no emoji)

Standardize either way — both with or both without.

---

## 4. What's Working Well ✅

These are strong patterns already in place — maintain them:

- **Consistent loading skeletons** (`animate-pulse` blocks) on every list and detail page
- **Empty states with icons and CTAs** on most pages (Nearby Jobs, My Jobs, Notifications, Earnings)
- **Confirmation modals** before all destructive or irreversible actions (approve/suspend/cancel)
- **Toast notifications** for async action feedback (disputes, profile save, cash confirm)
- **WebSocket real-time updates** on job detail (status changes, location pings, chat)
- **Responsive mobile drawer** in Navbar with keyboard (Escape) and click-outside close
- **Badge component** with semantic color tokens covering all 12 job/worker statuses
- **Multi-step job creation** with clear step labels and field-level validation
- **Mapbox integration** — address autocomplete on job post, static map on job detail
- **Unread notification badge** in Navbar with 30s polling and auto-clear on visit
- **Category filter persistence** through page-level state (no URL needed for MVP)
- **ARIA labels** on icon-only buttons and SVG elements throughout

---

## 5. Recommended Fix Priority

| Priority | Issues | Sprint |
|---|---|---|
| Immediate | 1.1, 1.2 (disputes critical bugs) | Hotfix |
| Next sprint | 2.4 (notifications layout), 2.7 (Invalid Date), 2.1 (earnings card) | Sprint 5 |
| Polish pass | 2.2 (filter consistency), 2.5 (admin error state), 2.6 (empty state), 2.8 (job price) | Sprint 5 |
| Backlog | 3.1–3.5 | Sprint 6 |

---

*Generated by Design Agent — BlueWork UX Audit 2026-02-25*
