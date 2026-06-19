import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  closeShiftSchema,
  openShiftSchema,
  UserRole,
  type CloseShiftInput,
  type OpenShiftInput,
} from '@cafe/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Roles } from '../auth/decorators/roles.decorator';
import { RegisterService } from './register.service';

const REGISTER_ROLES = [UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER] as const;

@ApiTags('register')
@ApiBearerAuth()
@Roles(...REGISTER_ROLES)
@Controller('register')
export class RegisterController {
  constructor(private readonly register: RegisterService) {}

  @Post('open')
  open(@Body(new ZodValidationPipe(openShiftSchema)) body: OpenShiftInput) {
    return this.register.open(body);
  }

  @Post(':id/close')
  close(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(closeShiftSchema)) body: CloseShiftInput,
  ) {
    return this.register.close(id, body.closingCash);
  }

  @Get('current')
  current(@Query('outletId') outletId: string) {
    return this.register.current(outletId);
  }

  @Get()
  list(@Query('outletId') outletId?: string) {
    return this.register.list(outletId);
  }
}
