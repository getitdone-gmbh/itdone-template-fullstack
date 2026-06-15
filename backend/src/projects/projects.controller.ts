import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { ProjectsService } from './projects.service';
import type { AuthUser } from '../auth/jwt.strategy';
import type { CreateProjectDto, UpdateProjectDto } from './projects.service';

@Controller('api/projects')
@UseGuards(AuthGuard('jwt'))
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  list(@Req() req: Request & { user: AuthUser }) {
    return this.projects.findAll(req.user.sub);
  }

  @Get(':id')
  getById(@Req() req: Request & { user: AuthUser }, @Param('id') id: string) {
    return this.projects.findOne(req.user.sub, id);
  }

  @Post()
  create(
    @Req() req: Request & { user: AuthUser },
    @Body() body: CreateProjectDto,
  ) {
    return this.projects.create(req.user.sub, body);
  }

  @Put(':id')
  update(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
    @Body() body: UpdateProjectDto,
  ) {
    return this.projects.update(req.user.sub, id, body);
  }

  @Delete(':id')
  remove(@Req() req: Request & { user: AuthUser }, @Param('id') id: string) {
    return this.projects.remove(req.user.sub, id);
  }
}
