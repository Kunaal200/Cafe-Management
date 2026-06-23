import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  applyCouponSchema,
  createCouponSchema,
  updateCouponSchema,
  UserRole,
  type ApplyCouponInput,
  type CreateCouponInput,
  type UpdateCouponInput,
} from '@cafe/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Roles } from '../auth/decorators/roles.decorator';
import { CouponsService } from './coupons.service';

@ApiTags('coupons')
@ApiBearerAuth()
@Controller('coupons')
export class CouponsController {
  constructor(private readonly coupons: CouponsService) {}

  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Get()
  list() {
    return this.coupons.list();
  }

  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Post()
  create(@Body(new ZodValidationPipe(createCouponSchema)) body: CreateCouponInput) {
    return this.coupons.create(body);
  }

  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCouponSchema)) body: UpdateCouponInput,
  ) {
    return this.coupons.update(id, body);
  }

  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.coupons.remove(id);
  }

  // Applying a coupon happens at checkout — allowed for money-handling roles.
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER)
  @Post('orders/:orderId/apply')
  apply(
    @Param('orderId') orderId: string,
    @Body(new ZodValidationPipe(applyCouponSchema)) body: ApplyCouponInput,
  ) {
    return this.coupons.applyToOrder(orderId, body.code);
  }
}
