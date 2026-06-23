import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { setRecipeSchema, UserRole, type SetRecipeInput } from '@cafe/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Roles } from '../auth/decorators/roles.decorator';
import { RecipeService } from './recipe.service';

@ApiTags('recipe')
@ApiBearerAuth()
@Roles(UserRole.OWNER, UserRole.MANAGER)
@Controller('recipe')
export class RecipeController {
  constructor(private readonly recipe: RecipeService) {}

  // Cost + margin per menu item (static path before :menuItemId).
  @Get('margins')
  margins() {
    return this.recipe.margins();
  }

  @Get(':menuItemId')
  getRecipe(@Param('menuItemId') menuItemId: string) {
    return this.recipe.getRecipe(menuItemId);
  }

  @Put(':menuItemId')
  setRecipe(
    @Param('menuItemId') menuItemId: string,
    @Body(new ZodValidationPipe(setRecipeSchema)) body: SetRecipeInput,
  ) {
    return this.recipe.setRecipe(menuItemId, body);
  }
}
