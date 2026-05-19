import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function getPrisma(req: Request): PrismaClient {
  return req.app.locals.prisma as PrismaClient;
}

router.use(requireAuth);

// GET /api/items - List items for the current user
router.get('/', async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const items = await prisma.item.findMany({
      where: { userId: req.user!.sub },
      orderBy: { createdAt: 'desc' },
    });
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// POST /api/items - Create an item owned by the current user
router.post('/', async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const item = await prisma.item.create({
      data: { title, userId: req.user!.sub },
    });
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// DELETE /api/items/:id - Delete an item the current user owns
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const id = req.params.id as string;
    const result = await prisma.item.deleteMany({
      where: { id, userId: req.user!.sub },
    });
    if (result.count === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ message: 'Item deleted' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

export default router;
