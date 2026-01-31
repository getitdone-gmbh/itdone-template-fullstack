# Aktien Portfolio Verwaltung

Eine Webanwendung zur Verwaltung von Aktienportfolios mit React Frontend und Node.js/Express Backend.

## Features

- **Portfolio-Verwaltung**: Erstellen und verwalten mehrerer Portfolios
- **Aktien kaufen/verkaufen**: Mit automatischer Durchschnittspreisberechnung
- **Live-Kurse**: Aktuelle Aktienkurse von Yahoo Finance (mit Caching)
- **Dashboard**: Ubersicht uber Gesamtwert, Gewinn/Verlust und Verteilung
- **Charts**: Visualisierung der Portfolio-Allokation und Performance
- **Transaktionshistorie**: Alle Kauf- und Verkaufstransaktionen

## Tech Stack

### Frontend
- React 18 mit Vite
- TanStack Query (React Query) fur API-Calls
- Tailwind CSS fur Styling
- Recharts fur Diagramme
- TypeScript

### Backend
- Node.js mit Express
- Prisma ORM
- PostgreSQL Datenbank
- TypeScript

## Projektstruktur

```
stock-portfolio/
├── itdone.yaml           # Deployment-Konfiguration
├── frontend/             # React Frontend
│   ├── src/
│   │   ├── api/          # API Client
│   │   ├── components/   # React Komponenten
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
├── backend/              # Express Backend
│   ├── prisma/
│   │   └── schema.prisma # Datenbank-Schema
│   ├── src/
│   │   ├── routes/       # API Routes
│   │   ├── services/     # Business Logic
│   │   └── index.ts
│   └── package.json
└── README.md
```

## Installation

### Voraussetzungen
- Node.js 18+
- PostgreSQL Datenbank

### Backend Setup

```bash
cd backend

# Dependencies installieren
npm install

# Umgebungsvariablen konfigurieren
cp .env.example .env
# DATABASE_URL in .env anpassen

# Prisma Client generieren
npm run db:generate

# Datenbank-Schema anwenden
npm run db:push

# Server starten (Port 8080)
npm run dev
```

### Frontend Setup

```bash
cd frontend

# Dependencies installieren
npm install

# Development Server starten (Port 3000)
npm run dev
```

## API Endpoints

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| GET | `/api/portfolios` | Alle Portfolios abrufen |
| POST | `/api/portfolios` | Neues Portfolio erstellen |
| GET | `/api/portfolios/:id` | Portfolio mit Positionen und aktuellen Werten |
| POST | `/api/portfolios/:id/buy` | Aktie kaufen |
| POST | `/api/portfolios/:id/sell` | Aktie verkaufen |
| GET | `/api/portfolios/:id/transactions` | Transaktionshistorie |
| DELETE | `/api/portfolios/:id` | Portfolio loschen |
| GET | `/api/stocks/:symbol/quote` | Aktueller Aktienkurs |

## Datenbank-Schema

- **User**: Benutzer mit E-Mail und Name
- **Portfolio**: Gehorrt einem User, hat einen Namen
- **Position**: Aktienposition in einem Portfolio (Symbol, Anteile, Durchschnittspreis)
- **Transaction**: Kauf- oder Verkaufstransaktion

## Aktienkurse

Die Anwendung nutzt die Yahoo Finance API (v8) um aktuelle Aktienkurse abzurufen. Die Kurse werden fur 5 Minuten gecacht, um API-Limits zu vermeiden.

Untersttutzte Symbole:
- US-Aktien: AAPL, MSFT, GOOGL, AMZN, etc.
- Deutsche Aktien: SAP.DE, BMW.DE, etc.
- ETFs: SPY, QQQ, etc.
