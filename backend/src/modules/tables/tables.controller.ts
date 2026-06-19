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
  createTableSchema,
  tableStatusSchema,
  updateTableSchema,
  UserRole,
  type CreateTableInput,
  type TableStatusInput,
  type UpdateTableInput,
} from '@cafe/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Roles } from '../auth/decorators/roles.decorator';
import { TablesService } from './tables.service';

@ApiTags('tables')
@ApiBearerAuth()
@Controller('tables')
export class TablesController {
  constructor(private readonly tables: TablesService) {}

  // Viewing is allowed for all front-of-house + kitchen roles.
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER, UserRole.WAITER, UserRole.KITCHEN)
  @Get()
  list(@Query('outletId') outletId?: string) {
    return this.tables.list(outletId);
  }

  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER, UserRole.WAITER, UserRole.KITCHEN)
  @Get(':id')
  get(@Param('id') id: string) {
    return this.tables.get(id);
  }

  // Managing the floor plan is restricted to owner/manager.
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Post()
  create(@Body(new ZodValidationPipe(createTableSchema)) body: CreateTableInput) {
    return this.tables.create(body);
  }

  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateTableSchema)) body: UpdateTableInput,
  ) {
    return this.tables.update(id, body);
  }

  // Status changes are common during service, so cashier/waiter can do them too.
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER, UserRole.WAITER)
  @Patch(':id/status')
  setStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(tableStatusSchema)) body: TableStatusInput,
  ) {
    return this.tables.setStatus(id, body.status);
  }

  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tables.remove(id);
  }
}
