import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface CreateProjectDto {
  name: string;
  description?: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
}

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.project.findMany({
      where: { userId },
      include: {
        tasks: true,
        timeEntries: {
          where: { userId },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        tasks: true,
        timeEntries: {
          where: { userId },
        },
      },
    });

    if (!project || project.userId !== userId) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async create(userId: string, createDto: CreateProjectDto) {
    if (!createDto.name || typeof createDto.name !== 'string') {
      throw new BadRequestException('Name is required');
    }

    return this.prisma.project.create({
      data: {
        userId,
        name: createDto.name,
        description: createDto.description,
      },
      include: {
        tasks: true,
      },
    });
  }

  async update(
    userId: string,
    id: string,
    updateDto: UpdateProjectDto,
  ) {
    const existing = await this.prisma.project.findUnique({ where: { id } });

    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Project not found');
    }

    return this.prisma.project.update({
      where: { id },
      data: {
        name: updateDto.name,
        description: updateDto.description,
      },
      include: {
        tasks: true,
      },
    });
  }

  async remove(userId: string, id: string) {
    const result = await this.prisma.project.deleteMany({
      where: { id, userId },
    });

    if (result.count === 0) {
      throw new NotFoundException('Project not found');
    }

    return { message: 'Project deleted' };
  }
}
