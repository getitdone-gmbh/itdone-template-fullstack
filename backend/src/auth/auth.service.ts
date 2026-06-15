import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  name?: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  passwordConfirmation: string;
  name?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }

  async register(registerDto: RegisterDto): Promise<AuthTokens> {
    if (registerDto.password !== registerDto.passwordConfirmation) {
      throw new BadRequestException('Passwords do not match');
    }

    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        passwordHash: hashedPassword,
        name: registerDto.name,
        role: 'USER',
      },
    });

    return this.generateTokens(user);
  }

  async login(loginDto: LoginDto): Promise<AuthTokens> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    return this.generateTokens(user);
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET || 'your-secret-key',
      }) as JwtPayload;

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateTokens(user: {
    id: string;
    email: string;
    name?: string | null;
    role: string;
  }): AuthTokens {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name || undefined,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    return {
      accessToken,
      refreshToken,
    };
  }

  async validateJwtPayload(payload: JwtPayload): Promise<any> {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}
