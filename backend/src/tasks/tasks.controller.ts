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
import { TasksService } from './tasks.service';
import type { AuthUser } from '../auth/jwt.strategy';
import type { CreateTaskDto, UpdateTaskDto } from './tasks.service';

@Controller('api/tasks')
@UseGuards(AuthGuard('jwt'))
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  list(
    @Req() req: Request & { user: AuthUser },
    @Query('projectId') projectId?: string,
  ) {
    return this.tasks.list(req.user.sub, projectId);
  }

  @Get(':id')
  getById(@Req() req: Request & { user: AuthUser }, @Param('id') id: string) {
    return this.tasks.findOne(req.user.sub, id);
  }

  @Post()
  create(
    @Req() req: Request & { user: AuthUser },
    @Body() body: CreateTaskDto,
  ) {
    return this.tasks.create(req.user.sub, body);
  }

  @Put(':id')
  update(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
    @Body() body: UpdateTaskDto,
  ) {
    return this.tasks.update(req.user.sub, id, body);
  }

  @Delete(':id')
  remove(@Req() req: Request & { user: AuthUser }, @Param('id') id: string) {
    return this.tasks.remove(req.user.sub, id);
  }
}
