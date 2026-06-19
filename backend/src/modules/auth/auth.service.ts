import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import type { LoginInput, SignupInput, VerifyOtpInput, StaffLoginInput } from '@cafe/shared';
import { UserRole } from '@cafe/shared';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export type { TokenPair };

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** Step 1 of onboarding: create the owner account (no tenant yet) and send OTP. */
  async signup(input: SignupInput): Promise<{ userId: string; message: string }> {
    const existing = await this.prisma.user.findFirst({
      where: { email: input.email, tenantId: null },
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await argon2.hash(input.password);
    const user = await this.prisma.user.create({
      data: {
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: UserRole.OWNER,
        isVerified: false,
      },
    });

    await this.sendOtp(input.email);
    return { userId: user.id, message: 'Account created. Verify the OTP sent to your email.' };
  }

  /** Generate + store a 6-digit OTP (10 min TTL). In dev, it is logged. */
  async sendOtp(email: string): Promise<void> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redis.set(`otp:${email}`, code, 600);
    // TODO(Stage 7): send via email/SMS provider. For now, log in dev.
    this.logger.log(`OTP for ${email}: ${code}`);
  }

  async verifyOtp(input: VerifyOtpInput): Promise<TokenPair> {
    const stored = await this.redis.get(`otp:${input.email}`);
    if (!stored || stored !== input.code) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }
    const user = await this.prisma.user.findFirst({
      where: { email: input.email, tenantId: null },
    });
    if (!user) {
      throw new UnauthorizedException('Account not found');
    }
    await this.prisma.user.update({ where: { id: user.id }, data: { isVerified: true } });
    await this.redis.del(`otp:${input.email}`);
    return this.issueTokens(user.id, user.tenantId, user.role, user.email ?? input.email);
  }

  async login(input: LoginInput): Promise<TokenPair> {
    const user = await this.prisma.user.findFirst({ where: { email: input.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await argon2.verify(user.passwordHash, input.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isVerified) {
      throw new UnauthorizedException('Account not verified');
    }
    return this.issueTokens(user.id, user.tenantId, user.role, user.email ?? '');
  }

  /**
   * Staff login: scoped by workspace subdomain so usernames only need to be
   * unique within a tenant (e.g. two cafes can both have a "chef1").
   */
  async staffLogin(input: StaffLoginInput): Promise<TokenPair> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { subdomain: input.subdomain },
    });
    if (!tenant) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const user = await this.prisma.user.findFirst({
      where: { tenantId: tenant.id, username: input.username },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await argon2.verify(user.passwordHash, input.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }
    return this.issueTokens(user.id, user.tenantId, user.role, user.email ?? user.username ?? '');
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwt.verify<{ sub: string; tenantId: string | null; role: string; email: string }>(
        refreshToken,
        { secret: this.config.get<string>('jwt.refreshSecret') },
      );
      const accessToken = await this.jwt.signAsync(
        { sub: payload.sub, tenantId: payload.tenantId, role: payload.role, email: payload.email },
        {
          secret: this.config.get<string>('jwt.accessSecret'),
          expiresIn: this.config.get<number>('jwt.accessTtl'),
        },
      );
      return { accessToken };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /** Public wrapper so other modules (e.g. onboarding) can re-issue tokens after the
   * user's tenant/role changes — for example once a tenant is created during onboarding. */
  async issueTokensForUser(user: {
    id: string;
    tenantId: string | null;
    role: string;
    email: string;
  }): Promise<TokenPair> {
    return this.issueTokens(user.id, user.tenantId, user.role, user.email);
  }

  private async issueTokens(
    userId: string,
    tenantId: string | null,
    role: string,
    email: string,
  ): Promise<TokenPair> {
    const payload = { sub: userId, tenantId, role, email };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('jwt.accessSecret'),
      expiresIn: this.config.get<number>('jwt.accessTtl'),
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('jwt.refreshSecret'),
      expiresIn: this.config.get<number>('jwt.refreshTtl'),
    });
    return { accessToken, refreshToken };
  }
}
