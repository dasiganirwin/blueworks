# Task Dispatch — Irwin (Product Owner / UX Designer)
**From:** Orchestrator Agent
**Date:** 2026-02-25
**Sprint:** Sprint 1 – UX Polish & Bug Fixes

---

## Your Actions

### 🚨 B-07 · Resolve Maps API Key Decision — URGENT
**Blocks:** S1-03 (Jei cannot start geocoding until this is resolved)

Decide between:
- **Google Maps Places API** — more accurate, higher cost, requires billing account
- **Mapbox Geocoding API** — cheaper, generous free tier, simpler integration

Once decided:
1. Provision the API key
2. Add it to `frontend/.env.local` as `NEXT_PUBLIC_MAPS_API_KEY=...`
3. Add it to `frontend/.env.example` (without the value)
4. Notify @jei so S1-03 can begin

**Deadline:** Resolve before end of day to avoid blocking Jei.

---

### S1-03 · Geocoding Integration (Co-own with Jei)
**File:** `src/app/(customer)/jobs/new/page.jsx:75–81`

Once the API key is provisioned, review Jei's implementation and confirm:
- Address autocomplete feels natural on mobile
- Confirmed address is shown clearly before job submission
- Fallback behavior is graceful if location permission is denied

**DoD:** No hardcoded coordinates; real geocoded lat/lng sent to backend.

---

### S1-20 · Tailwind Color Tokens (Co-own with Jei)
**File:** `frontend/tailwind.config.js`

Define the official BlueWork color palette for semantic states:
- `success` — e.g., green shade
- `warning` — e.g., amber shade
- `danger` — e.g., red shade
- `gray` variants as needed

Share the hex values with Jei so they can apply tokens consistently across the app.

---

## Notes
- No code changes required from you — your role is decisions + API key provisioning.
- B-07 is the only item currently blocking Sprint 1 execution.
- Review Jei's completed work before Alex runs the QA audit (S1-21).
