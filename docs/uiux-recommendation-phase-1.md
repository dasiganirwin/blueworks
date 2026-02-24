# BlueWork UIUX Audit — Phase 1 Recommendations

**Date:** 2026-02-24
**Auditor:** Design Agent
**Scope:** Full frontend audit (Customer, Worker, Admin)
**Stack:** Next.js 14 + Tailwind CSS

---

## Overall Scorecard

| Area | Score | Status |
|------|-------|--------|
| Visual Design | 7/10 | Good |
| Mobile-First | 7/10 | Good |
| User Flows | 5/10 | Needs Work |
| Component Consistency | 7/10 | Good |
| Empty States & Loading | 6/10 | Good |
| Accessibility | 4/10 | Critical |
| Navigation | 7/10 | Good |
| Friction Points | 5/10 | Needs Work |

---

## HIGH PRIORITY

### 1. No Mobile Navigation Menu
**File:** `src/components/layout/Navbar.jsx:40`
Nav links are `hidden md:flex` — completely invisible on phones. No hamburger menu exists. Customers and workers on mobile can't navigate.

**Fix:** Implement a hamburger menu with a slide-out drawer or fullscreen overlay for mobile. Ensure logout has a confirmation step.

---

### 2. Accessibility Failures
**Files:** Multiple

| Issue | File | Line |
|-------|------|------|
| OTP `<input>` has no `<label>` | `verify-otp/page.jsx` | 65–73 |
| Error divs not linked via `aria-describedby` | `jobs/new/page.jsx` | 113–115 |
| Category emojis lack alt text / `aria-label` | `customer/dashboard/page.jsx` | 39–40 |
| Modal has no ESC key dismissal | `components/ui/Modal.jsx` | — |
| Close button has no `aria-label` | `components/ui/Modal.jsx` | 18–22 |
| "Offline" badge fails WCAG AA contrast (~3.5:1 vs required 4.5:1) | `components/ui/Badge.jsx` | — |

**Fix:** Add explicit `<label htmlFor>`, `aria-describedby` on error messages, `aria-label` on icon-only buttons, ESC key handler on modals, and correct badge contrast to ≥4.5:1.

---

### 3. Hardcoded Address Coordinates
**File:** `src/app/(customer)/jobs/new/page.jsx:75–81`
Lat/lng hardcoded to Manila coords (`14.5995, 120.9842`). No geocoding. Users don't know if their address is recognized or being used correctly.

**Fix:** Integrate Google Maps Places API (or Mapbox Geocoding API) for address autocomplete. Show a confirmation of the resolved address before form submission.

---

### 4. Admin Workers Table Not Mobile-Friendly
**File:** `src/app/(admin)/admin/workers/page.jsx:61–91`
Full HTML table with no horizontal scroll or card layout fallback. Unusable on small screens.

**Fix:** Wrap table in `overflow-x-auto` or switch to a card-per-row layout below `md` breakpoint.

---

## MEDIUM PRIORITY

### 5. User Flow Friction Points

| Flow | Issue | File |
|------|-------|------|
| Job Posting | No progress indicator, no field-level validation, no photo preview (only file count shown) | `jobs/new/page.jsx` |
| Worker Status Progression | Buttons (Accept → Start Navigation → Start Work → Complete) lack icons and context | `worker/jobs/[id]/page.jsx` |
| Payment | Amount hardcoded (₱850), no fee breakdown, payment methods have no icons or descriptions | `customer/jobs/[id]/page.jsx:138` |
| OTP Delivery | "We sent a 6-digit code" — no clarity on whether SMS or email | `verify-otp/page.jsx:59–60` |

**Fix:**
- Add a multi-step progress bar to the job posting form.
- Show inline field errors (red border + message) and disable submit until required fields are valid.
- Add thumbnail previews for uploaded photos with individual remove option.
- Add icons and subtitles to worker status action buttons.
- Display payment method logos and descriptions; show a fee breakdown before confirming.
- Specify OTP delivery channel (e.g., "Check your SMS at +63 9XX XXX XXXX").

---

### 6. No Active Nav State
**File:** `src/components/layout/Navbar.jsx:42`
Current page is not highlighted in the navigation. Users have no visual indicator of where they are.

**Fix:** Use `usePathname()` to apply an active class (e.g., `font-semibold text-blue-600 border-b-2 border-blue-600`) to the current nav link.

---

### 7. Broken Notification Link
**File:** `src/components/layout/Navbar.jsx:10`
Customer nav includes `/notifications` but the page does not exist.

**Fix:** Either create the notifications page or remove the nav link until the feature is built.

---

### 8. Toast Component Unused
**File:** `src/components/ui/Toast.jsx`
Component exists but is never invoked anywhere in the app. Users receive no feedback on successful actions (job posted, payment confirmed, etc.).

