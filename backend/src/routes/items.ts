import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();

function getPrisma(req: Request): PrismaClient {
  return req.app.locals.prisma as PrismaClient;
}

// GET /api/items - List all items
router.get('/', async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const items = await prisma.item.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// POST /api/items - Create an item
router.post('/', async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const item = await prisma.item.create({ data: { title } });
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// DELETE /api/items/:id - Delete an item
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma(req);
    const id = req.params.id as string;
    await prisma.item.delete({ where: { id } });
    res.json({ message: 'Item deleted' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

export default router;
