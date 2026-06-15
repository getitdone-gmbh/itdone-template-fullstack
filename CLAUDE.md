# Project Context

## Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: NestJS 11, Prisma ORM, PostgreSQL
- **Auth**: Currently OIDC-based (external provider), needs local auth added

## Architecture
- Frontend: `frontend/` - Next.js app with OIDC authentication via react-oidc-context
- Backend: `backend/` - NestJS API with JWT strategy for OIDC
- Database: PostgreSQL with Prisma migrations

## Current State
- Basic Items CRUD working with OIDC authentication
- Prisma schema has only `Item` model
- Frontend uses external OIDC provider for auth
- API endpoints: `/api/items` (CRUD), `/config` (OIDC config)

## Key Components
- **Backend**: 
  - `app.module.ts` - Main module with PassportModule
  - `auth/jwt.strategy.ts` - OIDC JWT validation
  - `items/` - Sample CRUD module
  - `prisma.service.ts` - Prisma client
- **Frontend**:
  - `app/client-providers.tsx` - OIDC AuthProvider + React Query
  - `app/page-content.tsx` - Main page with items list
  - `lib/api.ts` - API client factory

## Notes
- Project uses external OIDC for auth (Keycloak, Auth0, etc.)
- Need to add local user registration/login with JWT
- Will need to extend Prisma schema with User model
- Will need to add auth endpoints (register, login, profile, password reset)
