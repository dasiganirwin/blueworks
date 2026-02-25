# Task Dispatch — Alex (QA Engineer)
**From:** Orchestrator Agent
**Date:** 2026-02-25
**Sprint:** Sprint 1 – UX Polish & Bug Fixes

---

## Your Task

### S1-21 · QA Audit — Lighthouse + axe Accessibility Pass
**Priority:** Runs LAST — after all HIGH and MEDIUM items are marked Done by Jei and Lau.
**Status:** On Hold until notified by Orchestrator.

---

## When You're Called In

Run the following checks across all pages:

### Accessibility (axe DevTools)
- Install axe DevTools browser extension
- Run on: Login, Register, Verify OTP, Customer Dashboard, Job Listing, Job Detail, New Job, Worker Dashboard, Worker Job Detail, Worker Earnings, Admin Dashboard, Admin Workers, Admin Disputes
- **Target:** 0 critical violations
- Report any remaining issues with file + line reference

### Lighthouse Audit
- Run Lighthouse (Performance + Accessibility tabs) on the above pages
- **Target:** Accessibility score ≥ 90 on all pages
- Log scores per page

### WCAG Color Contrast
- Verify all text elements meet WCAG AA (4.5:1 normal text, 3:1 large text)
- Specifically check: Badge variants, nav links, error messages, button labels

### Devices to Test
- [ ] iPhone SE (375px) — mobile nav, form usability
- [ ] iPhone 14 (390px)
- [ ] Desktop 1280px+

### Manual Flows to Validate
- [ ] Customer: Register → OTP → Post Job → Cancel Job (should work after S1-01)
- [ ] Customer: Post Job → Pay (card + cash flows)
- [ ] Worker: Accept → En Route → Start → Complete job
- [ ] Admin: Approve worker → View worker profile → View dispute → Resolve dispute
- [ ] Keyboard-only navigation through all modals and forms (Tab, Enter, ESC)

---

## Output Required
Deliver a QA report to the Orchestrator with:
1. Lighthouse scores per page
2. axe violations list (if any)
3. Manual flow pass/fail results
4. List of any new bugs found (with file + line reference)

---

## Notes
- Do NOT start until Orchestrator confirms all HIGH + MEDIUM sprint items are Done.
- Coordinate with @lau to confirm the cancel job fix (S1-01) is live before testing that flow.
- Log bugs as new tasks in `TODO.md` under a "Sprint 1 Bug Fixes" section.
