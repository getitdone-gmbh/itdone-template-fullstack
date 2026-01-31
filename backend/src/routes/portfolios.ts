import { Router, Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { getMultipleQuotes } from '../services/stockService.js';

const router = Router();

function getPrisma(req: Request): PrismaClient {
  return req.app.locals.prisma as PrismaClient;
}

// GET /api/portfolios - Get all portfolios
router.get('/', async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const portfolios = await prisma.portfolio.findMany({
      include: {
        positions: true,
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    res.json(portfolios);
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    res.status(500).json({ error: 'Failed to fetch portfolios' });
  }
});

// POST /api/portfolios - Create a new portfolio
router.post('/', async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const { name, userId } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Create default user if userId not provided
    let user;
    if (!userId) {
      user = await prisma.user.upsert({
        where: { email: 'default@example.com' },
        update: {},
        create: {
          email: 'default@example.com',
          name: 'Default User'
        }
      });
    }

    const portfolio = await prisma.portfolio.create({
      data: {
        name,
        userId: userId || user!.id
      },
      include: {
        positions: true,
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.status(201).json(portfolio);
  } catch (error) {
    console.error('Error creating portfolio:', error);
    res.status(500).json({ error: 'Failed to create portfolio' });
  }
});

// Type for portfolio with positions
type PortfolioWithPositions = Prisma.PortfolioGetPayload<{
  include: {
    positions: {
      include: {
        transactions: true
      }
    },
    user: {
      select: { id: true, name: true, email: true }
    }
  }
}>;

// GET /api/portfolios/:id - Get portfolio with positions and current values
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const id = req.params.id as string;

    const portfolio = await prisma.portfolio.findUnique({
      where: { id },
      include: {
        positions: {
          include: {
            transactions: {
              orderBy: { date: 'desc' }
            }
          }
        },
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    }) as PortfolioWithPositions | null;

    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    // Get current quotes for all positions
    const symbols = portfolio.positions.map((p) => p.symbol);
    const quotes = await getMultipleQuotes(symbols);

    // Calculate values for each position
    const positionsWithValues = portfolio.positions.map((position) => {
      const quote = quotes.get(position.symbol.toUpperCase());
      const currentPrice = quote?.price || position.avgPrice;
      const currentValue = position.shares * currentPrice;
      const costBasis = position.shares * position.avgPrice;
      const gainLoss = currentValue - costBasis;
      const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

      return {
        ...position,
        currentPrice,
        currentValue,
        costBasis,
        gainLoss,
        gainLossPercent,
        quote
      };
    });

    // Calculate portfolio totals
    const totalValue = positionsWithValues.reduce((sum: number, p) => sum + p.currentValue, 0);
    const totalCostBasis = positionsWithValues.reduce((sum: number, p) => sum + p.costBasis, 0);
    const totalGainLoss = totalValue - totalCostBasis;
    const totalGainLossPercent = totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0;

    res.json({
      ...portfolio,
      positions: positionsWithValues,
      summary: {
        totalValue,
        totalCostBasis,
        totalGainLoss,
        totalGainLossPercent,
        positionCount: positionsWithValues.length
      }
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

// POST /api/portfolios/:id/buy - Buy shares
router.post('/:id/buy', async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const id = req.params.id as string;
    const { symbol, shares, price, date } = req.body;

    if (!symbol || !shares || !price) {
      return res.status(400).json({ error: 'Symbol, shares, and price are required' });
    }

    if (shares <= 0 || price <= 0) {
      return res.status(400).json({ error: 'Shares and price must be positive' });
    }

    // Check if portfolio exists
    const portfolio = await prisma.portfolio.findUnique({ where: { id } });
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    // Find or create position
    const symbolUpper: string = symbol.toUpperCase();
    let position = await prisma.position.findUnique({
      where: {
        portfolioId_symbol: {
          portfolioId: id,
          symbol: symbolUpper
        }
      }
    });

    if (position) {
      // Update average price: ((old_shares * old_price) + (new_shares * new_price)) / total_shares
      const totalCost = (position.shares * position.avgPrice) + (shares * price);
      const totalShares = position.shares + shares;
      const newAvgPrice = totalCost / totalShares;

      position = await prisma.position.update({
        where: { id: position.id },
        data: {
          shares: totalShares,
          avgPrice: newAvgPrice
        }
      });
    } else {
      position = await prisma.position.create({
        data: {
          portfolioId: id,
          symbol: symbolUpper,
          shares,
          avgPrice: price
        }
      });
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        positionId: position.id,
        type: 'BUY',
        shares,
        price,
        date: date ? new Date(date) : new Date()
      }
    });

    res.status(201).json({
      position,
      transaction
    });
  } catch (error) {
    console.error('Error buying shares:', error);
    res.status(500).json({ error: 'Failed to buy shares' });
  }
});

// POST /api/portfolios/:id/sell - Sell shares
router.post('/:id/sell', async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const id = req.params.id as string;
    const { symbol, shares, price, date } = req.body;

    if (!symbol || !shares || !price) {
      return res.status(400).json({ error: 'Symbol, shares, and price are required' });
    }

    if (shares <= 0 || price <= 0) {
      return res.status(400).json({ error: 'Shares and price must be positive' });
    }

    // Find position
    const symbolUpper: string = symbol.toUpperCase();
    const position = await prisma.position.findUnique({
      where: {
        portfolioId_symbol: {
          portfolioId: id,
          symbol: symbolUpper
        }
      }
    });

    if (!position) {
      return res.status(404).json({ error: 'Position not found' });
    }

    if (position.shares < shares) {
      return res.status(400).json({ error: 'Not enough shares to sell' });
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        positionId: position.id,
        type: 'SELL',
        shares,
        price,
        date: date ? new Date(date) : new Date()
      }
    });

    // Update or delete position
    const remainingShares = position.shares - shares;

    if (remainingShares <= 0) {
      await prisma.position.delete({ where: { id: position.id } });
      res.json({
        position: null,
        transaction,
        message: 'Position closed'
      });
    } else {
      const updatedPosition = await prisma.position.update({
        where: { id: position.id },
        data: { shares: remainingShares }
      });
      res.json({
        position: updatedPosition,
        transaction
      });
    }
  } catch (error) {
    console.error('Error selling shares:', error);
    res.status(500).json({ error: 'Failed to sell shares' });
  }
});

// GET /api/portfolios/:id/transactions - Get all transactions for a portfolio
router.get('/:id/transactions', async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const id = req.params.id as string;

    const transactions = await prisma.transaction.findMany({
      where: {
        position: {
          portfolioId: id
        }
      },
      include: {
        position: {
          select: { symbol: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// DELETE /api/portfolios/:id - Delete a portfolio
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const id = req.params.id as string;

    await prisma.portfolio.delete({ where: { id } });
    res.json({ message: 'Portfolio deleted' });
  } catch (error) {
    console.error('Error deleting portfolio:', error);
    res.status(500).json({ error: 'Failed to delete portfolio' });
  }
});

export default router;
