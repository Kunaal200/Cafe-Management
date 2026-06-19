import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentMethod as PrismaPaymentMethod, PaymentStatus as PrismaPaymentStatus } from '@prisma/client';
import type { OpenShiftInput } from '@cafe/shared';
import { PrismaService } from '../../common/prisma/prisma.service';
import { getTenantContext, getTenantIdOrThrow } from '../../common/tenancy/tenant-context';

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

@Injectable()
export class RegisterService {
  constructor(private readonly prisma: PrismaService) {}

  /** Open a shift for an outlet. Only one shift may be open per outlet at a time. */
  async open(input: OpenShiftInput) {
    const tenantId = getTenantIdOrThrow();
    const { userId } = getTenantContext();
    await this.assertOutletOwned(input.outletId);

    const alreadyOpen = await this.prisma.registerShift.findFirst({
      where: { tenantId, outletId: input.outletId, closedAt: null },
    });
    if (alreadyOpen) {
      throw new BadRequestException('A shift is already open for this outlet');
    }

    return this.prisma.registerShift.create({
      data: {
        tenantId,
        outletId: input.outletId,
        openedById: userId ?? undefined,
        openingCash: round2(input.openingCash),
      },
    });
  }

  /** Close a shift and reconcile counted cash against expected cash. */
  async close(shiftId: string, closingCash: number) {
    const shift = await this.findOwned(shiftId);
    if (shift.closedAt) {
      throw new BadRequestException('Shift is already closed');
    }

    const closedAt = new Date();
    const expectedCash = await this.expectedCash(
      shift.outletId,
      Number(shift.openingCash),
      shift.openedAt,
      closedAt,
    );
    const counted = round2(closingCash);
    const difference = round2(counted - expectedCash);

    const updated = await this.prisma.registerShift.update({
      where: { id: shiftId },
      data: { closingCash: counted, closedAt },
    });

    return {
      shift: updated,
      reconciliation: {
        openingCash: Number(shift.openingCash),
        expectedCash,
        countedCash: counted,
        difference, // positive = over, negative = short
      },
    };
  }

  /** The currently open shift for an outlet, if any. */
  current(outletId: string) {
    const tenantId = getTenantIdOrThrow();
    return this.prisma.registerShift.findFirst({
      where: { tenantId, outletId, closedAt: null },
    });
  }

  /** Shift history for the tenant, optionally filtered by outlet. */
  list(outletId?: string) {
    const tenantId = getTenantIdOrThrow();
    return this.prisma.registerShift.findMany({
      where: { tenantId, ...(outletId ? { outletId } : {}) },
      orderBy: { openedAt: 'desc' },
    });
  }

  // ---- helpers ----

  /** Expected cash = opening float + cash payments taken at this outlet during the shift. */
  private async expectedCash(
    outletId: string,
    openingCash: number,
    from: Date,
    to: Date,
  ): Promise<number> {
    const tenantId = getTenantIdOrThrow();
    const cashPayments = await this.prisma.payment.findMany({
      where: {
        tenantId,
        method: PrismaPaymentMethod.cash,
        status: PrismaPaymentStatus.paid,
        createdAt: { gte: from, lte: to },
        order: { outletId },
      },
      select: { amount: true },
    });
    const cashTaken = cashPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    return round2(openingCash + cashTaken);
  }

  private async findOwned(shiftId: string) {
    const tenantId = getTenantIdOrThrow();
    const shift = await this.prisma.registerShift.findFirst({ where: { id: shiftId, tenantId } });
    if (!shift) {
      throw new NotFoundException('Shift not found');
    }
    return shift;
  }

  private async assertOutletOwned(outletId: string): Promise<void> {
    const tenantId = getTenantIdOrThrow();
    const outlet = await this.prisma.outlet.findFirst({ where: { id: outletId, tenantId } });
    if (!outlet) {
      throw new NotFoundException('Outlet not found');
    }
  }
}
