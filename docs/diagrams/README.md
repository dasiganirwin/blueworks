# Diagrams Folder

This folder contains visual diagrams for the BlueWork project.  
These diagrams help illustrate architecture, workflows, agent coordination, and UI/UX structure.

---

## Recommended Diagrams

1. **System Architecture**
   - Shows the overall architecture of the BlueWork app.
   - Includes:
     - Next.js frontend
     - Supabase backend
     - Stripe payment integration
     - Resend email notifications
     - Orchestrator & subagent communication

2. **Agent Workflow**
   - Illustrates how Orchestrator communicates with Builder, Design, QA, and Notification Agents.
   - Shows updates flowing to/from human team members and Slack.
   - Can be based on the textual workflow diagram in Sprint 1 TODO.md.

3. **Slack & Notifications Flow**
   - Shows how Slack and Resend notifications are used in the system.
   - Highlights human-agent communication and task tracking.

4. **UI/UX Wireframes**
   - Optional: include Figma or exported wireframe screenshots for Job Listings, Worker Profiles, Task Assignment pages.

5. **Sprint Workflow**
   - Optional: visual representation of Sprint 1 or future sprints.
   - Includes task assignment between agents and team members.

---

## File Naming Convention

- Use descriptive filenames:  
  - `architecture.png`, `agent-workflow.svg`, `slack-flow.png`, `job-listing-wireframe.png`
- Include version or date if updated:  
  - `architecture_v1.png` or `agent-workflow_2026-02-23.svg`

---

## Notes

- All diagrams should be referenced in PRD, architecture.md, or Sprint documentation.
- Keep diagrams updated as the system evolves.
- Prefer vector formats (SVG) for clarity; PNGs are acceptable for screenshots.