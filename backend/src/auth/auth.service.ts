import { HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import crypto from 'crypto';
import { Repository } from 'typeorm';
import { ApiError } from '../common/exceptions/api-error';
import { ErrorCodes } from '../common/exceptions/error-codes';
import { LoginDto } from './dto/login.dto';
import { UserAccount } from './user.entity';

interface TokenPayload {
  sub: number;
  exp: number;
}

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectRepository(UserAccount)
    private readonly userRepository: Repository<UserAccount>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureDefaultUser();
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({ where: { username: dto.username } });
    if (!user || !this.verifyPassword(dto.password, user.passwordHash)) {
      throw new ApiError(
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTH_INVALID_CREDENTIALS,
        '用户名或密码错误',
      );
    }

    return {
      accessToken: this.signToken(user.id),
      user: this.toPublicUser(user),
    };
  }

  async getCurrentUserByToken(token: string) {
    const payload = this.verifyToken(token);
    const user = await this.userRepository.findOne({ where: { id: payload.sub } });
    if (!user) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, ErrorCodes.AUTH_INVALID_TOKEN, '登录状态已失效');
    }

    return user;
  }

  async getCurrentUser(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, ErrorCodes.AUTH_INVALID_TOKEN, '登录状态已失效');
    }

    return { user: this.toPublicUser(user) };
  }

  private async ensureDefaultUser() {
    const existingUser = await this.userRepository.count();
    if (existingUser > 0) {
      return;
    }

    const username = process.env.CCHUB_DEFAULT_USERNAME || 'admin';
    const password = process.env.CCHUB_DEFAULT_PASSWORD || 'admin123456';

    const user = this.userRepository.create({
      username,
      displayName: 'ccHub User',
      passwordHash: this.createPasswordHash(password),
    });

    await this.userRepository.save(user);
  }

  private signToken(userId: number) {
    const payload: TokenPayload = {
      sub: userId,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    };

    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.getAuthSecret())
      .update(encodedPayload)
      .digest('base64url');

    return `${encodedPayload}.${signature}`;
  }

  private verifyToken(token: string): TokenPayload {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, ErrorCodes.AUTH_INVALID_TOKEN, '无效的登录状态');
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.getAuthSecret())
      .update(encodedPayload)
      .digest('base64url');

    const actual = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);
    if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, ErrorCodes.AUTH_INVALID_TOKEN, '无效的登录状态');
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as TokenPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, ErrorCodes.AUTH_INVALID_TOKEN, '登录状态已过期');
    }

    return payload;
  }

  private getAuthSecret() {
    return process.env.CCHUB_AUTH_SECRET || 'cchub-local-auth-secret';
  }

  private createPasswordHash(password: string) {
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${derivedKey}`;
  }

  private verifyPassword(password: string, storedHash: string) {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) {
      return false;
    }

    const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(derivedKey, 'hex'));
  }

  private toPublicUser(user: UserAccount) {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName || user.username,
    };
  }
}
