import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  createInventoryItemSchema,
  receiveStockSchema,
  stockMovementSchema,
  updateInventoryItemSchema,
  UserRole,
  type CreateInventoryItemInput,
  type ReceiveStockInput,
  type StockMovementInput,
  type UpdateInventoryItemInput,
} from '@cafe/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Roles } from '../auth/decorators/roles.decorator';
import { InventoryService } from './inventory.service';

// Inventory is managed by owner/manager; kitchen can record consumption/waste.
const MANAGERS = [UserRole.OWNER, UserRole.MANAGER] as const;
const STOCK_HANDLERS = [UserRole.OWNER, UserRole.MANAGER, UserRole.KITCHEN] as const;

@ApiTags('inventory')
@ApiBearerAuth()
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Roles(...STOCK_HANDLERS)
  @Get()
  list() {
    return this.inventory.list();
  }

  @Roles(...STOCK_HANDLERS)
  @Get('alerts')
  alerts() {
    return this.inventory.alerts();
  }

  @Roles(...MANAGERS)
  @Post()
  create(@Body(new ZodValidationPipe(createInventoryItemSchema)) body: CreateInventoryItemInput) {
    return this.inventory.create(body);
  }

  @Roles(...STOCK_HANDLERS)
  @Get(':id')
  get(@Param('id') id: string) {
    return this.inventory.get(id);
  }

  @Roles(...MANAGERS)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateInventoryItemSchema)) body: UpdateInventoryItemInput,
  ) {
    return this.inventory.update(id, body);
  }

  @Roles(...MANAGERS)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inventory.remove(id);
  }

  @Roles(...MANAGERS)
  @Post(':id/receive')
  receive(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(receiveStockSchema)) body: ReceiveStockInput,
  ) {
    return this.inventory.receive(id, body);
  }

  @Roles(...STOCK_HANDLERS)
  @Post(':id/movement')
  move(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(stockMovementSchema)) body: StockMovementInput,
  ) {
    return this.inventory.move(id, body);
  }
}
