import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AppController } from './app.controller';
import { PrismaService } from './prisma.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { ItemsController } from './items/items.controller';
import { ItemsService } from './items/items.service';
import { TimeEntriesModule } from './time-entries/time-entries.module';

@Module({
  imports: [PassportModule, TimeEntriesModule],
  controllers: [AppController, ItemsController],
  providers: [PrismaService, ItemsService, JwtStrategy],
})
export class AppModule {}
