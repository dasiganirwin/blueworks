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

---

---

# Sprint 3 — Trust, Payments & Marketplace Completion

**Sprint Goal:** Close the remaining MVP gaps — ratings & reviews, worker job rejection, dispute filing UI, worker public profiles, job scheduling, and PWA mobile optimization. Stripe is deferred to Sprint 4.

**Last Updated:** 2026-02-25 ✅ SPRINT COMPLETE
**Managed by:** Orchestrator Agent

---

## Blockers — Resolve Before Execution

| # | Blocker | Owner | Urgency |
|---|---------|-------|---------|
| B-11 | ~~Confirm `ratings` table exists in Supabase — if not, migration required before S3-01~~ | Lau | ✅ Resolved |

---

## Task Board

### 🔴 HIGH PRIORITY

| Task ID | Task | Owner | File(s) | Definition of Done | Status |
|---------|------|-------|---------|-------------------|--------|
| S3-01 | Ratings & Reviews — backend API | Lau | `backend/src/routes/`, `backend/src/services/` | `POST /jobs/:id/rating` stores rating (1–5) + optional comment; only callable once per party after job `completed`; updates worker's average rating in `workers` table | ✅ Done |
| S3-02 | Ratings & Reviews — customer UI | Jei | `src/app/(customer)/jobs/[id]/page.jsx` | After job completes and payment submitted, show star rating widget (1–5) + optional comment; submit once; confirmation toast shown; rating widget hidden after submission | ✅ Done |
| S3-03 | Ratings & Reviews — worker UI | Jei | `src/app/(worker)/worker/jobs/[id]/page.jsx` | After job completes, worker can rate the customer; same star widget; submit once; confirmation toast shown | ✅ Done |
| S3-04 | Worker job rejection | Jei | `src/app/(worker)/worker/jobs/[id]/page.jsx` | Worker can reject a `pending` job with optional reason; job returns to `pending` with no worker assigned; customer notified via WS `job.status_changed` + in-app notification | ✅ Done |

---

### 🟡 MEDIUM PRIORITY

| Task ID | Task | Owner | File(s) | Definition of Done | Status |
|---------|------|-------|---------|-------------------|--------|
| S3-05 | Dispute filing UI — customer | Jei | `src/app/(customer)/jobs/[id]/page.jsx` | Customer can file a dispute on `completed` jobs; form with reason text; calls `POST /disputes`; confirmation toast shown; button hidden after dispute filed | ✅ Done |
| S3-06 | Worker public profile page — customer view | Jei | `src/app/(customer)/workers/[id]/page.jsx` | Shows worker name, skills, rating, completed jobs count; linked from assigned worker card on job detail page | ✅ Done |
| S3-07 | PWA — make app installable on mobile | Jei | `frontend/next.config.js`, `frontend/public/manifest.json` | App passes PWA install criteria: manifest with icons, service worker registered, HTTPS; "Add to Home Screen" prompt works on iOS/Android Chrome | ✅ Done |
| S3-08 | Job scheduling — book for later | Jei | `src/app/(customer)/jobs/new/page.jsx` | Optional date/time picker on job posting form; `scheduled_time` sent to backend; displayed on job detail page | ✅ Done |

---

### 🟢 LOW PRIORITY

| Task ID | Task | Owner | File(s) | Definition of Done | Status |
|---------|------|-------|---------|-------------------|--------|
| S3-09 | Display worker rating on job cards and profile | Jei | `src/components/jobs/JobCard.jsx`, `src/components/workers/WorkerCard.jsx` | Star rating (e.g. ★ 4.8) visible on worker cards and profile; updates after new rating submitted | ✅ Done |
| S3-10 | Worker skills/category filter on nearby jobs | Jei | `src/app/(worker)/worker/jobs/nearby/page.jsx` | Filter bar by category (Plumber, Electrician, etc.); passed to `GET /jobs/nearby`; persists during session | ✅ Done |
| S3-11 | QA pass — ratings, rejection, disputes, PWA | Alex | All Sprint 3 files | Manual test of: full job flow with rating, worker rejection, dispute filing, PWA install; 0 console errors | ✅ Done |

---

## Deferred to Sprint 4

