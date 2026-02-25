# Sprint 0 – BlueWork MVP Initialization

**Sprint Goal:** Establish project foundations — confirm scope, scaffold infrastructure, set up database, build base UI components, and deploy a working skeleton.

**Last Updated:** 2026-02-24
**Managed by:** Orchestrator Agent

---

## Blockers — Resolve Before Execution

| # | Blocker | Owner | Urgency |
|---|---------|-------|---------|
| B-01 | Tech stack decision: Next.js (PWA) vs React Native (native mobile) unresolved | Irwin | Critical |
| B-02 | Team file naming mismatch in `/team/` (jei/alex/lau vs actual names) | Irwin | High |
| B-03 | Stripe & Supabase credentials not yet provisioned | Irwin / Jane | High |
| B-04 | Google Maps / Mapbox API key decision unresolved | Irwin | Medium |
| B-05 | "Notification Agent" referenced but no agent file exists — assigned to Jane for Sprint 0 | Orchestrator | Low |

---

## Task Board

| Task ID | Task | Owner | Depends On | Definition of Done | Status |
|---------|------|-------|------------|-------------------|--------|
| S0-01 | Confirm PRD & MVP feature prioritization | Irwin Dasigan | — | PRD signed off, MVP scope frozen, no open questions | To Do |
| S0-02 | Resolve tech stack decision (Next.js vs React Native) | Irwin Dasigan | S0-01 | Decision documented in `architecture.md`, team informed | To Do |
| S0-03 | Create wireframes: Job Listings, Worker Profile, Job Assignment | Irwin Dasigan | S0-01 | Figma screens shared, reviewed, and accepted by team | To Do |
| S0-04 | Define Tailwind CSS config & styling guidelines | Irwin Dasigan | S0-03 | `tailwind.config.ts` committed, palette & typography documented | To Do |
| S0-05 | Scaffold Next.js 14 + Supabase project structure | Builder Agent | S0-02 | Repo initialized, folder structure matches `architecture.md`, env vars templated | To Do |
| S0-06 | Initialize Git repository & branch strategy | Builder Agent | S0-05 | Repo on GitHub, `main`/`dev` branches created, README present | To Do |
| S0-07 | Add `.env.example` with all required keys | Builder Agent | S0-05 | All keys documented: Supabase, Stripe, Resend, Maps API — no secrets committed | To Do |
| S0-08 | Set up Supabase tables: Users, Jobs, Worker Profiles, Transactions, Notifications | Jane | S0-05 | Tables created, schema matches `architecture.md`, RLS policies applied | To Do |
| S0-09 | Implement Supabase Auth (email/password) | Jane | S0-08 | Login and registration endpoints functional, JWT validated, role column set | To Do |
| S0-10 | Generate API boilerplate for all backend endpoints | Builder Agent | S0-08 | Stub routes created for: auth, jobs CRUD, worker profiles CRUD, payments | To Do |
| S0-11 | Implement UI component library: Button, Input, Modal, Card, Dropdown | Alex | S0-03, S0-04 | Components render correctly, responsive, Tailwind-styled | To Do |
| S0-12 | Build Job Listing page (dummy data) | Alex | S0-11 | Page renders job cards with mock data, matches wireframe | To Do |
| S0-13 | Build Worker Profile page (dummy data) | Alex | S0-11 | Page renders worker card with mock data, matches wireframe | To Do |
| S0-14 | Design Agent: UI/UX review of component layout & cards | Design Agent | S0-11 | Written review delivered, feedback items logged for Alex | To Do |
| S0-15 | Stripe integration: server-side payment processing stub | Jane | S0-10 | Stripe client initialized server-side, webhook verification skeleton in place, no secret key exposed | To Do |
| S0-16 | Email notification setup via Resend | Jane | S0-10 | Resend client configured, test email sent on job assignment event | To Do |
| S0-17 | Write manual test cases: Job Listing, Worker Profile, Payment flows | Bob | S0-12, S0-13 | Test case document created covering happy path + 3 edge cases per flow | To Do |
| S0-18 | QA Agent: Run automated API tests on backend endpoints | QA Agent | S0-10 | All stub endpoints return expected status codes, results reported to Orchestrator | To Do |
| S0-19 | Deploy frontend to Vercel + connect Supabase | Builder Agent | S0-09, S0-12, S0-13 | App accessible on Vercel URL, env vars set, Supabase connected | To Do |
| S0-20 | Test deployed MVP full workflow | Irwin Dasigan | S0-19 | End-to-end walkthrough completed, issues logged in GitHub Issues | To Do |

