# Task Dispatch — Jei (Frontend Developer)
**From:** Orchestrator Agent
**Date:** 2026-02-25
**Sprint:** Sprint 1 – UX Polish & Bug Fixes

---

## Your Tasks (19 items)

Work in this order. HIGH priority first, then MEDIUM, then LOW.

---

### 🔴 HIGH PRIORITY

#### S1-04 · Fix Accessibility Failures ← Start Here
**File(s):** Multiple
**Why first:** Foundational — fixes affect shared components (Modal, Badge) used everywhere.

| Sub-item | File | Fix |
|----------|------|-----|
| OTP input missing `<label>` | `verify-otp/page.jsx:69–76` | Add `<label htmlFor="otp-input">` and `id="otp-input"` on the input |
| Error divs missing `aria-describedby` | `jobs/new/page.jsx:113–115` | Add `aria-describedby="field-error"` on inputs; `id="field-error"` on error div |
| Category items missing `aria-label` | `customer/dashboard/page.jsx:39–40` | Add `aria-label="Category name"` to each category link |
| Modal no ESC key handler | `components/ui/Modal.jsx` | Add `useEffect` listening for `keydown` Escape → call `onClose()` |
| Modal close button no `aria-label` | `components/ui/Modal.jsx:18–22` | Add `aria-label="Close"` to the × button |
| Badge "Offline" contrast | `components/ui/Badge.jsx` | Already passing (5.2:1) — no change needed |

**DoD:** 0 axe critical violations on affected pages.

---

#### S1-02 · Mobile Hamburger Menu
**File:** `src/components/layout/Navbar.jsx`

Nav links are `hidden md:flex` — invisible on phones. No hamburger exists.

- Add a hamburger icon button (visible only on `< md`)
- Toggle a mobile drawer/overlay with all nav links
- Drawer closes on outside click and ESC
- Logout has a confirm step (use existing `<Modal>`)

**DoD:** Full navigation accessible on iPhone SE (375px).

---

#### S1-03 · Replace Hardcoded Lat/Lng with Geocoding ← BLOCKED on B-07
**File:** `src/app/(customer)/jobs/new/page.jsx:75–81`
**Blocked:** Waiting for Irwin to confirm Maps API key (B-07). Skip for now, come back when unblocked.

---

#### S1-05 · Admin Workers Table — Mobile Overflow
**File:** `src/app/(admin)/admin/workers/page.jsx:61–91`

Wrap the table container in `overflow-x-auto`. One-line fix.

**DoD:** Table scrolls horizontally on small screens without clipping.

---

### 🟡 MEDIUM PRIORITY

#### S1-11 · Activate Toast Notifications
**File:** `src/app/layout.jsx` + `src/components/ui/Toast.jsx`

Toast component exists but is never used.

- Add `<ToastContainer>` to root layout
- Create a `useToast()` hook or context for triggering toasts
- Fire toasts on: job posted, job status changed, payment confirmed
- Auto-dismiss after 3–4 s with manual close button

**DoD:** Success/error toasts visible on key user actions.

---

#### S1-09 · Active Nav State
**File:** `src/components/layout/Navbar.jsx`

- Import `usePathname` from `next/navigation`
- Apply `font-semibold text-blue-600 border-b-2 border-blue-600` to the active link

**DoD:** Current page link is visually highlighted.

---

#### S1-10 · Fix Broken `/notifications` Link
**File:** `src/components/layout/Navbar.jsx:10` + create `src/app/(customer)/notifications/page.jsx`

Create a basic notifications page that:
- Calls `GET /notifications`
- Lists notifications with title, body, read/unread state
- Has a "Mark all read" button

**DoD:** `/notifications` route no longer 404s.

---

#### S1-06 · Job Posting Form UX
**File:** `src/app/(customer)/jobs/new/page.jsx`

- Add inline field-level errors (red border + message below each field)
- Disable submit button until required fields are valid
- Show photo thumbnails with individual remove option (replace file count text)
- Add a multi-step progress bar (Step 1: Details → Step 2: Location → Step 3: Review)