**Fix:** Integrate `ToastContainer` in the root layout and trigger toasts on key actions. Add auto-dismiss (3–4 seconds) and a manual close button per toast.

---

### 9. Worker Earnings — No Filtering
**File:** `src/app/(worker)/worker/earnings/page.jsx`
All transactions displayed with no date range, status, or category filters. Difficult to find specific records.

**Fix:** Add a date range picker and status filter (completed, disputed, refunded). Sort by date (default: newest first).

---

### 10. Admin Disputes — Insufficient Context
**File:** `src/app/(admin)/admin/disputes/page.jsx:58–69`
Dispute cards show job description only. No customer complaint text, photos, or resolution history visible.

**Fix:** Add complaint reason summary, link to job photos, and a resolution timeline. Create `/admin/disputes/[id]/page.jsx` for full dispute detail view.

---

### 11. Admin Workers — No Profile Before Approval
**File:** `src/app/(admin)/admin/workers/page.jsx:72–87`
Workers can be approved or suspended based on name, phone, and email only. No verification docs, skills, or dispute history visible.

**Fix:** Add a "View Profile" button linking to `/admin/workers/[id]/page.jsx` showing full verification status, skills, and history. Add bulk approval with checkboxes.

---

## LOW PRIORITY

| Item | Recommendation |
|------|---------------|
| Category icons | Replace emoji (🔧⚡🪚) with proper SVG icons with `aria-label` or text labels |
| Breadcrumbs | Add to all detail pages (e.g., Dashboard > Jobs > #ID) |
| Back button | Add `router.back()` button on all detail pages |
| Confirmation dialog | Replace `window.confirm()` with a proper modal for logout and destructive actions |
| Color tokens | Define explicit success, warning, danger, and gray palettes in `tailwind.config.js` |
| Loading skeletons | Create semantic skeleton variants (JobCardSkeleton, TableRowSkeleton) instead of generic gray divs |
| Skip-to-content link | Add a visually hidden skip link at the top of every page for keyboard users |

---

## Design System Gaps

| Gap | Impact | Priority |
|-----|--------|----------|
| No mobile navigation menu | All users on mobile cannot navigate | High |
| No Confirmation Dialog component | Logout and destructive actions use `window.confirm` | High |
| Toast/Alert not in use | No persistent feedback on key actions | Medium |
| No Loading Skeleton component | Inconsistent loading patterns across pages | Medium |
| No Pagination component | Admin tables implement pagination manually and inconsistently | Medium |
| No Breadcrumb component | Users can't navigate back from deep pages | Low |
| No Form Error Summary | Multi-field forms show only inline errors; no summary at top | Medium |

---

## Mobile Viewport Issues

| Screen Width | Issue | File |
|-------------|-------|------|
| < 375px | Navbar text wraps; logout becomes misaligned | `Navbar.jsx` |
| < 640px | Category grid `grid-cols-4` is too cramped | `customer/dashboard/page.jsx:32` |
| < 768px | Admin workers table overflows; no horizontal scroll | `admin/workers/page.jsx` |
| < 800px | Chat container `h-80` (320px fixed) takes too much space | `components/jobs/JobChat.jsx:42` |

---

## Recommended Sprint Actions (Priority Order)

1. **Implement mobile hamburger menu** — affects all user roles on mobile
2. **Fix accessibility issues** — labels, ARIA attributes, badge contrast, ESC key on modals
3. **Add real geocoding** to job posting form (Google Maps Places / Mapbox)
4. **Add field-level form validation** with inline errors and disabled submit state
5. **Add worker profile view** in Admin before approve/suspend actions
6. **Activate Toast notifications** for success/error feedback on key actions
7. **Fix broken `/notifications` nav link** (create page or remove link)
8. **Admin table mobile fix** — `overflow-x-auto` or card layout on small screens

---

## Testing Checklist

### Devices to Test
- [ ] iPhone SE (375px)
- [ ] iPhone 14 (390px)
- [ ] Android tablet 7" (600px)
- [ ] Desktop 1280px+

### Test Scenarios
- [ ] Keyboard-only navigation (Tab, Enter, ESC) through all modals and forms
- [ ] Screen reader (VoiceOver / NVDA) on login, registration, and job posting flows
- [ ] Location permission denied — verify fallback behavior is visible to user
- [ ] Form submission on slow network (throttle to 3G) — verify loading states
- [ ] Payment flow with mock Stripe — verify redirect and confirmation

### Automated
- [ ] Run axe DevTools or Lighthouse Accessibility audit (target: 90+)
- [ ] Check color contrast ratios (target: WCAG AA 4.5:1 for normal text)
- [ ] Lighthouse Performance audit (target: 85+)
