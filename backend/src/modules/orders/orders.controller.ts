import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  addOrderItemsSchema,
  createOrderSchema,
  setOrderCustomerSchema,
  updateOrderItemSchema,
  updateOrderStatusSchema,
  UserRole,
  type AddOrderItemsInput,
  type CreateOrderInput,
  type SetOrderCustomerInput,
  type UpdateOrderItemInput,
  type UpdateOrderStatusInput,
} from '@cafe/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrdersService } from './orders.service';

// Front-of-house roles that take and manage orders.
const FOH = [UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER, UserRole.WAITER] as const;
// Everyone who can view orders (adds kitchen, which powers the kitchen display).
const VIEWERS = [...FOH, UserRole.KITCHEN] as const;
// Who can advance an order's status (kitchen marks preparing/ready/served).
const STATUS_CHANGERS = [...FOH, UserRole.KITCHEN] as const;

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Roles(...VIEWERS)
  @Get()
  list(@Query('outletId') outletId?: string, @Query('status') status?: string) {
    return this.orders.list({ outletId, status });
  }

  @Roles(...VIEWERS)
  @Get(':id')
  get(@Param('id') id: string) {
    return this.orders.get(id);
  }

  @Roles(...FOH)
  @Post()
  create(@Body(new ZodValidationPipe(createOrderSchema)) body: CreateOrderInput) {
    return this.orders.create(body);
  }

  @Roles(...FOH)
  @Post(':id/items')
  addItems(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(addOrderItemsSchema)) body: AddOrderItemsInput,
  ) {
    return this.orders.addItems(id, body);
  }

  @Roles(...FOH)
  @Patch(':id/items/:itemId')
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(updateOrderItemSchema)) body: UpdateOrderItemInput,
  ) {
    return this.orders.updateItem(id, itemId, body);
  }

  @Roles(...FOH)
  @Delete(':id/items/:itemId')
  removeItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.orders.removeItem(id, itemId);
  }

  @Roles(...FOH)
  @Post(':id/send-kitchen')
  sendToKitchen(@Param('id') id: string) {
    return this.orders.sendToKitchen(id);
  }

  @Roles(...FOH)
  @Patch(':id/customer')
  setCustomer(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(setOrderCustomerSchema)) body: SetOrderCustomerInput,
  ) {
    return this.orders.setCustomer(id, body.customerId);
  }

  @Roles(...STATUS_CHANGERS)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateOrderStatusSchema)) body: UpdateOrderStatusInput,
  ) {
    return this.orders.updateStatus(id, body.status);
  }
}
