import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import portfolioRoutes from './routes/portfolios.js';
import stockRoutes from './routes/stocks.js';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 8080;

// CORS configuration
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());

// Make prisma available to routes
app.locals.prisma = prisma;

// Routes
app.use('/api/portfolios', portfolioRoutes);
app.use('/api/stocks', stockRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

async function main() {
  await prisma.$connect();
  console.log('Connected to database');

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