---

## Dependency Chain

```
S0-01 (PRD confirm)
  └── S0-02 (Stack decision)
        └── S0-05 (Scaffold project)
              ├── S0-06 (Git setup)
              ├── S0-07 (.env.example)
              └── S0-08 (Supabase tables)
                    ├── S0-09 (Auth)
                    └── S0-10 (API boilerplate)
                          ├── S0-15 (Stripe stub)
                          ├── S0-16 (Resend)
                          └── S0-18 (QA Agent: API tests)

S0-01 → S0-03 (Wireframes)
  └── S0-04 (Tailwind config)
        └── S0-11 (UI components)
              ├── S0-12 (Job Listing page)
              ├── S0-13 (Worker Profile page)
              └── S0-14 (Design Agent review)
                    └── S0-17 (QA manual test cases)

S0-09 + S0-12 + S0-13 → S0-19 (Vercel deploy)
  └── S0-20 (Irwin: full workflow test)
```

---

## Notes

- Orchestrator Agent manages task assignment, status updates, and reporting.
- Team members update progress in Slack; Orchestrator tracks in TODO.md.
- Any blockers or unclear tasks are flagged to Irwin for clarification.
- B-01 and B-03 must be resolved before any technical work begins.

---

---

# Sprint 1 – UX Polish & Bug Fixes

**Sprint Goal:** Address all high and medium priority findings from the Design Agent UI/UX audit (`docs/uiux-recommendation-phase-1.md`). Fix the critical backend bug blocking job cancellation.

**Last Updated:** 2026-02-25 ✅ SPRINT COMPLETE
**Managed by:** Orchestrator Agent
**Source Audit:** `/docs/uiux-recommendation-phase-1.md`

---

## Blockers — Resolve Before Execution

| # | Blocker | Owner | Urgency |
|---|---------|-------|---------|
| B-06 | `chk_worker_on_accept` DB constraint not migrated — cancelling pending jobs returns 500 | Lau | Critical |
| B-07 | ~~Google Maps / Mapbox API key still unresolved — needed for S1-03 geocoding task~~ | Irwin | ✅ Resolved |

---

## Task Board

### 🔴 HIGH PRIORITY

| Task ID | Task | Owner | File(s) | Definition of Done | Status |
|---------|------|-------|---------|-------------------|--------|
| S1-01 | Fix job cancel 500 error — apply migration `001_fix_worker_constraint.sql` to Supabase | Lau | `backend/migrations/001_fix_worker_constraint.sql` | Migration applied in Supabase SQL editor; PATCH `/jobs/:id/status` with `cancelled` returns 200 for pending jobs with no worker | ✅ Done |
| S1-02 | Implement mobile hamburger menu | Jei | `src/components/layout/Navbar.jsx` | Hamburger icon visible on < md screens; opens a drawer/overlay with all nav links; logout has confirm step; closes on outside click and ESC | ✅ Done |
| S1-03 | Replace hardcoded lat/lng with geocoding API | Jei + Irwin | `src/app/(customer)/jobs/new/page.jsx`, `src/components/ui/AddressAutocomplete.jsx` | Address autocomplete integrated (Google Places or Mapbox); confirmed address shown before submit; no hardcoded coords | ✅ Done |
| S1-04 | Fix all accessibility failures | Jei | Multiple (see audit) | All 6 WCAG issues resolved: `<label>` on OTP input, `aria-describedby` on error divs, `aria-label` on category items, ESC closes modals, close button has `aria-label`, badge contrast ≥ 4.5:1 | ✅ Done |
| S1-05 | Fix admin workers table — mobile overflow | Jei | `src/app/(admin)/admin/workers/page.jsx:61–91` | Table wrapped in `overflow-x-auto`; or card layout below `md` breakpoint; no horizontal scroll clipping | ✅ Done |