| Task | Reason |
|------|--------|
| Stripe end-to-end webhook verification | Deprioritized by Irwin — credentials not yet provisioned |

---

## Dependency Chain

```
B-11 (ratings table exists)
  └── S3-01 (ratings API — Lau)
        ├── S3-02 (customer rating UI)
        ├── S3-03 (worker rating UI)
        └── S3-09 (display rating on cards)

S3-04 (worker rejection) — independent
S3-05 (dispute UI)       — independent (API already exists)
S3-06 (worker profile)   — independent
  └── S3-09 (show rating on profile)

S3-07 (PWA)              — independent
S3-08 (scheduling)       — independent
S3-10 (category filter)  — independent

S3-01 + S3-04 + S3-05 + S3-06
  └── S3-11 (QA — runs last)
```

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Double-rating — same user submits rating twice | Medium | DB unique constraint on `(job_id, rater_id)`; API returns 409 on duplicate |
| Worker rejection orphans job (no re-broadcast) | Medium | On reject, clear `worker_id`, reset to `pending`, re-broadcast `job.created` to nearby workers |
| PWA service worker caches stale API responses | Low | Cache only static assets; never cache API routes |
| Scheduling UX complexity | Low | Simple datetime picker only; no recurring jobs in MVP |

---

## Assignment Summary

| Owner | Tasks |
|-------|-------|
| **Lau** | Resolve B-11, S3-01 (ratings API) |
| **Jei** | S3-02, S3-03, S3-04, S3-05, S3-06, S3-07, S3-08, S3-09, S3-10 |
| **Alex** | S3-11 (QA — runs last) |

---

## Suggested Execution Order (Jei)

`S3-04 → S3-05 → S3-02 → S3-03 → S3-06 → S3-09 → S3-07 → S3-08 → S3-10`

---

## Notes

- Stripe is deferred to Sprint 4. Cash payment flow remains active for MVP.
- Ratings API must enforce: job must be `completed`, caller must be customer or worker on that job, one rating per party.
- Worker rejection should re-broadcast the job to nearby workers so it doesn't disappear from the feed.
- PWA icons required: 192x192 and 512x512 PNG in `/public/icons/`.

---

---

# Sprint 4 — Payments, Emails & Profile Completion

**Sprint Goal:** Complete the full payment loop (Stripe live + cash confirm UI + redirect handling), add transactional email via Resend, allow workers to edit their profile/skills, and give admins a transactions view. This sprint closes all remaining MVP gaps from the PRD.

**Last Updated:** 2026-02-25
**Managed by:** Orchestrator Agent

---

## Blockers — Resolve Before Execution

| # | Blocker | Owner | Urgency |
|---|---------|-------|---------|
| B-12 | `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` must be set in Railway env vars | Irwin | Critical |
| B-13 | Stripe webhook endpoint must be registered in Stripe Dashboard: `POST https://[railway-url]/api/v1/payments/webhook` | Irwin | Critical |
| B-14 | `RESEND_API_KEY` must be provisioned and set in Railway env vars before S4-05 | Irwin / Jane | High |

---

## Task Board

### 🔴 HIGH PRIORITY

| Task ID | Task | Owner | File(s) | Definition of Done | Status |
|---------|------|-------|---------|-------------------|--------|
| S4-01 | Stripe live end-to-end test | Irwin | Config only | `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` set in Railway; webhook URL registered in Stripe Dashboard; test card payment completes and `payments` row updated to `completed` in Supabase | ⏸ Deferred |
| S4-02 | Cash confirm UI — worker side | Jei | `src/app/(worker)/worker/jobs/[id]/page.jsx`, `backend/src/routes/payments.routes.js` | When job is `completed` and payment method is `cash` and status is `pending`, worker sees "Confirm Cash Receipt" button; calls `POST /payments/:id/cash-confirm`; button replaced by confirmed state; customer notified | ✅ Done |
| S4-03 | Stripe redirect handling — customer side | Jei | `src/app/(customer)/jobs/[id]/page.jsx` | When customer returns from Stripe with `?payment=success`, page detects query param and shows payment confirmed banner; polls `GET /payments/:id` to reflect updated status; no duplicate payment attempt possible | ⏸ Deferred |

---

### 🟡 MEDIUM PRIORITY

