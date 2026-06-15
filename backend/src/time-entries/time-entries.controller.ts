import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { TimeEntriesService } from './time-entries.service';
import type { AuthUser } from '../auth/jwt.strategy';
import type {
  CreateTimeEntryDto,
  UpdateTimeEntryDto,
  TimeEntryFilter,
} from './time-entries.service';

@Controller('api/time-entries')
@UseGuards(AuthGuard('jwt'))
export class TimeEntriesController {
  constructor(private readonly timeEntries: TimeEntriesService) {}

  @Get()
  list(
    @Req() req: Request & { user: AuthUser },
    @Query('projectId') projectId?: string,
    @Query('taskId') taskId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filter: TimeEntryFilter = {
      projectId,
      taskId,
      startDate,
      endDate,
    };
    return this.timeEntries.list(req.user.sub, filter);
  }

  @Get('active')
  getActiveTimer(@Req() req: Request & { user: AuthUser }) {
    return this.timeEntries.getActiveTimer(req.user.sub);
  }

  @Get('summary')
  getTimeSummary(
    @Req() req: Request & { user: AuthUser },
    @Query('projectId') projectId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.timeEntries.getTimeSummary(req.user.sub, {
      projectId,
      startDate,
      endDate,
    });
  }

  @Get(':id')
  getById(@Req() req: Request & { user: AuthUser }, @Param('id') id: string) {
    return this.timeEntries.getById(req.user.sub, id);
  }

  @Post()
  create(
    @Req() req: Request & { user: AuthUser },
    @Body() body: CreateTimeEntryDto,
  ) {
    return this.timeEntries.create(req.user.sub, body);
  }

  @Post('start')
  startTimer(
    @Req() req: Request & { user: AuthUser },
    @Body() body: { projectId?: string; taskId?: string; description?: string },
  ) {
    return this.timeEntries.create(req.user.sub, {
      projectId: body.projectId,
      taskId: body.taskId,
      description: body.description,
      startTime: new Date(),
    });
  }

  @Post('stop')
  stopTimer(@Req() req: Request & { user: AuthUser }) {
    return this.timeEntries.stopActiveTimer(req.user.sub);
  }

  @Put(':id')
  update(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
    @Body() body: UpdateTimeEntryDto,
  ) {
    return this.timeEntries.update(req.user.sub, id, body);
  }

  @Delete(':id')
  remove(@Req() req: Request & { user: AuthUser }, @Param('id') id: string) {
    return this.timeEntries.delete(req.user.sub, id);
  }
}
