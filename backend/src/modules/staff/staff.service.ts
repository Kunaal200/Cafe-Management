import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { Prisma, UserRole as PrismaUserRole } from '@prisma/client';
import type { CreateStaffInput, UpdateStaffInput } from '@cafe/shared';
import { PrismaService } from '../../common/prisma/prisma.service';
import { getTenantIdOrThrow } from '../../common/tenancy/tenant-context';

/** Fields safe to return to clients (never the password hash). */
const STAFF_SELECT = {
  id: true,
  fullName: true,
  username: true,
  email: true,
  phone: true,
  role: true,
  outletId: true,
  isActive: true,
  posPin: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  /** Owner/manager creates a staff account that logs in by username + password. */
  async create(input: CreateStaffInput) {
    const tenantId = getTenantIdOrThrow();

    const existing = await this.prisma.user.findFirst({
      where: { tenantId, username: input.username },
    });
    if (existing) {
      throw new ConflictException('Username is already taken');
    }

    if (input.outletId) {
      await this.assertOutletOwned(input.outletId);
    }

    const passwordHash = await argon2.hash(input.password);
    return this.prisma.user.create({
      data: {
        tenantId,
        fullName: input.fullName,
        username: input.username,
        phone: input.phone,
        passwordHash,
        role: input.role as PrismaUserRole,
        outletId: input.outletId,
        posPin: input.posPin,
        isVerified: true,
        isActive: true,
      },
      select: STAFF_SELECT,
    });
  }

  /** List all staff for the current tenant (owners excluded — they are account holders, not staff). */
  list() {
    const tenantId = getTenantIdOrThrow();
    return this.prisma.user.findMany({
      where: { tenantId, role: { not: PrismaUserRole.owner } },
      select: STAFF_SELECT,
      orderBy: { createdAt: 'asc' },
    });
  }

  async get(id: string) {
    const staff = await this.findOwnedStaff(id);
    return staff;
  }

  async update(id: string, input: UpdateStaffInput) {
    await this.findOwnedStaff(id);
    if (input.outletId) {
      await this.assertOutletOwned(input.outletId);
    }
    return this.prisma.user.update({
      where: { id },
      data: {
        fullName: input.fullName,
        role: input.role as PrismaUserRole | undefined,
        outletId: input.outletId,
        phone: input.phone,
        posPin: input.posPin,
        isActive: input.isActive,
      },
      select: STAFF_SELECT,
    });
  }

  async resetPassword(id: string, password: string) {
    await this.findOwnedStaff(id);
    const passwordHash = await argon2.hash(password);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    return { reset: true };
  }

  async remove(id: string) {
    await this.findOwnedStaff(id);
    await this.prisma.user.delete({ where: { id } });
    return { deleted: true };
  }

  // ---- helpers (tenant isolation) ----

  private async findOwnedStaff(id: string) {
    const tenantId = getTenantIdOrThrow();
    const staff = await this.prisma.user.findFirst({
      where: { id, tenantId, role: { not: PrismaUserRole.owner } },
      select: STAFF_SELECT,
    });
    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }
    return staff;
  }

  private async assertOutletOwned(outletId: string): Promise<void> {
    const tenantId = getTenantIdOrThrow();
    const outlet = await this.prisma.outlet.findFirst({ where: { id: outletId, tenantId } });
    if (!outlet) {
      throw new NotFoundException('Outlet not found');
    }
  }
}
