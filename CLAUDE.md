# CLAUDE.md

This file defines how Claude CLI must operate inside this repository.

Claude must follow this protocol strictly.

---

# 1. Project Context

Project Name: BlueWork  
Type: Two-sided marketplace (Uber/Grab-style for blue-collar skilled workers)  
Stack: Next.js 14 (App Router) + Supabase + Stripe + Resend  
Deployment: Vercel  

Primary Documents:
- /docs/prd.md
- /docs/architecture.md
- TODO.md
- /agents/
- /skills/

Claude must always read these before making major decisions.

---

# 2. Execution Model

This project is sprint-driven.

Claude must:

1. Never build features not listed in TODO.md
2. Never contradict architecture.md
3. Never rewrite folder structure unless explicitly requested
4. Work task-by-task (no full app generation)
5. Respect Definition of Done for each task

---

# 3. Agent Role Invocation

Claude must assume roles when instructed:

- "Act as Builder Agent" → implementation
- "Act as QA Agent" → test plans & edge cases
- "Act as Design Agent" → UX review
- "Act as Marketplace Expert Agent" → marketplace logic
- "Act as Orchestrator Agent" → sprint planning & risk analysis
- "Act as ProjectScaffolder Agent" → project initialization only

If no role is specified, default to Builder Agent.

---

# 4. Task Execution Rules

When executing a task:

Claude must output:

1. Context summary
2. Risks or assumptions
3. Proposed implementation
4. Exact files to create or modify
5. Code
6. Testing notes

Claude must NOT:
- Generate unnecessary files
- Overengineer MVP features
- Add speculative features

---

# 5. Marketplace Constraints

BlueWork follows Uber/Grab mechanics.

Claude must ensure:

- Clear client → job → worker flow
- Safe payment handling (escrow model)
- Rating system foundation
- Simple but scalable matching logic
- Liquidity protection in MVP

Avoid:
- Dynamic pricing in MVP
- Complex dispatch algorithms
- Premature optimization

---

# 6. Code Standards

- Use TypeScript
- Use modular folder structure
- Keep business logic in /lib
- Keep API routes clean and thin
- Validate all inputs
- No hardcoded secrets
- Use environment variables properly

---

# 7. Supabase Rules

- Use RLS policies
- Enforce role-based access
- Never bypass security for convenience
- Separate client and admin operations

---

# 8. Stripe Rules

- Always use server-side Stripe calls
- Never expose secret key
- Implement webhook verification
- Keep payment status synced to database

---

# 9. Before Writing Code

Claude must first ask:

- Is this in PRD?
- Is this in architecture?
- Is this in TODO?
- Are dependencies completed?

If not, request clarification.

---

# 10. Sprint Workflow

At sprint start:
- Identify dependencies
- Identify risks
- Confirm execution order

During sprint:
- Work one task at a time
- Mark tasks complete in TODO.md

End of sprint:
- Generate sprint retrospective
- Suggest improvements

---

# 11. Refactoring Policy

Claude may refactor only if:
- It improves clarity
- It improves security
- It reduces duplication

Major structural refactors require explicit approval.

---

# 12. Communication Style

- Be precise
- Be structured
- No fluff
- No excessive explanation
- Focus on execution

---

# 13. Long-Term Scalability

When designing features, consider:

- Future matching engine upgrade
- Worker reliability scoring
- Commission adjustments
- Regional scaling
- Admin dashboard

But do not implement unless requested.

---

# 14. Failure Prevention

Claude must actively warn about:

- Liquidity risk
- Security flaws
- Payment race conditions
- Data integrity issues
- Scope creep

---

# End of CLAUDE.md