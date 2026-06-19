import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  createStaffSchema,
  resetStaffPasswordSchema,
  updateStaffSchema,
  UserRole,
  type CreateStaffInput,
  type ResetStaffPasswordInput,
  type UpdateStaffInput,
} from '@cafe/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Roles } from '../auth/decorators/roles.decorator';
import { StaffService } from './staff.service';

@ApiTags('staff')
@ApiBearerAuth()
@Roles(UserRole.OWNER, UserRole.MANAGER)
@Controller('staff')
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  @Post()
  create(@Body(new ZodValidationPipe(createStaffSchema)) body: CreateStaffInput) {
    return this.staff.create(body);
  }

  @Get()
  list() {
    return this.staff.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.staff.get(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateStaffSchema)) body: UpdateStaffInput,
  ) {
    return this.staff.update(id, body);
  }

  @Patch(':id/password')
  resetPassword(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(resetStaffPasswordSchema)) body: ResetStaffPasswordInput,
  ) {
    return this.staff.resetPassword(id, body.password);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.staff.remove(id);
  }
}
