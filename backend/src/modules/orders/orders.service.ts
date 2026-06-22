import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  OrderStatus as PrismaOrderStatus,
  OrderType as PrismaOrderType,
  TableStatus as PrismaTableStatus,
  Prisma,
} from '@prisma/client';
import type {
  AddOrderItemsInput,
  CreateOrderInput,
  OrderLineInput,
  UpdateOrderItemInput,
} from '@cafe/shared';
import { PrismaService } from '../../common/prisma/prisma.service';
import { getTenantContext, getTenantIdOrThrow } from '../../common/tenancy/tenant-context';

/**
 * Allowed order status transitions. Each key lists the statuses it may move to.
 * This is the single source of truth for the order lifecycle.
 */
const STATUS_TRANSITIONS: Record<string, PrismaOrderStatus[]> = {
  open: [PrismaOrderStatus.sent_to_kitchen, PrismaOrderStatus.cancelled],
  sent_to_kitchen: [PrismaOrderStatus.preparing, PrismaOrderStatus.cancelled],
  preparing: [PrismaOrderStatus.ready, PrismaOrderStatus.cancelled],
  ready: [PrismaOrderStatus.served],
  served: [PrismaOrderStatus.completed],
  completed: [],
  cancelled: [],
};

const TERMINAL_STATUSES: PrismaOrderStatus[] = [
  PrismaOrderStatus.completed,
  PrismaOrderStatus.cancelled,
];

