# Clairio Mission Control

Clairio Mission Control is a shared operations app for Clairio AI. The first release is designed as a ClickUp-connected mission control center that makes ownership, delivery risk, workload, and trend reporting visible across the company. The long-term path is to replace ClickUp gradually with a native operating system for task execution and planning.

## What Is In This Repo

- `app/` - Next.js App Router pages
- `components/` - dashboard shell and reusable UI primitives
- `lib/` - shared utilities and starter data
- `prisma/` - initial schema and seed data
- `docs/` - product, architecture, and delivery planning
- `.github/workflows/ci.yml` - GitHub Actions lint workflow

## Getting Started

1. Install dependencies with `npm install`
2. Copy `.env.example` to `.env`
3. Set `DATABASE_URL` and ClickUp credentials
4. Generate the Prisma client with `npm run db:generate`
5. Push the schema with `npm run db:push`
6. Optionally seed sample data with `npm run db:seed`
7. Start the app with `npm run dev`

## MVP Intent

The first release should answer:

- Who is working on what right now?
- What work is blocked, overdue, or at risk?
- How is the team trending against plan?
- Are we burning down work at an acceptable pace?

The app should launch as a read-only ClickUp-connected control center, then gradually replace ClickUp workflows after reporting and daily usage are trusted.

## Planning Docs

- `docs/prd.md` - product requirements and MVP scope
- `docs/architecture.md` - technical architecture, integrations, and data model
- `docs/backlog.md` - phased delivery plan with epics and milestones
