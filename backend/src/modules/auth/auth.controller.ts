import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  loginSchema,
  refreshSchema,
  signupSchema,
  staffLoginSchema,
  verifyOtpSchema,
  type LoginInput,
  type RefreshInput,
  type SignupInput,
  type StaffLoginInput,
  type VerifyOtpInput,
} from '@cafe/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import type { AuthPayload } from '../../common/tenancy/tenant-context.middleware';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('signup')
  signup(@Body(new ZodValidationPipe(signupSchema)) body: SignupInput) {
    return this.auth.signup(body);
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  verifyOtp(@Body(new ZodValidationPipe(verifyOtpSchema)) body: VerifyOtpInput) {
    return this.auth.verifyOtp(body);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body(new ZodValidationPipe(loginSchema)) body: LoginInput) {
    return this.auth.login(body);
  }

  @Public()
  @Post('staff-login')
  @HttpCode(HttpStatus.OK)
  staffLogin(@Body(new ZodValidationPipe(staffLoginSchema)) body: StaffLoginInput) {
    return this.auth.staffLogin(body);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body(new ZodValidationPipe(refreshSchema)) body: RefreshInput) {
    return this.auth.refresh(body.refreshToken);
  }

  @Get('me')
  me(@CurrentUser() user: AuthPayload) {
    return user;
  }
}
