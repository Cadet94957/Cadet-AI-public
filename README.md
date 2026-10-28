# Cadet

**An AI-powered onboarding platform that gets new hires up to speed faster, with answers grounded in your own company documents.**

The first weeks at a new job are full of questions: *Where's the PTO policy?
Who do I ask about payroll? What compliance training do I need?* Cadet gives
every new hire a guided onboarding path and an AI assistant that has read your
company's documents. Managers can see exactly where each person is and what
they're stuck on.

---

## For new employees

- **A guided, step-by-step onboarding journey** covering the company, your
  team, benefits and payroll, required compliance training, and setting up
  your profile.
- **An AI assistant on every step.** Ask anything in plain English and get an
  answer drawn from your company's real documents, with **citations** linking
  back to the source so you can read the original.
- **The assistant can also take action.** It can propose next steps such as
  filing a ticket, assigning an onboarding buddy, scheduling a check-in, or
  opening a link. Nothing happens until the employee approves it.
- **Honest when it doesn't know.** If the documents don't cover a question,
  Cadet says so rather than guessing.
- **Study materials on demand.** Cadet generates presentations (PowerPoint or
  PDF) and study notes on any topic, built from your company's own content.

## For managers and HR

- **Team progress at a glance:** each new hire's current step, percentage
  complete, and recent activity, plus team-wide summary stats.
- **See what new hires are asking.** The questions people put to the AI
  assistant are a direct signal of gaps in your onboarding material.
- **A guided setup** for your organization: departments, job titles, roles,
  essential documents, mentor/buddy matching, benefits, and compliance modules.
- **A document library** with categories, filters, and preview thumbnails.
  Upload files directly or import them from **Google Drive** or
  **Microsoft OneDrive**.
- **Employee management,** with separate employee and manager views and
  automatic routing based on each person's role.

## How the AI assistant works

```
  Company documents ──► split into sections, tagged by department and topic,
                        and indexed by meaning
                                  │
  Employee's question ────────────┤
                                  ▼
                  Find the most relevant passages
                  (aware of the employee's role and department)
                                  │
                                  ▼
            Answer with citations ── or say "I don't know"
            + optional suggested actions for the employee to approve
```

The assistant never answers from thin air. If no document is a good enough
match, it admits that instead of producing a confident-sounding guess.

## Built with

React and TypeScript on the front end, Node.js and Express on the back end,
and a PostgreSQL database. The AI runs on OpenAI's GPT-4o and embedding
models. Cadet runs on a single server by default, and an optional mode gives
each customer its own fully separate data store.

## Getting started

Setup instructions, configuration, the API reference, and the project layout
are in the **[developer guide](DEVELOPMENT.md)**.
