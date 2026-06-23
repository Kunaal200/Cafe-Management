import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { SetRecipeInput } from '@cafe/shared';
import { PrismaService } from '../../common/prisma/prisma.service';
import { getTenantIdOrThrow } from '../../common/tenancy/tenant-context';
import { InventoryService } from '../inventory/inventory.service';

const LOW_MARGIN_THRESHOLD = 70; // gross margin % below which an item is flagged

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

@Injectable()
export class RecipeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
  ) {}

  /** The recipe (ingredients) for a menu item, with each ingredient's name/unit. */
  async getRecipe(menuItemId: string) {
    const tenantId = getTenantIdOrThrow();
    await this.assertMenuItem(menuItemId, tenantId);
    return this.prisma.recipeIngredient.findMany({
      where: { menuItemId, tenantId },
      include: { inventoryItem: { select: { id: true, name: true, unit: true } } },
    });
  }

  /** Replace a menu item's recipe with the given ingredient list. */
  async setRecipe(menuItemId: string, input: SetRecipeInput) {
    const tenantId = getTenantIdOrThrow();
    await this.assertMenuItem(menuItemId, tenantId);

    // Validate all inventory items belong to the tenant.
    const ids = input.ingredients.map((i) => i.inventoryItemId);
    if (ids.length) {
      const owned = await this.prisma.inventoryItem.findMany({
        where: { tenantId, id: { in: ids } },
        select: { id: true },
      });
      if (owned.length !== new Set(ids).size) {
        throw new BadRequestException('One or more ingredients are invalid');
      }
    }

    await this.prisma.$transaction([
      this.prisma.recipeIngredient.deleteMany({ where: { menuItemId, tenantId } }),
      ...input.ingredients.map((i) =>
        this.prisma.recipeIngredient.create({
          data: { tenantId, menuItemId, inventoryItemId: i.inventoryItemId, qty: i.qty },
        }),
      ),
    ]);
    return this.getRecipe(menuItemId);
  }

  /**
   * Live cost + margin per menu item. Cost = sum(ingredient qty × current unit cost);
   * margin% = (price − cost) / price. Items with a recipe and margin below the
   * threshold are flagged so the owner sees eroding profitability immediately.
   */
  async margins() {
    const tenantId = getTenantIdOrThrow();
    const [menuItems, recipes, costByItem] = await Promise.all([
      this.prisma.menuItem.findMany({
        where: { tenantId },
        select: { id: true, name: true, price: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.recipeIngredient.findMany({ where: { tenantId } }),
      this.inventory.unitCostByItem(tenantId),
    ]);

    const recipeByMenu = new Map<string, typeof recipes>();
    for (const r of recipes) {
      const list = recipeByMenu.get(r.menuItemId) ?? [];
      list.push(r);
      recipeByMenu.set(r.menuItemId, list);
    }

    return menuItems.map((m) => {
      const ingredients = recipeByMenu.get(m.id) ?? [];
      const cost = round2(
        ingredients.reduce((sum, r) => sum + Number(r.qty) * (costByItem.get(r.inventoryItemId) ?? 0), 0),
      );
      const price = Number(m.price);
      const hasRecipe = ingredients.length > 0;
      const profit = round2(price - cost);
      const marginPct = hasRecipe && price > 0 ? round2(((price - cost) / price) * 100) : null;
      return {
        menuItemId: m.id,
        name: m.name,
        price: round2(price),
        cost,
        profit,
        marginPct,
        hasRecipe,
        lowMargin: marginPct != null && marginPct < LOW_MARGIN_THRESHOLD,
      };
    });
  }

  private async assertMenuItem(menuItemId: string, tenantId: string) {
    const item = await this.prisma.menuItem.findFirst({ where: { id: menuItemId, tenantId } });
    if (!item) throw new NotFoundException('Menu item not found');
    return item;
  }
}
