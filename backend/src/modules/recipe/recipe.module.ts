import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { RecipeController } from './recipe.controller';
import { RecipeService } from './recipe.service';

@Module({
  imports: [InventoryModule],
  controllers: [RecipeController],
  providers: [RecipeService],
})
export class RecipeModule {}
