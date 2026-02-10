# ITdone Fullstack Template

Minimal CRUD template for deploying on ITdone Cloud. Uses React + Vite + Tailwind (frontend), Express + Prisma + PostgreSQL (backend), and Zitadel auth via `itdone.yaml`.

## Structure

```
├── itdone.yaml              # ITdone Cloud deployment config (Postgres, Zitadel auth)
├── frontend/                # React + Vite + Tailwind
│   ├── src/
│   │   ├── api/client.ts    # API client with Item interface
│   │   ├── App.tsx          # Single-page items list
│   │   └── main.tsx         # Entry point with React Query
│   └── package.json
├── backend/                 # Express + Prisma
│   ├── prisma/schema.prisma # Item model
│   ├── src/
│   │   ├── routes/items.ts  # CRUD routes (GET, POST, DELETE)
│   │   └── index.ts         # Express server setup
│   └── package.json
└── README.md
```

## Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env   # edit DATABASE_URL if needed
npm run db:generate
npm run db:push
npm run dev            # starts on port 8080
```

### Frontend

```bash
cd frontend
npm install
npm run dev            # starts on port 3000
```

## API

| Method | Endpoint        | Description      |
|--------|-----------------|------------------|
| GET    | /api/items      | List all items   |
| POST   | /api/items      | Create an item   |
| DELETE | /api/items/:id  | Delete an item   |
| GET    | /health         | Health check     |
