import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  addPaymentSchema,
  applyDiscountSchema,
  UserRole,
  type AddPaymentInput,
  type ApplyDiscountInput,
} from '@cafe/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrdersService } from '../orders/orders.service';
import { PaymentsService } from './payments.service';

// Roles that handle money / close out bills.
const CASHIERS = [UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER] as const;

@ApiTags('payments')
@ApiBearerAuth()
@Roles(...CASHIERS)
@Controller('orders')
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly orders: OrdersService,
  ) {}

  @Post(':id/discount')
  applyDiscount(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(applyDiscountSchema)) body: ApplyDiscountInput,
  ) {
    return this.orders.applyDiscount(id, body.type, body.value);
  }

  @Post(':id/payments')
  addPayment(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(addPaymentSchema)) body: AddPaymentInput,
  ) {
    return this.payments.addPayment(id, body);
  }

  @Get(':id/payments')
  summary(@Param('id') id: string) {
    return this.payments.summary(id);
  }

  @Post(':id/checkout')
  checkout(@Param('id') id: string) {
    return this.payments.finalize(id);
  }
}
