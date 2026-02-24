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