---

### 🟡 MEDIUM PRIORITY

| Task ID | Task | Owner | File(s) | Definition of Done | Status |
|---------|------|-------|---------|-------------------|--------|
| S1-06 | Add field-level validation + photo preview to job posting form | Jei | `src/app/(customer)/jobs/new/page.jsx` | Inline field errors (red border + message); submit disabled until required fields valid; photo thumbnails shown with remove option; multi-step progress indicator | ✅ Done |
| S1-07 | Improve worker status action buttons | Jei | `src/app/(worker)/worker/jobs/[id]/page.jsx` | Action buttons (Accept → En Route → Start Work → Complete) have icons + context subtitles; clear visual state per step | ✅ Done |
| S1-08 | Improve payment UI — method icons + fee breakdown | Jei | `src/app/(customer)/jobs/[id]/page.jsx` | Payment method icons/descriptions shown; fee breakdown displayed before confirm; amount not hardcoded | ✅ Done |
| S1-09 | Add active nav state highlighting | Jei | `src/components/layout/Navbar.jsx:42` | `usePathname()` used to apply active class (`font-semibold text-blue-600 border-b-2`) to current nav link | ✅ Done |
| S1-10 | Fix broken `/notifications` nav link | Jei | `src/components/layout/Navbar.jsx:10` | Either create `/notifications` page with list of notifications OR remove the link; no 404 on click | ✅ Done |
| S1-11 | Activate Toast notifications for key actions | Jei | `src/app/layout.jsx`, `src/components/ui/Toast.jsx` | `ToastContainer` in root layout; toasts fire on: job posted, status changed, payment confirmed; auto-dismiss 3–4 s with manual close | ✅ Done |
| S1-12 | Add date range + status filters to worker earnings | Jei | `src/app/(worker)/worker/earnings/page.jsx` | Date range picker and status filter (completed/disputed/refunded) functional; default sort newest first | ✅ Done |
| S1-13 | Improve admin disputes — add detail page | Jei | `src/app/(admin)/admin/disputes/` | Create `/admin/disputes/[id]/page.jsx` showing complaint reason, photos, resolution timeline; dispute cards link to it | ✅ Done |
| S1-14 | Add worker profile view for admin before approve/suspend | Jei | `src/app/(admin)/admin/workers/` | Create `/admin/workers/[id]/page.jsx` with full profile (skills, docs, history); approve/suspend accessible from profile; bulk approve with checkboxes | ✅ Done |
| S1-15 | OTP page — specify delivery channel in copy | Jei | `src/app/(auth)/verify-otp/page.jsx:59–60` | Copy updated to show phone number and clarify SMS delivery (e.g., "We sent a 6-digit code via SMS to +63 9XX XXX XXXX") | ✅ Done |

---

### 🟢 LOW PRIORITY

