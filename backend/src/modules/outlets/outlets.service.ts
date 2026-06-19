import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { getTenantIdOrThrow } from '../../common/tenancy/tenant-context';

@Injectable()
export class OutletsService {
  constructor(private readonly prisma: PrismaService) {}

  /** List all outlets for the current tenant. */
  list() {
    const tenantId = getTenantIdOrThrow();
    return this.prisma.outlet.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** A single tenant-owned outlet. */
  async get(id: string) {
    const tenantId = getTenantIdOrThrow();
    const outlet = await this.prisma.outlet.findFirst({ where: { id, tenantId } });
    if (!outlet) {
      throw new NotFoundException('Outlet not found');
    }
    return outlet;
  }
}
