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
  createMenuCategorySchema,
  createMenuItemSchema,
  toggleAvailabilitySchema,
  updateMenuCategorySchema,
  updateMenuItemSchema,
  UserRole,
  type CreateMenuCategoryInput,
  type CreateMenuItemInput,
  type ToggleAvailabilityInput,
  type UpdateMenuCategoryInput,
  type UpdateMenuItemInput,
} from '@cafe/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Roles } from '../auth/decorators/roles.decorator';
import { MenuService } from './menu.service';

@ApiTags('menu')
@ApiBearerAuth()
@Roles(UserRole.OWNER, UserRole.MANAGER)
@Controller('menu')
export class MenuController {
  constructor(private readonly menu: MenuService) {}

  // ---- Categories ----

  @Post('categories')
  createCategory(
    @Body(new ZodValidationPipe(createMenuCategorySchema)) body: CreateMenuCategoryInput,
  ) {
    return this.menu.createCategory(body);
  }

  @Get('categories')
  listCategories() {
    return this.menu.listCategories();
  }

  @Get('categories/:id')
  getCategory(@Param('id') id: string) {
    return this.menu.getCategory(id);
  }

  @Patch('categories/:id')
  updateCategory(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateMenuCategorySchema)) body: UpdateMenuCategoryInput,
  ) {
    return this.menu.updateCategory(id, body);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.menu.deleteCategory(id);
  }

  // ---- Items ----

  @Post('items')
  createItem(@Body(new ZodValidationPipe(createMenuItemSchema)) body: CreateMenuItemInput) {
    return this.menu.createItem(body);
  }

  @Get('items')
  listItems(@Query('categoryId') categoryId?: string) {
    return this.menu.listItems(categoryId);
  }

  @Get('items/:id')
  getItem(@Param('id') id: string) {
    return this.menu.getItem(id);
  }

  @Patch('items/:id')
  updateItem(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateMenuItemSchema)) body: UpdateMenuItemInput,
  ) {
    return this.menu.updateItem(id, body);
  }

  @Patch('items/:id/availability')
  setAvailability(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(toggleAvailabilitySchema)) body: ToggleAvailabilityInput,
  ) {
    return this.menu.setAvailability(id, body.isAvailable);
  }

  @Delete('items/:id')
  deleteItem(@Param('id') id: string) {
    return this.menu.deleteItem(id);
  }
}