**DoD:** User gets immediate feedback per field; photos are previewed before submit.

---

#### S1-07 · Worker Action Buttons — Icons + Subtitles
**File:** `src/app/(worker)/worker/jobs/[id]/page.jsx`

For each status action button (Accept → En Route → Start Work → Complete):
- Add a relevant icon (use an icon library or inline SVG)
- Add a subtitle line explaining the action (e.g., "Tap when you leave for the job")

**DoD:** Each action button is self-explanatory at a glance.

---

#### S1-08 · Payment UI Polish
**File:** `src/app/(customer)/jobs/[id]/page.jsx`

- Add icons/logos next to payment method labels (Card, Cash)
- Show a fee breakdown before confirmation (subtotal, platform fee, total)
- Ensure amount field is labelled clearly in ₱ PHP

**DoD:** User understands what they're paying and why before confirming.

---

#### S1-12 · Worker Earnings Filters
**File:** `src/app/(worker)/worker/earnings/page.jsx`

- Add a date range picker (from/to)
- Add a status filter dropdown (completed / disputed / refunded)
- Default sort: newest first

**DoD:** Worker can filter their earnings history.

---

#### S1-13 · Admin Disputes Detail Page
**File:** Create `src/app/(admin)/admin/disputes/[id]/page.jsx`

- Fetch full dispute via `GET /disputes/:id`
- Show: complaint reason, related job info, dispute photos, resolution timeline
- Dispute list cards should link to this page

**DoD:** Admin can review full dispute context before resolving.

---

#### S1-14 · Admin Worker Profile Page
**File:** Create `src/app/(admin)/admin/workers/[id]/page.jsx`

- Fetch worker via existing admin API
- Show: name, phone, email, skills, verification status, job history, dispute history
- Approve / Suspend accessible from this page
- Add bulk approve with checkboxes to the worker list page

**DoD:** Admin can view full worker profile before making approve/suspend decision.

---

#### S1-15 · OTP Copy — Specify SMS + Phone Number
**File:** `src/app/(auth)/verify-otp/page.jsx:59–60`

Update copy to: `"We sent a 6-digit code via SMS to [phone number]"`.
Phone number should come from auth state/context.

**DoD:** User knows exactly where to look for the OTP code.

---

### 🟢 LOW PRIORITY

#### S1-16 · Replace Category Emojis with SVG Icons
**File:** `src/app/(customer)/dashboard/page.jsx:39–40`

Replace emoji strings in `CATEGORY_ICONS` with inline SVG or an icon library component.
Add `aria-label="Category Name"` to each.

---

#### S1-17 · Breadcrumbs on Detail Pages
**File:** All `[id]/page.jsx` files (jobs, worker jobs, admin disputes, admin workers)

Add a breadcrumb trail at top of each detail page.
Example: `Dashboard > Jobs > #40c052a1`

---

#### S1-18 · Back Button on Detail Pages
**File:** All `[id]/page.jsx` files

Add `<button onClick={() => router.back()}>← Back</button>` at the top of each detail page.

---

#### S1-19 · Replace `window.confirm` with Modal
**Status:** Already Done — no `window.confirm` calls found. ✅ Skip.

---

#### S1-20 · Tailwind Color Tokens
**File:** `frontend/tailwind.config.js`
**Co-own with Irwin**

Add `success`, `warning`, `danger` color tokens to `theme.extend.colors`.
Replace hardcoded `bg-red-100`, `text-red-700`, etc. with the new tokens.

---

## Summary

| Tasks | Count |
|-------|-------|
| HIGH | 3 (S1-02, S1-04, S1-05) + S1-03 blocked |
| MEDIUM | 10 (S1-06 → S1-15) |
| LOW | 4 (S1-16 → S1-20, excluding Done) |
| **Total** | **17 active** |

Ping @lau once S1-01 (DB fix) is confirmed — cancel job flow will be unblocked.
Ping @dasiganirwin to unblock B-07 (Maps API key) so you can start S1-03.
