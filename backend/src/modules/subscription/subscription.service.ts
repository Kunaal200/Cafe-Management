import { Injectable, NotFoundException } from '@nestjs/common';
import type { ChangePlanInput } from '@cafe/shared';
import { PrismaService } from '../../common/prisma/prisma.service';
import { getTenantIdOrThrow } from '../../common/tenancy/tenant-context';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  /** Current subscription for the tenant, with computed trial days remaining. */
  async current() {
    const tenantId = getTenantIdOrThrow();
    const subscription = await this.prisma.subscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const trialDaysLeft = subscription.trialEndsAt
      ? Math.max(0, Math.ceil((subscription.trialEndsAt.getTime() - Date.now()) / MS_PER_DAY))
      : 0;

    return { ...subscription, trialDaysLeft };
  }

  /** Change the tenant's plan and billing cycle. */
  async changePlan(input: ChangePlanInput) {
    const tenantId = getTenantIdOrThrow();
    const subscription = await this.prisma.subscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        plan: input.plan,
        billingCycle: input.billingCycle,
        status: subscription.status === 'trial' ? 'active' : subscription.status,
      },
    });
  }
}