/** Include used whenever we return a full order to the client. */
const ORDER_INCLUDE = {
  items: true,
  table: true,
  payments: true,
} satisfies Prisma.OrderInclude;

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Create an order, optionally with initial line items. */
  async create(input: CreateOrderInput) {
    const tenantId = getTenantIdOrThrow();
    const { userId } = getTenantContext();

    await this.assertOutletOwned(input.outletId);
    if (input.tableId) {
      await this.assertTableOwned(input.tableId);
    }

    const order = await this.prisma.order.create({
      data: {
        tenantId,
        outletId: input.outletId,
        tableId: input.tableId,
        customerId: input.customerId,
        createdById: userId ?? undefined,
        type: input.type as PrismaOrderType,
        status: PrismaOrderStatus.open,
        notes: input.notes,
      },
    });

    if (input.items && input.items.length > 0) {
      await this.insertItems(order.id, tenantId, input.items);
      await this.recomputeTotals(order.id);
    }

    return this.getDetail(order.id);
  }

  /** Add line items to an existing (non-terminal) order. */
  async addItems(orderId: string, input: AddOrderItemsInput) {
    const order = await this.findOwned(orderId);
    this.assertEditable(order.status);
    await this.insertItems(orderId, order.tenantId, input.items);
    await this.recomputeTotals(orderId);
    return this.getDetail(orderId);
  }

  /** Update a single line item's quantity/notes. */
  async updateItem(orderId: string, itemId: string, input: UpdateOrderItemInput) {
    const order = await this.findOwned(orderId);
    this.assertEditable(order.status);
    const item = await this.prisma.orderItem.findFirst({ where: { id: itemId, orderId } });
    if (!item) {
      throw new NotFoundException('Order item not found');
    }
    await this.prisma.orderItem.update({
      where: { id: itemId },
      data: { qty: input.qty, notes: input.notes ?? undefined },
    });
    await this.recomputeTotals(orderId);
    return this.getDetail(orderId);
  }

  /** Remove a line item from an order. */
  async removeItem(orderId: string, itemId: string) {
    const order = await this.findOwned(orderId);
    this.assertEditable(order.status);
    const item = await this.prisma.orderItem.findFirst({ where: { id: itemId, orderId } });
    if (!item) {
      throw new NotFoundException('Order item not found');
    }
    await this.prisma.orderItem.delete({ where: { id: itemId } });
    await this.recomputeTotals(orderId);
    return this.getDetail(orderId);
  }

  /** Send the order to the kitchen (KOT). Marks a dine-in table as occupied. */
  async sendToKitchen(orderId: string) {
    const order = await this.findOwned(orderId);
    if (order.status !== PrismaOrderStatus.open) {
      throw new BadRequestException('Only open orders can be sent to the kitchen');
    }
    const itemCount = await this.prisma.orderItem.count({ where: { orderId } });
    if (itemCount === 0) {
      throw new BadRequestException('Cannot send an empty order to the kitchen');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: PrismaOrderStatus.sent_to_kitchen },
      });
      if (order.type === PrismaOrderType.dine_in && order.tableId) {
        await tx.restaurantTable.update({
          where: { id: order.tableId },
          data: { status: PrismaTableStatus.occupied },
        });
      }
    });

    return this.getDetail(orderId);
  }

  /** Advance an order's status, validating the transition. Frees the table when closed. */
  async updateStatus(orderId: string, target: string) {
    const order = await this.findOwned(orderId);
    const allowed = STATUS_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(target as PrismaOrderStatus)) {
      throw new BadRequestException(
        `Cannot change status from '${order.status}' to '${target}'`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: target as PrismaOrderStatus },
      });
      const closing = TERMINAL_STATUSES.includes(target as PrismaOrderStatus);
      if (closing && order.type === PrismaOrderType.dine_in && order.tableId) {
        await tx.restaurantTable.update({
          where: { id: order.tableId },
          data: { status: PrismaTableStatus.free },
        });
      }
    });

    return this.getDetail(orderId);
  }

  /** List orders for the tenant, optionally filtered by outlet and/or status. */
  list(filters: { outletId?: string; status?: string }) {
    const tenantId = getTenantIdOrThrow();
    return this.prisma.order.findMany({
      where: {
        tenantId,
        ...(filters.outletId ? { outletId: filters.outletId } : {}),
        ...(filters.status ? { status: filters.status as PrismaOrderStatus } : {}),
      },
      include: { items: true, table: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Full order detail (items, table, payments). */
  async get(orderId: string) {
    await this.findOwned(orderId);
    return this.getDetail(orderId);
  }

  /** Apply a discount (flat amount or percent of gross) and recompute totals. */
  async applyDiscount(orderId: string, type: 'amount' | 'percent', value: number) {
    const order = await this.findOwned(orderId);
    this.assertEditable(order.status);
    const { subtotal, exclusiveTax } = await this.computeGross(orderId);
    const gross = subtotal + exclusiveTax;
    let discount = type === 'percent' ? (gross * value) / 100 : value;
    if (discount > gross) {
      discount = gross; // never discount below zero
    }
    await this.prisma.order.update({
      where: { id: orderId },
      data: { discount: round2(discount) },
    });
    await this.recomputeTotals(orderId);
    return this.getDetail(orderId);
  }

  /** Public accessor for other modules (e.g. payments) to fetch a tenant-owned order detail. */
  async detail(orderId: string) {
    await this.findOwned(orderId);
    return this.getDetail(orderId);
  }

  // ---- internals ----

  private getDetail(orderId: string) {
    return this.prisma.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE });
  }

  /** Snapshot name + price from the menu onto each order line (price stays fixed even if the menu changes later). */
  private async insertItems(orderId: string, tenantId: string, lines: OrderLineInput[]) {
    for (const line of lines) {
      const menuItem = await this.prisma.menuItem.findFirst({
        where: { id: line.menuItemId, tenantId },
      });
      if (!menuItem) {
        throw new BadRequestException(`Menu item ${line.menuItemId} not found`);
      }
      await this.prisma.orderItem.create({
        data: {
          tenantId,
          orderId,
          menuItemId: menuItem.id,
          name: menuItem.name,
          qty: line.qty,
          unitPrice: menuItem.price,
          notes: line.notes,
          modifiers: line.modifiers ? (line.modifiers as unknown as Prisma.InputJsonValue) : undefined,
        },
      });
    }
  }

  /**
   * Sum line totals and tax from the order's items.
   * Exclusive tax is added on top of the price; inclusive tax is already in the price.
   */
  private async computeGross(orderId: string): Promise<{
    subtotal: number;
    taxTotal: number;
    exclusiveTax: number;
  }> {
    const items = await this.prisma.orderItem.findMany({
      where: { orderId },
      include: { menuItem: { include: { taxRule: true } } },
    });

    let subtotal = 0;
    let taxTotal = 0;
    let exclusiveTax = 0;

    for (const item of items) {
      const line = Number(item.unitPrice) * item.qty;
      subtotal += line;
      const rule = item.menuItem?.taxRule;
      if (rule) {
        const rate = Number(rule.rate);
        if (rule.mode === 'exclusive') {
          const t = (line * rate) / 100;
          exclusiveTax += t;
          taxTotal += t;
        } else {
          // inclusive: tax portion already inside the line price
          taxTotal += line - line / (1 + rate / 100);
        }
      }
    }

    return { subtotal, taxTotal, exclusiveTax };
  }

  /** Recompute and persist subtotal/tax/total, applying any stored discount. */
  private async recomputeTotals(orderId: string) {
    const { subtotal, taxTotal, exclusiveTax } = await this.computeGross(orderId);
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    const discount = Number(order?.discount ?? 0);

    const total = subtotal + exclusiveTax - discount;
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        subtotal: round2(subtotal),
        taxTotal: round2(taxTotal),
        total: round2(total < 0 ? 0 : total),
      },
    });
  }

  private assertEditable(status: PrismaOrderStatus): void {
    if (TERMINAL_STATUSES.includes(status)) {
      throw new BadRequestException(`Cannot modify a ${status} order`);
    }
  }

  private async findOwned(orderId: string) {
    const tenantId = getTenantIdOrThrow();
    const order = await this.prisma.order.findFirst({ where: { id: orderId, tenantId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  private async assertOutletOwned(outletId: string): Promise<void> {
    const tenantId = getTenantIdOrThrow();
    const outlet = await this.prisma.outlet.findFirst({ where: { id: outletId, tenantId } });
    if (!outlet) {
      throw new NotFoundException('Outlet not found');
    }
  }

  private async assertTableOwned(tableId: string): Promise<void> {
    const tenantId = getTenantIdOrThrow();
    const table = await this.prisma.restaurantTable.findFirst({ where: { id: tableId, tenantId } });
    if (!table) {
      throw new NotFoundException('Table not found');
    }
  }
}
