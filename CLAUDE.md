# CLAUDE.md

Conventions for this template live in **`AGENTS.md`** — read that first; it is the
single source of truth for stack, layout, auth, and how to add resources.

Quick facts:
- **Frontend**: Next.js 14 (App Router) + React 18 + Tailwind, port 3000.
- **Backend**: NestJS 11 + Prisma + PostgreSQL, REST under `/api`, port 8080.
- **Auth**: Keycloak (OIDC) only — no local users/passwords. See the auth rules in `AGENTS.md`.
- **Scope**: one CRUD resource (`Item`) as the reference example. Keep it minimal and didactic.

Use this file for your own working notes; don't duplicate `AGENTS.md` here.
