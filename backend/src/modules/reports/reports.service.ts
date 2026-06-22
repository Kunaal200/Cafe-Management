import { Injectable } from '@nestjs/common';
import {
  OrderStatus as PrismaOrderStatus,
  PaymentStatus as PrismaPaymentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { getTenantIdOrThrow } from '../../common/tenancy/tenant-context';

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface SummaryFilters {
  outletId?: string;
  from?: string;
  to?: string;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Richer analytics for the owner dashboard: order/revenue growth vs the prior
   * period, hourly distribution, staff performance, and menu category performance.
   */
  async analytics(filters: SummaryFilters) {
    const tenantId = getTenantIdOrThrow();

    const now = new Date();
    const from = filters.from ? new Date(filters.from) : undefined;
    const fromValid = from && !Number.isNaN(from.getTime()) ? from : undefined;

    const baseWhere: Prisma.OrderWhereInput = {
      tenantId,
      status: PrismaOrderStatus.completed,
      ...(filters.outletId ? { outletId: filters.outletId } : {}),
    };

    const current = await this.prisma.order.findMany({
      where: { ...baseWhere, ...(fromValid ? { createdAt: { gte: fromValid } } : {}) },
      include: { items: true, createdBy: { select: { id: true, fullName: true } } },
    });

    // Prior period of equal length, for growth comparison.
    let prevRevenue = 0;
    let prevOrders = 0;
    if (fromValid) {
      const windowMs = now.getTime() - fromValid.getTime();
      const prevFrom = new Date(fromValid.getTime() - windowMs);
      const prev = await this.prisma.order.findMany({
        where: { ...baseWhere, createdAt: { gte: prevFrom, lt: fromValid } },
        select: { total: true },
      });
      prevOrders = prev.length;
      prevRevenue = prev.reduce((sum, o) => sum + Number(o.total), 0);
    }

    const revenue = current.reduce((sum, o) => sum + Number(o.total), 0);
    const orderCount = current.length;

    // Hourly distribution (0–23) by order count.
    const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: h, orders: 0, revenue: 0 }));
    // Staff performance by who created the order.
    const staffMap = new Map<string, { name: string; orders: number; revenue: number }>();
    // Category performance via each item's category.
    const itemIds = new Set<string>();

    for (const o of current) {
      const h = o.createdAt.getHours();
      hourly[h].orders += 1;
      hourly[h].revenue += Number(o.total);

      const who = o.createdBy;
      if (who) {
        const cur = staffMap.get(who.id) ?? { name: who.fullName, orders: 0, revenue: 0 };
        cur.orders += 1;
        cur.revenue += Number(o.total);
        staffMap.set(who.id, cur);
      }
      for (const it of o.items) {
        if (it.menuItemId) itemIds.add(it.menuItemId);
      }
    }

    // Map menu items -> category names for category performance.
    const menuItems = itemIds.size
      ? await this.prisma.menuItem.findMany({
          where: { id: { in: [...itemIds] } },
          select: { id: true, categoryId: true, category: { select: { name: true } } },
        })
      : [];
    const categoryByItem = new Map(menuItems.map((m) => [m.id, m.category?.name ?? 'Uncategorized']));
    const categoryMap = new Map<string, { qty: number; revenue: number }>();
    for (const o of current) {
      for (const it of o.items) {
        const cat = (it.menuItemId && categoryByItem.get(it.menuItemId)) || 'Uncategorized';
        const cur = categoryMap.get(cat) ?? { qty: 0, revenue: 0 };
        cur.qty += it.qty;
        cur.revenue += Number(it.unitPrice) * it.qty;
        categoryMap.set(cat, cur);
      }
    }

    const growth = (curr: number, prev: number): number | null =>
      prev > 0 ? round2(((curr - prev) / prev) * 100) : null;

    return {
      revenue: round2(revenue),
      orderCount,
      revenueGrowthPct: growth(revenue, prevRevenue),
      orderGrowthPct: growth(orderCount, prevOrders),
      hourly,
      staff: [...staffMap.values()]
        .map((s) => ({ ...s, revenue: round2(s.revenue) }))
        .sort((a, b) => b.revenue - a.revenue),
      categories: [...categoryMap.entries()]
        .map(([name, v]) => ({ name, qty: v.qty, revenue: round2(v.revenue) }))
        .sort((a, b) => b.revenue - a.revenue),
    };
  }

  /**
   * Sales summary for completed orders: revenue, order count, average value,
   * payment-method mix, daily series, top items, and order-type breakdown.
   */
  async summary(filters: SummaryFilters) {
    const tenantId = getTenantIdOrThrow();

    const from = filters.from ? new Date(filters.from) : undefined;
    const to = filters.to ? new Date(filters.to) : undefined;
    const createdAt: Prisma.DateTimeFilter = {};
    if (from && !Number.isNaN(from.getTime())) createdAt.gte = from;
    if (to && !Number.isNaN(to.getTime())) createdAt.lte = to;

    const where: Prisma.OrderWhereInput = {
      tenantId,
      status: PrismaOrderStatus.completed,
      ...(filters.outletId ? { outletId: filters.outletId } : {}),
      ...(createdAt.gte || createdAt.lte ? { createdAt } : {}),
    };

    const orders = await this.prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    });

    const orderCount = orders.length;
    const revenue = round2(orders.reduce((sum, o) => sum + Number(o.total), 0));
    const avgOrderValue = orderCount ? round2(revenue / orderCount) : 0;

    // Daily revenue + order count.
    const dailyMap = new Map<string, { revenue: number; orders: number }>();
    // Order-type counts.
    const typeMap = new Map<string, number>();
    // Top items by quantity.
    const itemMap = new Map<string, { qty: number; revenue: number }>();

    for (const o of orders) {
      const key = dayKey(o.createdAt);
      const day = dailyMap.get(key) ?? { revenue: 0, orders: 0 };
      day.revenue += Number(o.total);
      day.orders += 1;
      dailyMap.set(key, day);

      typeMap.set(o.type, (typeMap.get(o.type) ?? 0) + 1);

      for (const it of o.items) {
        const cur = itemMap.get(it.name) ?? { qty: 0, revenue: 0 };
        cur.qty += it.qty;
        cur.revenue += Number(it.unitPrice) * it.qty;
        itemMap.set(it.name, cur);
      }
    }

    // Payment-method mix across the completed orders.
    const orderIds = orders.map((o) => o.id);
    const payments = orderIds.length
      ? await this.prisma.payment.findMany({
          where: {
            tenantId,
            status: PrismaPaymentStatus.paid,
            orderId: { in: orderIds },
          },
          select: { method: true, amount: true },
        })
      : [];

    const payMap = new Map<string, { amount: number; count: number }>();
    for (const p of payments) {
      const cur = payMap.get(p.method) ?? { amount: 0, count: 0 };
      cur.amount += Number(p.amount);
      cur.count += 1;
      payMap.set(p.method, cur);
    }

    return {
      range: { from: createdAt.gte ?? null, to: createdAt.lte ?? null },
      revenue,
      orderCount,
      avgOrderValue,
      paymentMix: [...payMap.entries()]
        .map(([method, v]) => ({ method, amount: round2(v.amount), count: v.count }))
        .sort((a, b) => b.amount - a.amount),
      daily: [...dailyMap.entries()]
        .map(([date, v]) => ({ date, revenue: round2(v.revenue), orders: v.orders }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      topItems: [...itemMap.entries()]
        .map(([name, v]) => ({ name, qty: v.qty, revenue: round2(v.revenue) }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 10),
      orderTypes: [...typeMap.entries()].map(([type, count]) => ({ type, count })),
    };
  }
}
