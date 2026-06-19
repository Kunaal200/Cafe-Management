import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@cafe/shared';
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
@Roles(...VIEWERS)
@Controller('outlets')
export class OutletsController {
  constructor(private readonly outlets: OutletsService) {}

  @Get()
  list() {
    return this.outlets.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.outlets.get(id);
  }
}
