import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { changePlanSchema, UserRole, type ChangePlanInput } from '@cafe/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Roles } from '../auth/decorators/roles.decorator';
import { SubscriptionService } from './subscription.service';

@ApiTags('subscription')
@ApiBearerAuth()
@Roles(UserRole.OWNER)
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscription: SubscriptionService) {}

  @Get()
  current() {
    return this.subscription.current();
  }

  @Patch()
  changePlan(@Body(new ZodValidationPipe(changePlanSchema)) body: ChangePlanInput) {
    return this.subscription.changePlan(body);
  }
}
