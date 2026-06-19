import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  OrderStatus as PrismaOrderStatus,
  OrderType as PrismaOrderType,
  PaymentMethod as PrismaPaymentMethod,
  PaymentStatus as PrismaPaymentStatus,
  TableStatus as PrismaTableStatus,
} from '@prisma/client';
import type { AddPaymentInput } from '@cafe/shared';
import { PrismaService } from '../../common/prisma/prisma.service';
import { getTenantIdOrThrow } from '../../common/tenancy/tenant-context';
import { OrdersService } from '../orders/orders.service';

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
  ) {}

  /** Record a payment against an order. Multiple payments form a split bill. */
  async addPayment(orderId: string, input: AddPaymentInput) {
    const order = await this.findOwnedOrder(orderId);
    if (order.status === PrismaOrderStatus.cancelled) {
      throw new BadRequestException('Cannot pay a cancelled order');
    }

    await this.prisma.payment.create({
      data: {
        tenantId: order.tenantId,
        orderId,
        method: input.method as PrismaPaymentMethod,
        amount: round2(input.amount),
        status: PrismaPaymentStatus.paid,
        reference: input.reference,
      },
    });

    return this.summary(orderId);
  }

  /** List payments and the outstanding balance for an order. */
  async summary(orderId: string) {
    await this.findOwnedOrder(orderId);
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    const paid = order.payments
      .filter((p) => p.status === PrismaPaymentStatus.paid)
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const total = Number(order.total);
    const balance = round2(total - paid);
    return {
      orderId,
      total,
      paid: round2(paid),
      balance,
      fullyPaid: balance <= 0,
      payments: order.payments,
    };
  }

  /**
   * Finalize the bill: requires the order to be fully paid, then marks it
   * completed and frees the table (for dine-in). This is the checkout step.
   */
  async finalize(orderId: string) {
    const order = await this.findOwnedOrder(orderId);
    if (order.status === PrismaOrderStatus.cancelled) {
      throw new BadRequestException('Cannot finalize a cancelled order');
    }
    if (order.status === PrismaOrderStatus.completed) {
      throw new BadRequestException('Order is already completed');
    }

    const { balance } = await this.summary(orderId);
    if (balance > 0) {
      throw new BadRequestException(`Order is not fully paid (balance ${balance})`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: PrismaOrderStatus.completed },
      });
      if (order.type === PrismaOrderType.dine_in && order.tableId) {
        await tx.restaurantTable.update({
          where: { id: order.tableId },
          data: { status: PrismaTableStatus.free },
        });
      }
    });

    return this.orders.detail(orderId);
  }

  // ---- helpers (tenant isolation) ----

  private async findOwnedOrder(orderId: string) {
    const tenantId = getTenantIdOrThrow();
    const order = await this.prisma.order.findFirst({ where: { id: orderId, tenantId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }
}
