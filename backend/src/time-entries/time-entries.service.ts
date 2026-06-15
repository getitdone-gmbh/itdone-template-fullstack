import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface CreateTimeEntryDto {
  projectId?: string;
  taskId?: string;
  startTime?: string | Date;
  endTime?: string | Date;
  duration?: number;
  description?: string;
}

export interface UpdateTimeEntryDto {
  projectId?: string;
  taskId?: string;
  startTime?: string | Date;
  endTime?: string | Date;
  duration?: number;
  description?: string;
}

export interface TimeEntryFilter {
  projectId?: string;
  taskId?: string;
  startDate?: string;
  endDate?: string;
}

export interface TimeSummary {
  totalHours: number;
  entriesCount: number;
  byProject: Array<{
    projectId: string;
    projectName: string;
    totalHours: number;
    entriesCount: number;
  }>;
  byDate: Array<{
    date: string;
    totalHours: number;
  }>;
}

@Injectable()
export class TimeEntriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, filter: TimeEntryFilter = {}) {
    const where: Record<string, any> = { userId };

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
      orderBy: { startTime: 'desc' },
      include: {
        project: { select: { id: true, name: true } },
        task: { select: { id: true, name: true } },
      },
    });
  }

  async getActiveTimer(userId: string) {
    const activeEntry = await this.prisma.timeEntry.findFirst({
      where: {
        userId,
        endTime: null,
      },
      include: {
        project: { select: { id: true, name: true } },
        task: { select: { id: true, name: true } },
      },
    });

    if (!activeEntry) {
      return null;
    }

    // Calculate current duration
    const startTime = new Date(activeEntry.startTime);
    const now = new Date();
    const duration = (now.getTime() - startTime.getTime()) / 1000 / 60; // in minutes

    return {
      ...activeEntry,
      duration,
      startTime: activeEntry.startTime.toISOString(),
    };
  }

  async getById(userId: string, id: string) {
    const entry = await this.prisma.timeEntry.findUnique({
      where: { id, userId },
      include: {
        project: { select: { id: true, name: true } },
        task: { select: { id: true, name: true } },
      },
    });

    if (!entry) {
      throw new NotFoundException('Time entry not found');
    }

    return entry;
  }

  async create(userId: string, dto: CreateTimeEntryDto) {
    // Check if there's already an active timer
    const activeEntry = await this.prisma.timeEntry.findFirst({
      where: { userId, endTime: null },
    });

    if (activeEntry && !dto.endTime) {
      throw new ConflictException(
        'Cannot start a new timer while another one is running. Stop the active timer first.',
      );
    }

    const startTime = dto.startTime ? new Date(dto.startTime) : new Date();
    const endTime = dto.endTime ? new Date(dto.endTime) : null;

    // Calculate duration if both start and end times are provided
    let duration = dto.duration;
    if (dto.startTime && dto.endTime && !dto.duration) {
      const start = new Date(dto.startTime);
      const end = new Date(dto.endTime);
      duration = (end.getTime() - start.getTime()) / 1000 / 60; // in minutes
    }

    return this.prisma.timeEntry.create({
      data: {
        userId,
        projectId: dto.projectId,
        taskId: dto.taskId,
        startTime,
        endTime,
        duration,
        description: dto.description,
      },
      include: {
        project: { select: { id: true, name: true } },
        task: { select: { id: true, name: true } },
      },
    });
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateTimeEntryDto,
  ) {
    const existing = await this.prisma.timeEntry.findUnique({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Time entry not found');
    }

    // Calculate duration if times are updated
    let duration = dto.duration;
    if (dto.startTime && dto.endTime && !dto.duration) {
      const start = new Date(dto.startTime);
      const end = new Date(dto.endTime);
      duration = (end.getTime() - start.getTime()) / 1000 / 60;
    } else if (dto.startTime && !dto.endTime) {
      // If start time is updated but end time is not, and no duration provided
      // This means the timer is still running, don't calculate duration
      duration = undefined;
    }

    return this.prisma.timeEntry.update({
      where: { id, userId },
      data: {
        projectId: dto.projectId,
        taskId: dto.taskId,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
        duration,
        description: dto.description,
      },
      include: {
        project: { select: { id: true, name: true } },
        task: { select: { id: true, name: true } },
      },
    });
  }

  async delete(userId: string, id: string) {
    const result = await this.prisma.timeEntry.deleteMany({
      where: { id, userId },
    });

    if (result.count === 0) {
      throw new NotFoundException('Time entry not found');
    }

    return { message: 'Time entry deleted' };
  }

  async stopActiveTimer(userId: string): Promise<any> {
    const activeEntry = await this.prisma.timeEntry.findFirst({
      where: { userId, endTime: null },
    });

    if (!activeEntry) {
      throw new NotFoundException('No active timer found');
    }

    const now = new Date();
    const startTime = new Date(activeEntry.startTime);
    const duration = (now.getTime() - startTime.getTime()) / 1000 / 60; // in minutes

    return this.prisma.timeEntry.update({
      where: { id: activeEntry.id, userId },
      data: {
        endTime: now,
        duration,
      },
      include: {
        project: { select: { id: true, name: true } },
        task: { select: { id: true, name: true } },
      },
    });
  }

  async getTimeSummary(
    userId: string,
    filter: { projectId?: string; startDate?: string; endDate?: string } = {},
  ): Promise<TimeSummary> {
    const where: Record<string, any> = { userId };

    if (filter.projectId) {
      where.projectId = filter.projectId;
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

    // Get all entries
    const entries = await this.prisma.timeEntry.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    // Calculate total hours
    const totalHours = entries.reduce((sum, entry) => {
      const duration = entry.duration || 0;
      // If entry is still running, calculate duration from start time
      if (!entry.endTime && entry.startTime) {
        const start = new Date(entry.startTime);
        const now = new Date();
        return sum + (now.getTime() - start.getTime()) / 1000 / 60 / 60; // in hours
      }
      return sum + duration / 60; // Convert minutes to hours
    }, 0);

    // Group by project
    const byProjectMap = new Map<string, { projectName: string; totalHours: number; entriesCount: number }>();
    entries.forEach((entry) => {
      const projectId = entry.projectId || 'uncategorized';
      const projectName = entry.project?.name || 'Uncategorized';
      
      let duration = entry.duration || 0;
      if (!entry.endTime && entry.startTime) {
        const start = new Date(entry.startTime);
        const now = new Date();
        duration = (now.getTime() - start.getTime()) / 1000 / 60; // in minutes
      }
      
      const hours = duration / 60;
      
      if (!byProjectMap.has(projectId)) {
        byProjectMap.set(projectId, { projectName, totalHours: 0, entriesCount: 0 });
      }
      
      const projectData = byProjectMap.get(projectId)!;
      projectData.totalHours += hours;
      projectData.entriesCount += 1;
    });

    const byProject = Array.from(byProjectMap.values()).map((data) => ({
      projectId: data.projectName === 'Uncategorized' ? 'uncategorized' : data.projectName,
      projectName: data.projectName,
      totalHours: data.totalHours,
      entriesCount: data.entriesCount,
    }));

    // Group by date
    const byDateMap = new Map<string, number>();
    entries.forEach((entry) => {
      const date = new Date(entry.startTime).toISOString().split('T')[0];
      
      let duration = entry.duration || 0;
      if (!entry.endTime && entry.startTime) {
        const start = new Date(entry.startTime);
        const now = new Date();
        duration = (now.getTime() - start.getTime()) / 1000 / 60; // in minutes
      }
      
      const hours = duration / 60;
      byDateMap.set(date, (byDateMap.get(date) || 0) + hours);
    });

    const byDate = Array.from(byDateMap.entries()).map(([date, totalHours]) => ({
      date,
      totalHours,
    }));

    return {
      totalHours,
      entriesCount: entries.length,
      byProject,
      byDate,
    };
  }
}
