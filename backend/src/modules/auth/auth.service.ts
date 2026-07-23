import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { User } from '../users/user.schema';
import * as bcrypt from 'bcrypt';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);
    const tokens = await this.generateTokens(user);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isDisabled) {
      throw new UnauthorizedException('Account has been disabled');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshToken(userId: string) {
    const user = await this.usersService.findById(userId);
    const tokens = await this.generateTokens(user);
    return tokens;
  }

  async validateUser(payload: JwtPayload): Promise<User | null> {
    const user = await this.usersService.findById(payload.sub);
    if (user && !user.isDisabled) {
      return user;
    }
    return null;
  }

  private async generateTokens(user: User) {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtSecret,
        expiresIn: '1d',
      }),
      this.jwtService.signAsync(payload, {
        secret: jwtSecret,
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private sanitizeUser(user: User) {
    const { password, ...result } = user.toObject();
    return result;
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    return this.sanitizeUser(user);
  }
}
