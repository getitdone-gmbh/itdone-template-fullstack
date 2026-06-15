import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface CreateTimeEntryDto {
  projectId?: string;
  taskId?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  description?: string;
}

export interface UpdateTimeEntryDto {
  projectId?: string;
  taskId?: string;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  description?: string;
}

@Injectable()
export class TimeEntriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, filters?: {
    projectId?: string;
    taskId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = { userId };

    if (filters?.projectId) {
      where.projectId = filters.projectId;
    }

    if (filters?.taskId) {
      where.taskId = filters.taskId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.startTime = {};
      if (filters?.startDate) {
        where.startTime.gte = filters.startDate;
      }
      if (filters?.endDate) {
        where.startTime.lte = filters.endDate;
      }
    }

    return this.prisma.timeEntry.findMany({
      where,
      include: {
        project: true,
        task: true,
      },
      orderBy: { startTime: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const entry = await this.prisma.timeEntry.findUnique({
      where: { id },
      include: {
        project: true,
        task: true,
      },
    });

    if (!entry || entry.userId !== userId) {
      throw new NotFoundException('Time entry not found');
    }

    return entry;
  }

  async create(userId: string, createDto: CreateTimeEntryDto) {
    // Validate that if endTime is provided, it's after startTime
    if (createDto.endTime && createDto.startTime >= createDto.endTime) {
      throw new BadRequestException('endTime must be after startTime');
    }

    // Calculate duration if not provided
    let duration = createDto.duration;
    if (!duration && createDto.endTime) {
      duration = 
        (createDto.endTime.getTime() - createDto.startTime.getTime()) / 1000 / 60 / 60;
    }

    return this.prisma.timeEntry.create({
      data: {
        userId,
        projectId: createDto.projectId,
        taskId: createDto.taskId,
        startTime: createDto.startTime,
        endTime: createDto.endTime,
        duration,
        description: createDto.description,
      },
      include: {
        project: true,
        task: true,
      },
    });
  }

  async update(
    userId: string,
    id: string,
    updateDto: UpdateTimeEntryDto,
  ) {
    const existing = await this.prisma.timeEntry.findUnique({ where: { id } });

    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Time entry not found');
    }

    // Validate that if endTime is provided, it's after startTime
    const startTime = updateDto.startTime || existing.startTime;
    const endTime = updateDto.endTime || existing.endTime;
    
    if (endTime && startTime >= endTime) {
      throw new BadRequestException('endTime must be after startTime');
    }

    // Calculate duration if not provided but endTime is provided
    let duration = updateDto.duration;
    if (!duration && endTime) {
      duration = (endTime.getTime() - startTime.getTime()) / 1000 / 60 / 60;
    }

    return this.prisma.timeEntry.update({
      where: { id },
      data: {
        projectId: updateDto.projectId,
        taskId: updateDto.taskId,
        startTime,
        endTime,
        duration,
        description: updateDto.description,
      },
      include: {
        project: true,
        task: true,
      },
    });
  }

  async remove(userId: string, id: string) {
    const result = await this.prisma.timeEntry.deleteMany({
      where: { id, userId },
    });

    if (result.count === 0) {
      throw new NotFoundException('Time entry not found');
    }

    return { message: 'Time entry deleted' };
  }

  async getActiveTimer(userId: string) {
    return this.prisma.timeEntry.findFirst({
      where: {
        userId,
        endTime: null,
      },
      include: {
        project: true,
        task: true,
      },
    });
  }

  async getTimeEntriesByDate(userId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.timeEntry.findMany({
      where: {
        userId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        project: true,
        task: true,
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async getTimeEntriesByProject(userId: string, projectId: string) {
    return this.prisma.timeEntry.findMany({
      where: {
        userId,
        projectId,
      },
      include: {
        project: true,
        task: true,
      },
      orderBy: { startTime: 'desc' },
    });
  }

  async getTimeEntriesByTask(userId: string, taskId: string) {
    return this.prisma.timeEntry.findMany({
      where: {
        userId,
        taskId,
      },
      include: {
        project: true,
        task: true,
      },
      orderBy: { startTime: 'desc' },
    });
  }
}
