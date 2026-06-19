import { Injectable, NotFoundException } from '@nestjs/common';
import { TableStatus as PrismaTableStatus } from '@prisma/client';
import type { CreateTableInput, UpdateTableInput } from '@cafe/shared';
import { PrismaService } from '../../common/prisma/prisma.service';
import { getTenantIdOrThrow } from '../../common/tenancy/tenant-context';

@Injectable()
export class TablesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateTableInput) {
    const tenantId = getTenantIdOrThrow();
    await this.assertOutletOwned(input.outletId);
    return this.prisma.restaurantTable.create({
      data: {
        tenantId,
        outletId: input.outletId,
        name: input.name,
        area: input.area,
        capacity: input.capacity ?? 2,
      },
    });
  }

  /** List tables for the tenant, optionally filtered by outlet. */
  list(outletId?: string) {
    const tenantId = getTenantIdOrThrow();
    return this.prisma.restaurantTable.findMany({
      where: { tenantId, ...(outletId ? { outletId } : {}) },
      orderBy: { name: 'asc' },
    });
  }

  async get(id: string) {
    return this.findOwned(id);
  }

  async update(id: string, input: UpdateTableInput) {
    await this.findOwned(id);
    return this.prisma.restaurantTable.update({
      where: { id },
      data: {
        name: input.name,
        area: input.area,
        capacity: input.capacity,
        status: input.status as PrismaTableStatus | undefined,
      },
    });
  }

  async setStatus(id: string, status: string) {
    await this.findOwned(id);
    return this.prisma.restaurantTable.update({
      where: { id },
      data: { status: status as PrismaTableStatus },
    });
  }

  async remove(id: string) {
    await this.findOwned(id);
    await this.prisma.restaurantTable.delete({ where: { id } });
    return { deleted: true };
  }

  // ---- helpers (tenant isolation) ----

  private async findOwned(id: string) {
    const tenantId = getTenantIdOrThrow();
    const table = await this.prisma.restaurantTable.findFirst({ where: { id, tenantId } });
    if (!table) {
      throw new NotFoundException('Table not found');
    }
    return table;
  }

  private async assertOutletOwned(outletId: string): Promise<void> {
    const tenantId = getTenantIdOrThrow();
    const outlet = await this.prisma.outlet.findFirst({ where: { id: outletId, tenantId } });
    if (!outlet) {
      throw new NotFoundException('Outlet not found');
    }
  }
}
