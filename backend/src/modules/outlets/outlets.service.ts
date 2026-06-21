import { Injectable, NotFoundException } from '@nestjs/common';
import type { UpdateOutletInput } from '@cafe/shared';
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

  /** Update a tenant-owned outlet's details. */
  async update(id: string, input: UpdateOutletInput) {
    await this.get(id);
    return this.prisma.outlet.update({
      where: { id },
      data: {
        name: input.name,
        addressLine: input.addressLine,
        city: input.city,
        state: input.state,
        postalCode: input.postalCode,
        phone: input.phone,
        email: input.email,
        serviceTypes: input.serviceTypes,
        currency: input.currency,
        timezone: input.timezone,
        seatingCapacity: input.seatingCapacity,
      },
    });
  }
}
