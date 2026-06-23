import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateCouponInput, UpdateCouponInput } from '@cafe/shared';
import { PrismaService } from '../../common/prisma/prisma.service';
import { getTenantIdOrThrow } from '../../common/tenancy/tenant-context';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class CouponsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
  ) {}

  list() {
    const tenantId = getTenantIdOrThrow();
    return this.prisma.coupon.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(input: CreateCouponInput) {
    const tenantId = getTenantIdOrThrow();
    const code = input.code.toUpperCase();
    const existing = await this.prisma.coupon.findFirst({ where: { tenantId, code } });
    if (existing) {
      throw new BadRequestException('A coupon with this code already exists');
    }
    if (input.customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: input.customerId, tenantId },
      });
      if (!customer) throw new NotFoundException('Customer not found');
    }
    return this.prisma.coupon.create({
      data: {
        tenantId,
        code,
        type: input.type,
        value: input.value,
        minOrder: input.minOrder,
        maxRedemptions: input.maxRedemptions,
        customerId: input.customerId,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
      },
    });
  }

  async update(id: string, input: UpdateCouponInput) {
    await this.findOwned(id);
    return this.prisma.coupon.update({
      where: { id },
      data: {
        value: input.value,
        minOrder: input.minOrder,
        maxRedemptions: input.maxRedemptions,
        expiresAt: input.expiresAt === null ? null : input.expiresAt ? new Date(input.expiresAt) : undefined,
        isActive: input.isActive,
      },
    });
  }

  async remove(id: string) {
    await this.findOwned(id);
    await this.prisma.coupon.delete({ where: { id } });
    return { deleted: true };
  }

  /**
   * Validate a coupon against an order and apply it as the order discount.
   * Validates active state, expiry, redemption cap, minimum order, and (if the
   * coupon is customer-specific) that the order belongs to that customer.
   */
  async applyToOrder(orderId: string, code: string) {
    const tenantId = getTenantIdOrThrow();
    const order = await this.prisma.order.findFirst({ where: { id: orderId, tenantId } });
    if (!order) throw new NotFoundException('Order not found');

    const coupon = await this.prisma.coupon.findFirst({
      where: { tenantId, code: code.toUpperCase() },
    });
    if (!coupon || !coupon.isActive) {
      throw new BadRequestException('Invalid coupon code');
    }
    if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('This coupon has expired');
    }
    if (coupon.maxRedemptions != null && coupon.redeemedCount >= coupon.maxRedemptions) {
      throw new BadRequestException('This coupon has reached its redemption limit');
    }
    if (coupon.customerId && coupon.customerId !== order.customerId) {
      throw new BadRequestException('This coupon is not valid for this customer');
    }
    const subtotal = Number(order.subtotal);
    if (coupon.minOrder != null && subtotal < Number(coupon.minOrder)) {
      throw new BadRequestException(`Order must be at least ${Number(coupon.minOrder)} to use this coupon`);
    }

    // Apply as the order discount (reuses the validated discount logic).
    await this.orders.applyDiscount(orderId, coupon.type as 'amount' | 'percent', Number(coupon.value));

    // Record the code + count the redemption once per order.
    if (order.couponCode !== coupon.code) {
      await this.prisma.$transaction([
        this.prisma.order.update({ where: { id: orderId }, data: { couponCode: coupon.code } }),
        this.prisma.coupon.update({
          where: { id: coupon.id },
          data: { redeemedCount: { increment: 1 } },
        }),
      ]);
    }

    return this.orders.detail(orderId);
  }

  private async findOwned(id: string) {
    const tenantId = getTenantIdOrThrow();
    const coupon = await this.prisma.coupon.findFirst({ where: { id, tenantId } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return coupon;
  }
}
