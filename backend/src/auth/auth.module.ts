import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../prisma.service';
import { UsersService } from '../users/users.service';
import { PasswordResetService } from '../password-reset/password-reset.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    PrismaService,
    UsersService,
    PasswordResetService,
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
