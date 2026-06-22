# Agent instructions

Read this first, every time. It describes how THIS app is built so you don't
have to re-discover it. Follow these conventions instead of inventing your own.
Do **not** rewrite or delete this file — it is guidance, not a scratchpad
(use `CLAUDE.md` for your own notes).

## Stack & layout
- **frontend/** — Next.js 14 (App Router) + React 18 + Tailwind + React Query, listens on **:3000**.
  - Pages live in `frontend/app/<route>/page.tsx`. Shared providers in `frontend/app/providers.tsx`.
  - Reusable code in `frontend/lib/`.
- **backend/** — NestJS 11 + Prisma, listens on **:8080**. REST under `/api`.
  - Feature modules under `backend/src/<feature>/` (controller + service + module), wired into `backend/src/app.module.ts`. See `src/items/` as the reference example.
  - DB access goes through `backend/src/prisma.service.ts`. The schema is `backend/prisma/schema.prisma`.
- **itdone.yaml** is the deploy contract (services, ports, addons). Treat it as fixed unless the task is specifically about deployment topology.

## How to add things
- **New API resource:** copy the shape of `src/items/` — a module with controller + service, register it in `app.module.ts`. Add the model to `prisma/schema.prisma` (migrations are generated at build via `prisma db push`; never hand-edit files in `prisma/migrations/`).
- **New page:** add `frontend/app/<route>/page.tsx`. Fetch data with React Query; call the backend at the injected API base URL — do not hardcode `localhost`.
- **A dependency:** run `npm install <pkg>` (via run_command, with the right `cwd` of `backend` or `frontend`). Do NOT hand-edit `package.json` dependencies, and do not commit lockfiles or `node_modules`.

## Auth (Keycloak, already wired) — and auth vs. data
- Frontend uses `react-oidc-context` (configured in `app/providers.tsx`, callback at `app/callback/`).
- Backend validates the JWT via `@nestjs/passport` (`src/auth/`).
- **Authentication is Keycloak's job. NEVER build your own:** no password fields,
  no `bcrypt`/password hashing, no login/registration/session endpoints, no
  "users" table for credentials. The current user comes from the validated JWT.
- **Auth ≠ domain data.** Managing *records* of people (employees, customers,
  members — "Mitarbeiterverwaltung" etc.) is normal CRUD: model them as plain
  domain entities with profile fields (name, role, etc.) — **without** passwords
  or login. Link them to the authenticated Keycloak user by id/email if needed.
- OIDC + DB credentials arrive as env vars from the attached addons; read them
  from `process.env`, don't invent or hardcode them.

## Hard rules
- The web process MUST listen on `$PORT` (defaults: 3000 / 8080) — don't change the ports in `itdone.yaml`.
- `DATABASE_URL` comes from the postgres addon — never hardcode a connection string.
- Keep it MVP: no placeholder/TODO stubs, implement what the story asks, don't over-engineer.
- Each app gets its own Keycloak realm + Postgres — don't add a second auth/db layer.