| Task ID | Task | Owner | File(s) | Definition of Done | Status |
|---------|------|-------|---------|-------------------|--------|
| S4-04 | Worker profile edit — skills & bio | Jei | `src/app/(worker)/worker/profile/page.jsx` | Worker can update their name, skills (multi-select checkboxes for categories), and optional bio; calls `PATCH /users/me` + `PATCH /workers/me`; saved state reflects on next load | ✅ Done |
| S4-05 | Transactional email via Resend | Lau | `backend/src/services/email.service.js`, `backend/src/services/notifications.service.js` | Resend SDK installed; emails sent on: job accepted (customer), job completed (worker + customer), payment confirmed (worker + customer); no secrets hardcoded; graceful failure (log only, don't crash) | ⏸ Deferred |
| S4-06 | Admin transactions page | Jei | `src/app/(admin)/admin/payments/page.jsx`, `backend/src/routes/admin.routes.js` | `/admin/payments` lists all payments with: job ID, customer, worker, amount, method, status, date; filterable by status; linked from admin nav | ✅ Done |

---

### 🟢 LOW PRIORITY

| Task ID | Task | Owner | File(s) | Definition of Done | Status |
|---------|------|-------|---------|-------------------|--------|
| S4-07 | Add `GET /workers/me` endpoint for worker self-profile | Lau | `backend/src/routes/workers.routes.js` | `GET /workers/me` returns authenticated worker's own profile (same shape as `GET /workers/:id`); used by profile edit page | ✅ Done |
| S4-08 | QA pass — payment loop, email, profile edit, admin transactions | Alex | All Sprint 4 files | Manual test: Stripe card payment end-to-end, cash confirm flow, email delivery check (inbox), profile edit persists, admin transactions visible; 0 console errors | ✅ Done |

---

## Dependency Chain

```
B-12 + B-13 (Stripe env vars + webhook URL)
  └── S4-01 (Stripe live test — Irwin)
        └── S4-03 (Stripe redirect handling)

S4-02 (Cash confirm UI) — independent (backend already exists)

B-14 (Resend API key)
  └── S4-05 (Email service — Lau)

S4-07 (GET /workers/me)
  └── S4-04 (Worker profile edit — needs self-profile endpoint)

S4-06 (Admin transactions) — independent

S4-01 + S4-02 + S4-03 + S4-04 + S4-05 + S4-06
  └── S4-08 (QA — runs last)
```

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Stripe webhook signature mismatch in production | High | Must use `express.raw()` before JSON body parser on webhook route (already done); use exact webhook secret from Stripe dashboard |
| Worker has no payment ID to call cash-confirm | Medium | Fetch payment via `GET /payments?job_id=:id` or include payment in `GET /jobs/:id` response |
| Resend email rate limits or bounces | Low | Log failures silently; don't block notification insert on email failure |
| Worker profile edit overwrites skills if sent empty | Low | Send skills only if changed; validate non-empty array before PATCH |

---

## Assignment Summary

| Owner | Tasks |
|-------|-------|
| **Irwin** | Resolve B-12, B-13, B-14; S4-01 (Stripe live config + test) |
| **Lau** | S4-05 (Resend email service), S4-07 (GET /workers/me endpoint) |
| **Jei** | S4-02, S4-03, S4-04, S4-06 |
| **Alex** | S4-08 (QA — runs last) |

---

## Suggested Execution Order (Jei)

`S4-03 → S4-02 → S4-04 → S4-06`

---

## Notes

- Stripe backend code is complete (checkout session, webhook handler, cash confirm, refund). Sprint 4 is about wiring the live keys and the missing UI pieces.
- Cash confirm: the worker job detail page needs to fetch the payment for the job on mount. Best approach: include `payment` in `GET /jobs/:id` join, or add `GET /payments?job_id=:id` admin/worker endpoint.
- Resend: install `resend` package in backend (`npm install resend`). Use `RESEND_API_KEY` env var. Always `catch` and log email errors — never let email failure break the notification insert.
- Worker profile edit needs a `PATCH /workers/me` endpoint to update `skills` and any bio/profile fields on the `workers` table. Check if this exists; if not, Lau adds it alongside S4-07.
- Admin transactions page needs `GET /admin/payments` — add to `admin.routes.js` with pagination and status filter.
