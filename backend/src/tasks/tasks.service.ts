import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface CreateTaskDto {
  name: string;
  description?: string;
  projectId: string;
}

export interface UpdateTaskDto {
  name?: string;
  description?: string;
  projectId?: string;
}

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, projectId?: string) {
    const where: any = { project: { userId } };
    
    if (projectId) {
      where.projectId = projectId;
    }

    return this.prisma.task.findMany({
      where,
      include: {
        project: true,
        timeEntries: {
          where: { userId },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
        timeEntries: {
          where: { userId },
        },
      },
    });

    if (!task || task.project.userId !== userId) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async create(userId: string, createDto: CreateTaskDto) {
    if (!createDto.name || typeof createDto.name !== 'string') {
      throw new BadRequestException('Name is required');
    }

    if (!createDto.projectId) {
      throw new BadRequestException('Project ID is required');
    }

    // Verify project exists and belongs to user
    const project = await this.prisma.project.findUnique({
      where: { id: createDto.projectId },
    });

    if (!project || project.userId !== userId) {
      throw new NotFoundException('Project not found');
    }

    return this.prisma.task.create({
      data: {
        name: createDto.name,
        description: createDto.description,
        projectId: createDto.projectId,
      },
      include: {
        project: true,
      },
    });
  }

  async update(
    userId: string,
    id: string,
    updateDto: UpdateTaskDto,
  ) {
    const existing = await this.prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existing || existing.project.userId !== userId) {
      throw new NotFoundException('Task not found');
    }

    // If projectId is being updated, verify it exists and belongs to user
    if (updateDto.projectId && updateDto.projectId !== existing.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: updateDto.projectId },
      });
      if (!project || project.userId !== userId) {
        throw new NotFoundException('Project not found');
      }
    }

    return this.prisma.task.update({
      where: { id },
      data: {
        name: updateDto.name,
        description: updateDto.description,
        projectId: updateDto.projectId,
      },
      include: {
        project: true,
      },
    });
  }

  async remove(userId: string, id: string) {
    const existing = await this.prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existing || existing.project.userId !== userId) {
      throw new NotFoundException('Task not found');
    }

    const result = await this.prisma.task.deleteMany({
      where: { id },
    });

    if (result.count === 0) {
      throw new NotFoundException('Task not found');
    }

    return { message: 'Task deleted' };
  }
}
