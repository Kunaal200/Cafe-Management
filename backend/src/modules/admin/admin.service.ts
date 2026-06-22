import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Platform-admin (super_admin) operations. These intentionally span ALL tenants,
 * so they query Prisma directly without tenant scoping. Only the super_admin role
 * can reach them (enforced by the controller's @Roles guard).
 */
@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /** Platform-wide totals for the admin dashboard. */
  async stats() {
    const [tenants, active, trial, outlets, orders] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { status: 'active' } }),
      this.prisma.subscription.count({ where: { status: 'trial' } }),
      this.prisma.outlet.count(),
      this.prisma.order.count(),
    ]);
    return { tenants, active, trial, outlets, orders };
  }

  /** All tenants with summary counts. */
  async listTenants() {
    const tenants = await this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { outlets: true, users: true } },
        subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    return tenants.map((t) => ({
      id: t.id,
      name: t.name,
      subdomain: t.subdomain,
      businessType: t.businessType,
      country: t.country,
      status: t.status,
      plan: t.plan,
      createdAt: t.createdAt,
      outlets: t._count.outlets,
      users: t._count.users,
      subscription: t.subscriptions[0]
        ? { plan: t.subscriptions[0].plan, status: t.subscriptions[0].status }
        : null,
    }));
  }

  /** Full detail for one tenant. */
  async getTenant(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        outlets: { orderBy: { createdAt: 'asc' } },
        subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { users: true, menuItems: true, outlets: true } },
      },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const [orderCount, staff] = await Promise.all([
      this.prisma.order.count({ where: { tenantId: id } }),
      this.prisma.user.findMany({
        where: { tenantId: id, role: { not: 'owner' } },
        select: { id: true, fullName: true, username: true, role: true, isActive: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return {
      id: tenant.id,
      name: tenant.name,
      subdomain: tenant.subdomain,
      businessType: tenant.businessType,
      country: tenant.country,
      status: tenant.status,
      plan: tenant.plan,
      createdAt: tenant.createdAt,
      counts: {
        outlets: tenant._count.outlets,
        users: tenant._count.users,
        menuItems: tenant._count.menuItems,
        orders: orderCount,
      },
      subscription: tenant.subscriptions[0] ?? null,
      outlets: tenant.outlets.map((o) => ({
        id: o.id,
        name: o.name,
        city: o.city,
        currency: o.currency,
      })),
      staff,
    };
  }
}
