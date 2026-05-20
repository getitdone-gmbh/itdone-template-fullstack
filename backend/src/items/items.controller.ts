import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { ItemsService } from './items.service';
import type { AuthUser } from '../auth/jwt.strategy';

@Controller('api/items')
@UseGuards(AuthGuard('jwt'))
export class ItemsController {
  constructor(private readonly items: ItemsService) {}

  @Get()
  list(@Req() req: Request & { user: AuthUser }) {
    return this.items.list(req.user.sub);
  }

  @Post()
  create(
    @Req() req: Request & { user: AuthUser },
    @Body() body: { title: string },
  ) {
    return this.items.create(req.user.sub, body?.title);
  }

  @Delete(':id')
  remove(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
  ) {
    return this.items.remove(req.user.sub, id);
  }
}
