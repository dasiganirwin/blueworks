# BlueWork Project – Master Checklist

This checklist consolidates all project files, folders, agents, team members, and sprint tasks for the BlueWork MVP.

---

## 1. Docs

### Files
- [ ] `/docs/brd.md` – Business Requirements Document
- [ ] `/docs/prd.md` – Product Requirements Document
- [ ] `/docs/architecture.md` – System architecture & agent workflow
- [ ] `/docs/diagrams/README.md` – Diagram guidelines

### Folder
- [ ] `/docs/diagrams/` – Store architecture, workflow, Slack, UI/UX diagrams

---

## 2. Skills

- [ ] `/skills/AGENTS.md` – Agents & subagents overview
- [ ] `/skills/stack.md` – Technology stack
- [ ] `/skills/components.md` – Frontend component library
- [ ] `/skills/api.md` – API endpoints
- [ ] `/skills/git.md` – Git workflow & conventions
- [ ] `/skills/testing.md` – Testing & QA strategy

---

## 3. Agents

- [ ] `/agents/orchestrator.md` – Orchestrator responsibilities
- [ ] `/agents/builder.md` – Builder Agent responsibilities
- [ ] `/agents/design.md` – Design Agent responsibilities
- [ ] `/agents/qa.md` – QA Agent responsibilities
- [ ] Optional: Notification Agent & Payment Agent documentation (future)

---

## 4. Team Members

- [ ] `/team/team-member-irwin-dasigan.md` – Product Owner / UX Designer
- [ ] `/team/team-member-alex.md` – Frontend Developer
- [ ] `/team/team-member-jane.md` – Backend Developer
- [ ] `/team/team-member-bob.md` – QA Engineer
- [ ] Additional team members as needed

---

## 5. Project Management

- [ ] `TODO.md` – Sprint 0 & Sprint 1 tasks
- [ ] `.env.example` – Placeholder keys for Supabase, Stripe, Resend
- [ ] `/agent-workspace/` – Temporary workspace for agents

---

## 6. Sprint 1 Tasks (MVP)

**Project Setup**
- [ ] Scaffold Next.js + Supabase project structure (Builder Agent)
- [ ] Confirm PRD and wireframes (Irwin)

**Frontend**
- [ ] Build components: Button, Input, Modal, Card, Dropdown (Alex)
- [ ] Integrate dummy data (Alex)
- [ ] Design suggestions (Design Agent)

**Backend**
- [ ] Setup database tables (Jane)
- [ ] Implement API endpoints (Jane & Builder Agent)
- [ ] Connect frontend to APIs (Jane & Alex)

**QA & Testing**
- [ ] Manual test cases (Bob)
- [ ] Automated tests (QA Agent)

**Notifications**
- [ ] Slack & Email notifications (Notification Agent)
- [ ] Verify notification flows (Irwin)

**Deployment**
- [ ] Deploy frontend to Vercel (Builder Agent)
- [ ] Verify MVP workflow (Irwin)

---

## 7. Optional Enhancements

- Add more UI components to `components.md`
- Expand diagrams in `/docs/diagrams/`
- Include CHANGELOG.md for version tracking
- Document additional subagents as needed