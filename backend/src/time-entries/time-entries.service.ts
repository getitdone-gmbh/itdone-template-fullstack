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

  async getById(userId: string, id: string) {
    return this.findOne(userId, id);
  }

  async stopActiveTimer(userId: string) {
    const activeTimer = await this.getActiveTimer(userId);
    if (!activeTimer) {
      throw new NotFoundException('No active timer found');
    }

    return this.prisma.timeEntry.update({
      where: { id: activeTimer.id },
      data: {
        endTime: new Date(),
        duration: {
          increment: 0, // Duration will be recalculated
        },
      },
      include: {
        project: true,
        task: true,
      },
    });
  }

  async getTimeSummary(
    userId: string,
    filters?: { projectId?: string; startDate?: string; endDate?: string },
  ) {
    const where: any = { userId };

    if (filters?.projectId) {
      where.projectId = filters.projectId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.startTime = {};
      if (filters?.startDate) {
        where.startTime.gte = new Date(filters.startDate);
      }
      if (filters?.endDate) {
        where.startTime.lte = new Date(filters.endDate);
      }
    }

    const entries = await this.prisma.timeEntry.findMany({
      where,
      include: {
        project: true,
        task: true,
      },
    });

    // Calculate summary
    const totalHours = entries.reduce((sum, entry) => {
      return sum + (entry.duration || 0);
    }, 0);

    const byProject: Record<string, { hours: number; entries: number }> = {};
    const byTask: Record<string, { hours: number; entries: number }> = {};
    const byDate: Record<string, { hours: number; entries: number }> = {};

    entries.forEach((entry) => {
      const duration = entry.duration || 0;

      // By project
      const projectName = entry.project?.name || 'No Project';
      if (!byProject[projectName]) {
        byProject[projectName] = { hours: 0, entries: 0 };
      }
      byProject[projectName].hours += duration;
      byProject[projectName].entries += 1;

      // By task
      const taskName = entry.task?.name || 'No Task';
      if (!byTask[taskName]) {
        byTask[taskName] = { hours: 0, entries: 0 };
      }
      byTask[taskName].hours += duration;
      byTask[taskName].entries += 1;

      // By date
      const date = entry.startTime.toISOString().split('T')[0];
      if (!byDate[date]) {
        byDate[date] = { hours: 0, entries: 0 };
      }
      byDate[date].hours += duration;
      byDate[date].entries += 1;
    });

    return {
      totalHours,
      byProject,
      byTask,
      byDate,
      totalEntries: entries.length,
    };
  }

  // Manual time entry specific methods
  async createManualEntry(
    userId: string,
    dto: {
      date: Date;
      projectId?: string;
      taskId?: string;
      hours: number;
      description?: string;
    },
  ) {
    if (dto.hours <= 0) {
      throw new BadRequestException('Hours must be positive');
    }

    const startTime = new Date(dto.date);
    const endTime = new Date(dto.date);
    endTime.setHours(startTime.getHours() + dto.hours);

    return this.prisma.timeEntry.create({
      data: {
        userId,
        projectId: dto.projectId,
        taskId: dto.taskId,
        startTime,
        endTime,
        duration: dto.hours,
        description: dto.description,
      },
      include: {
        project: true,
        task: true,
      },
    });
  }

  async list(userId: string, filter: TimeEntryFilter = {}) {
    const where: any = { userId };

    if (filter.projectId) {
      where.projectId = filter.projectId;
    }

    if (filter.taskId) {
      where.taskId = filter.taskId;
    }

    if (filter.startDate || filter.endDate) {
      where.startTime = {};
      if (filter.startDate) {
        where.startTime.gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        where.startTime.lte = new Date(filter.endDate);
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
}

// Export types for controller
export interface TimeEntryFilter {
  projectId?: string;
  taskId?: string;
  startDate?: string;
  endDate?: string;
}