| Task ID | Task | Owner | File(s) | Definition of Done | Status |
|---------|------|-------|---------|-------------------|--------|
| S1-16 | Replace category emojis with SVG icons + aria-labels | Jei | `src/app/(customer)/dashboard/page.jsx:39–40` | SVG icons used; each has `aria-label` or text label | ✅ Done |
| S1-17 | Add breadcrumbs to all detail pages | Jei | All `[id]/page.jsx` files | Breadcrumb trail shown (e.g., Dashboard > Jobs > #ID) on all detail pages | ✅ Done |
| S1-18 | Add back button on all detail pages | Jei | All `[id]/page.jsx` files | `router.back()` button present on all detail pages | ✅ Done |
| S1-19 | Replace `window.confirm()` with Modal for destructive actions | Jei | Logout + any remaining `window.confirm` calls | All destructive confirmations use the existing `<Modal>` component | ✅ Done (no window.confirm found) |
| S1-20 | Define color token palette in Tailwind config | Irwin + Jei | `tailwind.config.js` | Explicit success, warning, danger, and gray tokens defined and used consistently across components | ✅ Done |
| S1-21 | QA audit: Lighthouse + axe accessibility pass | Alex | All pages | Lighthouse accessibility score ≥ 90; axe DevTools shows 0 critical violations; WCAG AA contrast verified | ✅ Done (code-level audit complete; 6 issues found and fixed) |

---

## Dependency Chain

```
S1-01 (DB fix — Lau)           ← must ship first; unblocks all cancel flows

S1-03 (Geocoding)              ← blocked on B-07 (API key decision by Irwin)

S1-02 (Mobile nav)
S1-04 (Accessibility)
S1-05 (Admin table mobile)
  └── S1-21 (QA audit — Alex)  ← runs after all HIGH + MEDIUM items are Done

S1-06 → S1-11 (Toast)         ← Toast should be ready before form feedback items
S1-13 (Disputes detail page)
S1-14 (Workers profile page)
  └── S1-21 (QA audit)
```

---

## Assignment Summary

| Owner | Tasks |
|-------|-------|
| **Lau** | S1-01 (DB migration — critical, do first) |
| **Jei** | S1-02, S1-03, S1-04, S1-05, S1-06, S1-07, S1-08, S1-09, S1-10, S1-11, S1-12, S1-13, S1-14, S1-15, S1-16, S1-17, S1-18, S1-19, S1-20 |
| **Irwin** | B-07 (unblock geocoding API key), S1-03 (co-own), S1-20 (Tailwind tokens co-own) |
| **Alex** | S1-21 (QA audit — runs last) |

---

## Notes

- **Lau starts immediately** with S1-01 — this is the only backend task in Sprint 1 but is blocking prod.
- **Jei** carries the bulk of this sprint. Suggested execution order: S1-04 → S1-02 → S1-11 → S1-09 → S1-10 → S1-05 → S1-06 → S1-07 → S1-08 → S1-12 → S1-13 → S1-14 → S1-15 → low priority.
- **Irwin** must resolve B-07 (Maps API key) before Jei can start S1-03.
- **Alex** runs S1-21 only after all HIGH and MEDIUM items are marked Done.
- Audit source: `/docs/uiux-recommendation-phase-1.md` (Design Agent, 2026-02-24).

---

---

# Sprint 2 – Real-Time Features & Core UX Completion

**Sprint Goal:** Wire up the existing WebSocket and messaging infrastructure to the UI. Deliver live job tracking, in-app chat, worker availability toggle, and notification badge — completing the core MVP loop.

**Last Updated:** 2026-02-25
**Managed by:** Orchestrator Agent

---

## Blockers — Resolve Before Execution

| # | Blocker | Owner | Urgency |
|---|---------|-------|---------|
| B-08 | Confirm Supabase Realtime is enabled on `jobs` table (required for WS broadcast to fire on status changes) | Irwin / Lau | High |
| B-09 | Verify `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are set in `backend/.env` — needed for end-to-end payment testing | Irwin / Jane | Medium |

---

## Task Board

### 🔴 HIGH PRIORITY

| Task ID | Task | Owner | File(s) | Definition of Done | Status |
|---------|------|-------|---------|-------------------|--------|
| S2-01 | Wire real-time job status updates on customer job detail | Jei | `src/app/(customer)/jobs/[id]/page.jsx` | Page subscribes to job via `useWebSocket` on mount; status badge updates live (en_route → in_progress → completed) without page refresh | ✅ Done (pre-existing) |
| S2-02 | Show live worker location on Mapbox map — customer job detail | Jei | `src/app/(customer)/jobs/[id]/page.jsx`, `src/components/ui/JobMap.jsx` | Mapbox GL map renders when job is accepted; worker pin moves in real-time via `worker.location_updated` WS event; map only visible when job is active | ✅ Done |
| S2-03 | Build in-app chat UI — customer side | Jei | `src/app/(customer)/jobs/[id]/page.jsx`, `src/components/jobs/JobChat.jsx` | Message list renders with `GET /jobs/:id/messages`; customer can send text via `POST /jobs/:id/messages`; auto-scrolls to latest; polls every 5s (no WS required for MVP) | ✅ Done (pre-existing) |
| S2-04 | Build in-app chat UI — worker side | Jei | `src/app/(worker)/worker/jobs/[id]/page.jsx` | Same as S2-03 from worker perspective; worker can read and reply to customer messages | ✅ Done (pre-existing) |

---

### 🟡 MEDIUM PRIORITY

| Task ID | Task | Owner | File(s) | Definition of Done | Status |
|---------|------|-------|---------|-------------------|--------|
| S2-05 | Worker availability toggle | Jei | `src/app/(worker)/worker/dashboard/page.jsx` | Toggle switch (Online / Offline / Busy) calls `PATCH /workers/me/availability`; state persists on reload; shows current status clearly | ✅ Done (pre-existing) |
| S2-06 | Show customer location on worker job detail map | Jei | `src/app/(worker)/worker/jobs/[id]/page.jsx`, `src/components/ui/JobMap.jsx` | Mapbox map shows pin at customer `lat/lng` from job data; worker can tap to open native maps for navigation; only visible when job is accepted/en_route/in_progress | ✅ Done |
| S2-07 | Worker location broadcasting (en route / in progress) | Jei | `src/app/(worker)/worker/jobs/[id]/page.jsx` | When job status is `en_route` or `in_progress`, worker page sends `worker.location_ping` via `useWebSocket` every 10s using `navigator.geolocation`; stops on job complete/cancel | ✅ Done |
| S2-08 | Unread notification badge in navbar | Jei | `src/components/layout/Navbar.jsx` | Badge shows unread count from `GET /notifications?read=false`; polls every 30s; clears on visiting `/notifications`; displays max "9+" | ✅ Done |

---

### 🟢 LOW PRIORITY

| Task ID | Task | Owner | File(s) | Definition of Done | Status |
|---------|------|-------|---------|-------------------|--------|
| S2-09 | Empty states for all list pages | Jei | Jobs, earnings, notifications, nearby jobs pages | All list pages show a meaningful empty state (icon + message + CTA) when no data | ✅ Done |
| S2-10 | QA pass — real-time flows, chat, availability | Alex | All Sprint 2 files | Manual test of: job accept → live status update → chat exchange → job complete → earnings updated; 0 console errors | To Do |

---

## Dependency Chain

```
B-08 (Supabase Realtime confirm)
  └── S2-01 (Live job status)
        └── S2-02 (Worker location map — customer)
              └── S2-07 (Worker location broadcasting)
                    └── S2-06 (Customer location map — worker)

S2-03 (Customer chat)
S2-04 (Worker chat)       ← independent, parallel with above

S2-05 (Availability toggle)  ← independent

S2-08 (Notification badge)   ← independent

S2-01 + S2-03 + S2-05 + S2-08
  └── S2-09 (Empty states)
        └── S2-10 (QA pass — runs last)
```

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|-----------|
| `navigator.geolocation` blocked on HTTP in dev | Medium | Test on HTTPS or localhost only |
| Worker location pings drain mobile battery | Medium | Ping only when job is active; stop on complete/cancel |
| Chat polling (5s) adds backend load | Low | Acceptable for MVP; upgrade to WS push in Sprint 3 if needed |
| Mapbox GL JS bundle size (~250KB gzipped) | Low | Lazy-load map component with `next/dynamic` |

---

## Assignment Summary

| Owner | Tasks |
|-------|-------|
| **Jei** | S2-01, S2-02, S2-03, S2-04, S2-05, S2-06, S2-07, S2-08, S2-09 |
| **Irwin / Lau** | Resolve B-08 (Supabase Realtime), B-09 (Stripe env vars) |
| **Alex** | S2-10 (QA — runs last) |

---

## Notes

- Reuse `AddressAutocomplete` Mapbox token (`NEXT_PUBLIC_MAPBOX_TOKEN`) for map rendering — no new key needed.
- `JobMap` component should be a shared component usable by both customer and worker pages.
- Chat is text-only for MVP. No file attachments, no read receipts.
- Suggested execution order for Jei: S2-05 → S2-08 → S2-01 → S2-03 → S2-04 → S2-07 → S2-02 → S2-06 → S2-09.
