import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateMenuCategoryInput,
  CreateMenuItemInput,
  UpdateMenuCategoryInput,
  UpdateMenuItemInput,
} from '@cafe/shared';
import { PrismaService } from '../../common/prisma/prisma.service';
import { getTenantIdOrThrow } from '../../common/tenancy/tenant-context';

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Categories ----

  createCategory(input: CreateMenuCategoryInput) {
    const tenantId = getTenantIdOrThrow();
    return this.prisma.menuCategory.create({
      data: {
        tenantId,
        name: input.name,
        sortOrder: input.sortOrder ?? 0,
        isActive: input.isActive ?? true,
      },
    });
  }

  listCategories() {
    const tenantId = getTenantIdOrThrow();
    return this.prisma.menuCategory.findMany({
      where: { tenantId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async getCategory(id: string) {
    const tenantId = getTenantIdOrThrow();
    const category = await this.prisma.menuCategory.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async updateCategory(id: string, input: UpdateMenuCategoryInput) {
    await this.assertCategoryOwned(id);
    return this.prisma.menuCategory.update({ where: { id }, data: input });
  }

  async deleteCategory(id: string) {
    await this.assertCategoryOwned(id);
    await this.prisma.menuCategory.delete({ where: { id } });
    return { deleted: true };
  }

  // ---- Items ----

  async createItem(input: CreateMenuItemInput) {
    const tenantId = getTenantIdOrThrow();
    await this.assertCategoryOwned(input.categoryId);
    if (input.taxRuleId) {
      await this.assertTaxRuleOwned(input.taxRuleId);
    }
    return this.prisma.menuItem.create({
      data: {
        tenantId,
        categoryId: input.categoryId,
        name: input.name,
        description: input.description,
        price: input.price,
        photoUrl: input.photoUrl,
        isVeg: input.isVeg,
        isSpicy: input.isSpicy ?? false,
        isSweet: input.isSweet ?? false,
        serves: input.serves,
        isAvailable: input.isAvailable ?? true,
        taxRuleId: input.taxRuleId,
      },
    });
  }

  listItems(categoryId?: string) {
    const tenantId = getTenantIdOrThrow();
    return this.prisma.menuItem.findMany({
      where: { tenantId, ...(categoryId ? { categoryId } : {}) },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getItem(id: string) {
    const tenantId = getTenantIdOrThrow();
    const item = await this.prisma.menuItem.findFirst({ where: { id, tenantId } });
    if (!item) {
      throw new NotFoundException('Menu item not found');
    }
    return item;
  }

  async updateItem(id: string, input: UpdateMenuItemInput) {
    await this.assertItemOwned(id);
    if (input.categoryId) {
      await this.assertCategoryOwned(input.categoryId);
    }
    if (input.taxRuleId) {
      await this.assertTaxRuleOwned(input.taxRuleId);
    }
    return this.prisma.menuItem.update({ where: { id }, data: input });
  }

  async deleteItem(id: string) {
    await this.assertItemOwned(id);
    await this.prisma.menuItem.delete({ where: { id } });
    return { deleted: true };
  }

  async setAvailability(id: string, isAvailable: boolean) {
    await this.assertItemOwned(id);
    return this.prisma.menuItem.update({ where: { id }, data: { isAvailable } });
  }

  // ---- Ownership guards (tenant isolation) ----

  private async assertCategoryOwned(id: string): Promise<void> {
    const tenantId = getTenantIdOrThrow();
    const found = await this.prisma.menuCategory.findFirst({ where: { id, tenantId } });
    if (!found) {
      throw new NotFoundException('Category not found');
    }
  }

  private async assertItemOwned(id: string): Promise<void> {
    const tenantId = getTenantIdOrThrow();
    const found = await this.prisma.menuItem.findFirst({ where: { id, tenantId } });
    if (!found) {
      throw new NotFoundException('Menu item not found');
    }
  }

  private async assertTaxRuleOwned(id: string): Promise<void> {
    const tenantId = getTenantIdOrThrow();
    const found = await this.prisma.taxRule.findFirst({ where: { id, tenantId } });
    if (!found) {
      throw new BadRequestException('Invalid tax rule for this tenant');
    }
  }
}
