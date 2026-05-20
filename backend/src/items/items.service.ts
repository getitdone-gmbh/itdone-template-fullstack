import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.item.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(userId: string, title: string) {
    if (!title || typeof title !== 'string') {
      throw new BadRequestException('Title is required');
    }
    return this.prisma.item.create({ data: { title, userId } });
  }

  async remove(userId: string, id: string) {
    const result = await this.prisma.item.deleteMany({ where: { id, userId } });
    if (result.count === 0) {
      throw new NotFoundException('Item not found');
    }
    return { message: 'Item deleted' };
  }
}
