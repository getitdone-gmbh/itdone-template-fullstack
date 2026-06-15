import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

@Injectable()
export class TimeEntriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, filters?: {
    projectId?: string;
    taskId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: Record<string, any> = { userId };

    if (filters?.projectId) {
      where.projectId = filters.projectId;
    }
    if (filters?.taskId) {
      where.taskId = filters.taskId;
    }
    if (filters?.startDate || filters?.endDate) {
      where.startTime = {};
      if (filters.startDate) {
        where.startTime.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.startTime.lte = new Date(filters.endDate);
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

  async getById(userId: string, id: string) {
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

  async create(userId: string, data: CreateTimeEntryDto) {
    // Validate that project belongs to user if provided
    if (data.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: data.projectId },
      });
      if (!project || project.userId !== userId) {
        throw new BadRequestException('Project not found or not accessible');
      }
    }

    // Validate that task belongs to user's project if provided
    if (data.taskId) {
      const task = await this.prisma.task.findUnique({
        where: { id: data.taskId },
        include: { project: true },
      });
      if (!task || task.project.userId !== userId) {
        throw new BadRequestException('Task not found or not accessible');
      }
    }

    const startTime = data.startTime ? new Date(data.startTime) : new Date();
    const endTime = data.endTime ? new Date(data.endTime) : null;

    // Calculate duration if both start and end times are provided
    let duration = data.duration;
    if (startTime && endTime && !duration) {
      duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60); // hours
    }

    return this.prisma.timeEntry.create({
      data: {
        userId,
        projectId: data.projectId,
        taskId: data.taskId,
        startTime,
        endTime,
        duration,
        description: data.description,
      },
      include: {
        project: true,
        task: true,
      },
    });
  }

  async update(userId: string, id: string, data: UpdateTimeEntryDto) {
    // Check if entry exists and belongs to user
    const existing = await this.prisma.timeEntry.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Time entry not found');
    }

    // Validate project if provided
    if (data.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: data.projectId },
      });
      if (!project || project.userId !== userId) {
        throw new BadRequestException('Project not found or not accessible');
      }
    }

    // Validate task if provided
    if (data.taskId) {
      const task = await this.prisma.task.findUnique({
        where: { id: data.taskId },
        include: { project: true },
      });
      if (!task || task.project.userId !== userId) {
        throw new BadRequestException('Task not found or not accessible');
      }
    }

    const updateData: Record<string, any> = {};

    if (data.projectId !== undefined) updateData.projectId = data.projectId;
    if (data.taskId !== undefined) updateData.taskId = data.taskId;
    if (data.startTime !== undefined) updateData.startTime = new Date(data.startTime);
    if (data.endTime !== undefined) updateData.endTime = data.endTime ? new Date(data.endTime) : null;
    if (data.description !== undefined) updateData.description = data.description;

    // Calculate duration if both start and end times are provided
    if (data.startTime && data.endTime && data.duration === undefined) {
      const start = new Date(data.startTime);
      const end = new Date(data.endTime);
      updateData.duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    } else if (data.duration !== undefined) {
      updateData.duration = data.duration;
    }

    return this.prisma.timeEntry.update({
      where: { id },
      data: updateData,
      include: {
        project: true,
        task: true,
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

  async getActiveTimer(userId: string) {
    // Find the most recent entry without an endTime (active timer)
    return this.prisma.timeEntry.findFirst({
      where: {
        userId,
        endTime: null,
      },
      include: {
        project: true,
        task: true,
      },
      orderBy: { startTime: 'desc' },
    });
  }

  async getTimeSummary(userId: string, filters?: {
    projectId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: Record<string, any> = { userId };

    if (filters?.projectId) {
      where.projectId = filters.projectId;
    }
    if (filters?.startDate || filters?.endDate) {
      where.startTime = {};
      if (filters.startDate) {
        where.startTime.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.startTime.lte = new Date(filters.endDate);
      }
    }

    // Get total hours
    const result = await this.prisma.timeEntry.aggregate({
      where,
      _sum: { duration: true },
    });

    // Get entries grouped by date
    const entriesByDate = await this.prisma.timeEntry.groupBy({
      by: ['startTime'],
      where,
      _sum: { duration: true },
    });

    // Get entries grouped by project
    const entriesByProject = await this.prisma.timeEntry.groupBy({
      by: ['projectId'],
      where,
      _sum: { duration: true },
      _count: { _all: true },
    });

    return {
      totalHours: result._sum.duration || 0,
      entriesByDate: entriesByDate.map((e) => ({
        date: e.startTime.toISOString().split('T')[0],
        hours: e._sum.duration || 0,
      })),
      entriesByProject: await Promise.all(
        entriesByProject.map(async (e) => {
          const project = e.projectId
            ? await this.prisma.project.findUnique({ where: { id: e.projectId } })
            : null;
          return {
            projectId: e.projectId,
            projectName: project?.name || 'Unknown',
            hours: e._sum.duration || 0,
            entryCount: e._count._all,
          };
        }),
      ),
    };
  }
}
