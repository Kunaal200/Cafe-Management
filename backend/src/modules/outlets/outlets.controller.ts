import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { updateOutletSchema, UserRole, type UpdateOutletInput } from '@cafe/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Roles } from '../auth/decorators/roles.decorator';
import { OutletsService } from './outlets.service';

// All internal roles may read outlets (needed by the dashboard outlet switcher,
// POS, and KDS). Mutating outlets happens through onboarding/settings.
const VIEWERS = [
  UserRole.OWNER,
  UserRole.MANAGER,
  UserRole.CASHIER,
  UserRole.WAITER,
  UserRole.KITCHEN,
  UserRole.ACCOUNTANT,
] as const;

@ApiTags('outlets')
@ApiBearerAuth()
@Controller('outlets')
export class OutletsController {
  constructor(private readonly outlets: OutletsService) {}

  @Roles(...VIEWERS)
  @Get()
  list() {
    return this.outlets.list();
  }

  @Roles(...VIEWERS)
  @Get(':id')
  get(@Param('id') id: string) {
    return this.outlets.get(id);
  }

  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateOutletSchema)) body: UpdateOutletInput,
  ) {
    return this.outlets.update(id, body);
  }
}
