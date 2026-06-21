import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TaxMode as PrismaTaxMode } from '@prisma/client';
import type {
  BusinessDetailsInput,
  LocalizationInput,
  MenuSeedInput,
  OutletInput,
  TablesSeedInput,
} from '@cafe/shared';
import { TenantStatus, UserRole } from '@cafe/shared';
import { PrismaService } from '../../common/prisma/prisma.service';
import { getTenantIdOrThrow } from '../../common/tenancy/tenant-context';
import { AuthService, type TokenPair } from '../auth/auth.service';

const TRIAL_DAYS = 14;

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  /** Is a subdomain still available? */
  async isSubdomainAvailable(subdomain: string): Promise<{ available: boolean }> {
    const existing = await this.prisma.tenant.findUnique({ where: { subdomain } });
    return { available: !existing };
  }

  /**
   * Step 2 — create the tenant for the signed-up owner, link the user to it,
   * start a trial subscription, and re-issue tokens carrying the new tenantId.
   */
  async createBusiness(
    userId: string,
    input: BusinessDetailsInput,
  ): Promise<{ tenantId: string; tokens: TokenPair }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Editing during onboarding: if the user already has a tenant, update its
    // business details in place instead of creating a second one.
    if (user.tenantId) {
      const subdomainOwner = await this.prisma.tenant.findUnique({
        where: { subdomain: input.subdomain },
      });
      if (subdomainOwner && subdomainOwner.id !== user.tenantId) {
        throw new ConflictException('Subdomain is already taken');
      }
      const updated = await this.prisma.tenant.update({
        where: { id: user.tenantId },
        data: {
          name: input.businessName,
          subdomain: input.subdomain,
          businessType: input.businessType,
          country: input.country,
          logoUrl: input.logoUrl,
        },
      });
      const tokens = await this.auth.issueTokensForUser({
        id: user.id,
        tenantId: updated.id,
        role: user.role,
        email: user.email ?? '',
      });
      return { tenantId: updated.id, tokens };
    }

    const subdomainTaken = await this.prisma.tenant.findUnique({
      where: { subdomain: input.subdomain },
    });
    if (subdomainTaken) {
      throw new ConflictException('Subdomain is already taken');
    }

    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    const tenant = await this.prisma.$transaction(async (tx) => {
      const createdTenant = await tx.tenant.create({
        data: {
          name: input.businessName,
          subdomain: input.subdomain,
          businessType: input.businessType,
          country: input.country,
          logoUrl: input.logoUrl,
          status: TenantStatus.CONFIGURING,
          plan: 'trial',
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { tenantId: createdTenant.id, role: UserRole.OWNER },
      });

      await tx.subscription.create({
        data: {
          tenantId: createdTenant.id,
          plan: 'trial',
          status: 'trial',
          billingCycle: 'monthly',
          trialEndsAt,
        },
      });

      return createdTenant;
    });

    const tokens = await this.auth.issueTokensForUser({
      id: user.id,
      tenantId: tenant.id,
      role: UserRole.OWNER,
      email: user.email ?? '',
    });

    return { tenantId: tenant.id, tokens };
  }

  /** Step 3 — create the first outlet under the current tenant. */
  async createOutlet(input: OutletInput) {
    const tenantId = getTenantIdOrThrow();
    return this.prisma.outlet.create({
      data: {
        tenantId,
        name: input.name,
        addressLine: input.addressLine,
        city: input.city,
        state: input.state,
        postalCode: input.postalCode,
        phone: input.phone,
        email: input.email,
        serviceTypes: input.serviceTypes,
        seatingCapacity: input.seatingCapacity,
      },
    });
  }

  /** Step 4 — set localization/tax: upsert the tax rule and update the outlet currency/timezone.
   * Re-running (e.g. after going back to edit) updates rather than duplicating. */
  async setLocalization(outletId: string, input: LocalizationInput) {
    const tenantId = getTenantIdOrThrow();
    const outlet = await this.prisma.outlet.findFirst({ where: { id: outletId, tenantId } });
    if (!outlet) {
      throw new NotFoundException('Outlet not found');
    }

    const existingTaxRule = await this.prisma.taxRule.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });

    const [taxRule, updatedOutlet] = await this.prisma.$transaction([
      existingTaxRule
        ? this.prisma.taxRule.update({
            where: { id: existingTaxRule.id },
            data: {
              name: input.taxName,
              rate: input.taxRate,
              mode: input.taxMode as PrismaTaxMode,
              regNumber: input.taxRegistrationNumber,
            },
          })
        : this.prisma.taxRule.create({
            data: {
              tenantId,
              name: input.taxName,
              rate: input.taxRate,
              mode: input.taxMode as PrismaTaxMode,
              regNumber: input.taxRegistrationNumber,
            },
          }),
      this.prisma.outlet.update({
        where: { id: outletId },
        data: { currency: input.currency, timezone: input.timezone },
      }),
    ]);

    return { taxRule, outlet: updatedOutlet };
  }

  /** Step 5 — seed the menu: create categories with their items and optional
   * one-level subcategories, linking the tenant's tax rule if any. */
  async seedMenu(input: MenuSeedInput) {
    const tenantId = getTenantIdOrThrow();
    const taxRule = await this.prisma.taxRule.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });

    const createItems = (categoryId: string, items: { name: string; price: number; isVeg?: boolean }[]) =>
      items.length > 0
        ? this.prisma.menuItem.createMany({
            data: items.map((item) => ({
              tenantId,
              categoryId,
              name: item.name,
              price: item.price,
              isVeg: item.isVeg,
              taxRuleId: taxRule?.id,
            })),
          })
        : Promise.resolve(null);

    const created = [];
    for (let i = 0; i < input.categories.length; i += 1) {
      const cat = input.categories[i];
      const category = await this.prisma.menuCategory.create({
        data: { tenantId, name: cat.name, sortOrder: i },
      });
      await createItems(category.id, cat.items);

      const subcategories = cat.subcategories ?? [];
      for (let j = 0; j < subcategories.length; j += 1) {
        const sub = subcategories[j];
        const subcategory = await this.prisma.menuCategory.create({
          data: { tenantId, parentId: category.id, name: sub.name, sortOrder: j },
        });
        await createItems(subcategory.id, sub.items);
      }

      created.push({
        categoryId: category.id,
        name: category.name,
        items: cat.items.length,
        subcategories: subcategories.length,
      });
    }

    return { categories: created };
  }

  /** Step 6 — quick table setup: auto-generate N tables (T1..Tn) for an outlet. */
  async seedTables(outletId: string, input: TablesSeedInput) {
    const tenantId = getTenantIdOrThrow();
    const outlet = await this.prisma.outlet.findFirst({ where: { id: outletId, tenantId } });
    if (!outlet) {
      throw new NotFoundException('Outlet not found');
    }

    const data = Array.from({ length: input.count }, (_, idx) => ({
      tenantId,
      outletId,
      name: `T${idx + 1}`,
      area: input.area,
      capacity: input.capacity ?? 2,
    }));

    const result = await this.prisma.restaurantTable.createMany({ data });
    return { created: result.count };
  }

  /** Step 9 — mark onboarding complete; tenant becomes active. */
  async complete() {
    const tenantId = getTenantIdOrThrow();
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    if (tenant.status === TenantStatus.ACTIVE) {
      throw new BadRequestException('Onboarding already completed');
    }
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { status: TenantStatus.ACTIVE },
    });
  }
}
