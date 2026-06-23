import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus as PrismaOrderStatus } from '@prisma/client';
import type {
  CreateCustomerInput,
  CreateFeedbackInput,
  UpdateCustomerInput,
} from '@cafe/shared';
import { PrismaService } from '../../common/prisma/prisma.service';
import { getTenantIdOrThrow } from '../../common/tenancy/tenant-context';

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Customers with visit count and lifetime spend (from completed orders). */
  async list() {
    const tenantId = getTenantIdOrThrow();
    const customers = await this.prisma.customer.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        orders: {
          where: { status: PrismaOrderStatus.completed },
          select: { total: true },
        },
      },
    });
    return customers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      createdAt: c.createdAt,
      visits: c.orders.length,
      spend: round2(c.orders.reduce((sum, o) => sum + Number(o.total), 0)),
    }));
  }

  create(input: CreateCustomerInput) {
    const tenantId = getTenantIdOrThrow();
    return this.prisma.customer.create({
      data: { tenantId, name: input.name, phone: input.phone, email: input.email, notes: input.notes },
    });
  }

  async get(id: string) {
    const tenantId = getTenantIdOrThrow();
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
      include: {
        orders: { orderBy: { createdAt: 'desc' }, take: 20 },
        feedback: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    const completed = customer.orders.filter((o) => o.status === PrismaOrderStatus.completed);
    return {
      ...customer,
      stats: {
        visits: completed.length,
        spend: round2(completed.reduce((sum, o) => sum + Number(o.total), 0)),
      },
    };
  }

  async update(id: string, input: UpdateCustomerInput) {
    await this.findOwned(id);
    return this.prisma.customer.update({ where: { id }, data: input });
  }

  async remove(id: string) {
    await this.findOwned(id);
    await this.prisma.customer.delete({ where: { id } });
    return { deleted: true };
  }

  // ---- Feedback ----

  createFeedback(input: CreateFeedbackInput) {
    const tenantId = getTenantIdOrThrow();
    return this.prisma.feedback.create({
      data: {
        tenantId,
        rating: input.rating,
        comment: input.comment,
        customerId: input.customerId,
        orderId: input.orderId,
      },
    });
  }

  /** Feedback list + simple analysis: average rating and a 1–5 distribution. */
  async feedbackSummary() {
    const tenantId = getTenantIdOrThrow();
    const items = await this.prisma.feedback.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { name: true } } },
      take: 100,
    });
    const count = items.length;
    const average = count ? round2(items.reduce((s, f) => s + f.rating, 0) / count) : 0;
    const distribution = [1, 2, 3, 4, 5].map((star) => ({
      star,
      count: items.filter((f) => f.rating === star).length,
    }));
    return {
      count,
      average,
      distribution,
      recent: items.slice(0, 30).map((f) => ({
        id: f.id,
        rating: f.rating,
        comment: f.comment,
        customerName: f.customer?.name ?? null,
        createdAt: f.createdAt,
      })),
    };
  }

  private async findOwned(id: string) {
    const tenantId = getTenantIdOrThrow();
    const customer = await this.prisma.customer.findFirst({ where: { id, tenantId } });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }
}
