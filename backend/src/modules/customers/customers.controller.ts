import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  createCustomerSchema,
  createFeedbackSchema,
  updateCustomerSchema,
  UserRole,
  type CreateCustomerInput,
  type CreateFeedbackInput,
  type UpdateCustomerInput,
} from '@cafe/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Roles } from '../auth/decorators/roles.decorator';
import { CustomersService } from './customers.service';

const FOH = [UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER, UserRole.WAITER] as const;

@ApiTags('customers')
@ApiBearerAuth()
@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Roles(...FOH)
  @Get()
  list() {
    return this.customers.list();
  }

  // Feedback summary (static path before :id).
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Get('feedback')
  feedbackSummary() {
    return this.customers.feedbackSummary();
  }

  @Roles(...FOH)
  @Post('feedback')
  createFeedback(@Body(new ZodValidationPipe(createFeedbackSchema)) body: CreateFeedbackInput) {
    return this.customers.createFeedback(body);
  }

  @Roles(...FOH)
  @Post()
  create(@Body(new ZodValidationPipe(createCustomerSchema)) body: CreateCustomerInput) {
    return this.customers.create(body);
  }

  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Get(':id')
  get(@Param('id') id: string) {
    return this.customers.get(id);
  }

  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCustomerSchema)) body: UpdateCustomerInput,
  ) {
    return this.customers.update(id, body);
  }

  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customers.remove(id);
  }
}
