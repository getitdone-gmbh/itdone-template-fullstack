import { Module } from '@nestjs/common';
import { TimeEntriesService } from './time-entries.service';
import { TimeEntriesController } from './time-entries.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [TimeEntriesController],
  providers: [TimeEntriesService, PrismaService],
})
export class TimeEntriesModule {}
