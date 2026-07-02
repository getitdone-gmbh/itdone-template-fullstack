# ITDone Fullstack Template

Minimal CRUD reference app for deploying on ITDone Cloud. One resource
(`Item`), Keycloak auth, deployed via `itdone.yaml`.

- **frontend/** — Next.js 14 (App Router) + React 18 + Tailwind + React Query, port **3000**
- **backend/** — NestJS 11 + Prisma + PostgreSQL, REST under `/api`, port **8080**
- **Auth** — Keycloak (OIDC) via `react-oidc-context` on the frontend, JWT validation on the backend

`AGENTS.md` is the source of truth for conventions — read it before extending the app.

## Local dev

```bash
# backend (port 8080)
cd backend && npm install
cp .env.example .env      # set DATABASE_URL + OIDC_ISSUER / OIDC_CLIENT_ID
npm run db:generate && npm run db:push && npm run dev

# frontend (port 3000)
cd frontend && npm install && npm run dev
```

## API

| Method | Endpoint         | Description     |
|--------|------------------|-----------------|
| GET    | /api/items       | List your items |
| POST   | /api/items       | Create an item  |
| DELETE | /api/items/:id   | Delete an item  |
| GET    | /api/config      | Public OIDC config |
| GET    | /health          | Health check    |

All `/api/items` routes require a valid Keycloak bearer token.
