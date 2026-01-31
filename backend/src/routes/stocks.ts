import { Router, Request, Response } from 'express';
import { getStockQuote } from '../services/stockService.js';

const router = Router();

// GET /api/stocks/:symbol/quote - Get current stock quote
router.get('/:symbol/quote', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    const quote = await getStockQuote(symbol);

    if (!quote) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    res.json(quote);
  } catch (error) {
    console.error('Error fetching stock quote:', error);
    res.status(500).json({ error: 'Failed to fetch stock quote' });
  }
});

export default router;
