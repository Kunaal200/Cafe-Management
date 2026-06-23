import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  CreateInventoryItemInput,
  ReceiveStockInput,
  StockMovementInput,
  UpdateInventoryItemInput,
} from '@cafe/shared';
import { PrismaService } from '../../common/prisma/prisma.service';
import { getTenantIdOrThrow } from '../../common/tenancy/tenant-context';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const CONSUMPTION_WINDOW_DAYS = 14;
const EXPIRY_SOON_DAYS = 5;

function round(n: number, dp = 3): number {
  const f = 10 ** dp;
  return Math.round((n + Number.EPSILON) * f) / f;
}
function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / MS_PER_DAY);
}

export interface InventoryAlert {
  itemId: string;
  itemName: string;
  type: 'expiry' | 'overstock' | 'low_stock';
  severity: 'high' | 'medium' | 'low';
  message: string;
  stockOnHand: number;
  unit: string;
}

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Items ----

  create(input: CreateInventoryItemInput) {
    const tenantId = getTenantIdOrThrow();
    return this.prisma.inventoryItem.create({
      data: {
        tenantId,
        name: input.name,
        unit: input.unit,
        reorderLevel: input.reorderLevel ?? 0,
        perishable: input.perishable ?? false,
      },
    });
  }

  async update(id: string, input: UpdateInventoryItemInput) {
    await this.findOwned(id);
    return this.prisma.inventoryItem.update({ where: { id }, data: input });
  }

  async remove(id: string) {
    await this.findOwned(id);
    await this.prisma.inventoryItem.delete({ where: { id } });
    return { deleted: true };
  }

  /** Items with stock-on-hand, average daily use, and nearest expiry. */
  async list() {
    const tenantId = getTenantIdOrThrow();
    const items = await this.prisma.inventoryItem.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      include: { batches: { where: { remainingQty: { gt: 0 } } } },
    });
    const consumption = await this.consumptionByItem(tenantId);

    return items.map((item) => {
      const stockOnHand = round(item.batches.reduce((s, b) => s + Number(b.remainingQty), 0));
      const expiries = item.batches
        .filter((b) => b.expiresAt)
        .map((b) => b.expiresAt as Date)
        .sort((a, b) => a.getTime() - b.getTime());
      return {
        id: item.id,
        name: item.name,
        unit: item.unit,
        reorderLevel: Number(item.reorderLevel),
        perishable: item.perishable,
        stockOnHand,
        avgDailyUse: round(consumption.get(item.id) ?? 0),
        nearestExpiry: expiries[0] ?? null,
        lowStock: Number(item.reorderLevel) > 0 && stockOnHand <= Number(item.reorderLevel),
      };
    });
  }

  /** Item detail with its batches and recent movements. */
  async get(id: string) {
    const item = await this.findOwned(id);
    const [batches, movements] = await Promise.all([
      this.prisma.stockBatch.findMany({
        where: { itemId: id },
        orderBy: [{ expiresAt: 'asc' }, { receivedAt: 'asc' }],
      }),
      this.prisma.stockMovement.findMany({
        where: { itemId: id },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
    ]);
    return { ...item, batches, movements };
  }

  // ---- Stock operations ----

  /** Receive a batch: increases stock and records an 'in' movement. */
  async receive(itemId: string, input: ReceiveStockInput) {
    const item = await this.findOwned(itemId);
    const tenantId = item.tenantId;
    await this.prisma.$transaction([
      this.prisma.stockBatch.create({
        data: {
          tenantId,
          itemId,
          qty: input.qty,
          remainingQty: input.qty,
          unitCost: input.unitCost,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
          receivedAt: input.receivedAt ? new Date(input.receivedAt) : undefined,
        },
      }),
      this.prisma.stockMovement.create({
        data: { tenantId, itemId, type: 'in', qty: input.qty, reason: 'Received stock' },
      }),
    ]);
    return this.get(itemId);
  }

  /** Record consumption / waste / adjustment. Deducts FIFO (soonest expiry first). */
  async move(itemId: string, input: StockMovementInput) {
    const item = await this.findOwned(itemId);
    const tenantId = item.tenantId;

    const batches = await this.prisma.stockBatch.findMany({
      where: { itemId, remainingQty: { gt: 0 } },
      orderBy: [{ expiresAt: 'asc' }, { receivedAt: 'asc' }],
    });
    const available = batches.reduce((s, b) => s + Number(b.remainingQty), 0);
    if (input.qty > available) {
      throw new BadRequestException(`Only ${round(available)} ${item.unit} in stock`);
    }

    // Consume from the soonest-expiring batches first.
    let remaining = input.qty;
    const updates: Prisma.PrismaPromise<unknown>[] = [];
    for (const b of batches) {
      if (remaining <= 0) break;
      const take = Math.min(Number(b.remainingQty), remaining);
      remaining -= take;
      updates.push(
        this.prisma.stockBatch.update({
          where: { id: b.id },
          data: { remainingQty: round(Number(b.remainingQty) - take) },
        }),
      );
    }
    updates.push(
      this.prisma.stockMovement.create({
        data: { tenantId, itemId, type: input.type, qty: input.qty, reason: input.reason },
      }),
    );
    await this.prisma.$transaction(updates);
    return this.get(itemId);
  }

  // ---- Smart alerts ----

  /**
   * Spoilage / overstock / low-stock alerts. The headline check compares each
   * item's stock against projected usage before its nearest expiry: if you hold
   * far more than you'll consume in time, it flags likely waste + a promo nudge.
   */
  async alerts(): Promise<InventoryAlert[]> {
    const tenantId = getTenantIdOrThrow();
    const items = await this.prisma.inventoryItem.findMany({
      where: { tenantId },
      include: { batches: { where: { remainingQty: { gt: 0 } } } },
    });
    const consumption = await this.consumptionByItem(tenantId);
    const alerts: InventoryAlert[] = [];

    for (const item of items) {
      const stockOnHand = round(item.batches.reduce((s, b) => s + Number(b.remainingQty), 0));
      if (stockOnHand <= 0) continue;
      const avgDaily = consumption.get(item.id) ?? 0;
      const unit = item.unit;
      const base = { itemId: item.id, itemName: item.name, stockOnHand, unit };

      // Low stock vs reorder level.
      if (Number(item.reorderLevel) > 0 && stockOnHand <= Number(item.reorderLevel)) {
        alerts.push({
          ...base,
          type: 'low_stock',
          severity: 'medium',
          message: `Low stock: ${stockOnHand} ${unit} left (reorder at ${Number(item.reorderLevel)}).`,
        });
      }

      // Nearest expiring batch.
      const expiring = item.batches
        .filter((b) => b.expiresAt)
        .map((b) => ({ qty: Number(b.remainingQty), days: daysUntil(b.expiresAt as Date) }))
        .sort((a, b) => a.days - b.days);

      const soonest = expiring[0];
      if (soonest && soonest.days <= EXPIRY_SOON_DAYS) {
        const days = Math.max(0, soonest.days);
        // Project how much will actually be used before this stock expires.
        const projectedUse = round(avgDaily * Math.max(days, 0));
        const surplus = round(stockOnHand - projectedUse);
        if (avgDaily > 0 && surplus > 0) {
          alerts.push({
            ...base,
            type: 'overstock',
            severity: surplus > stockOnHand / 2 ? 'high' : 'medium',
            message: `${stockOnHand} ${unit} of ${item.name} expires in ${days} day${days === 1 ? '' : 's'}, but you use ~${round(avgDaily)} ${unit}/day — about ${surplus} ${unit} may spoil. Consider a promo to move it.`,
          });
        } else {
          alerts.push({
            ...base,
            type: 'expiry',
            severity: days <= 1 ? 'high' : 'medium',
            message: `${stockOnHand} ${unit} of ${item.name} expires in ${days} day${days === 1 ? '' : 's'}.`,
          });
        }
      }
    }

    const rank = { high: 0, medium: 1, low: 2 } as const;
    return alerts.sort((a, b) => rank[a.severity] - rank[b.severity]);
  }

  // ---- Order-driven consumption ----

  /**
   * Deduct recipe ingredients for a set of order lines (best-effort, never throws
   * so it can't block order flow). For each menu item with a recipe, the required
   * ingredient quantity (per-unit × line qty) is consumed FIFO and logged as an
   * 'out' movement, which also feeds the consumption-rate used by alerts.
   */
  async consumeForOrderItems(
    lines: { menuItemId: string | null; qty: number }[],
    reason?: string,
  ): Promise<void> {
    const tenantId = getTenantIdOrThrow();
    const menuItemIds = lines.map((l) => l.menuItemId).filter((v): v is string => !!v);
    if (menuItemIds.length === 0) return;

    const recipes = await this.prisma.recipeIngredient.findMany({
      where: { tenantId, menuItemId: { in: menuItemIds } },
    });
    if (recipes.length === 0) return;

    // Aggregate the total required quantity per inventory item.
    const need = new Map<string, number>();
    for (const line of lines) {
      if (!line.menuItemId) continue;
      for (const r of recipes.filter((x) => x.menuItemId === line.menuItemId)) {
        need.set(r.inventoryItemId, (need.get(r.inventoryItemId) ?? 0) + Number(r.qty) * line.qty);
      }
    }

    for (const [itemId, qty] of need) {
      try {
        await this.deductBestEffort(tenantId, itemId, qty, reason);
      } catch {
        // Never block the order on an inventory hiccup.
      }
    }
  }

  /** Deduct up to `qty` from an item's batches (FIFO) and log the consumption. */
  private async deductBestEffort(
    tenantId: string,
    itemId: string,
    qty: number,
    reason?: string,
  ): Promise<void> {
    const batches = await this.prisma.stockBatch.findMany({
      where: { tenantId, itemId, remainingQty: { gt: 0 } },
      orderBy: [{ expiresAt: 'asc' }, { receivedAt: 'asc' }],
    });
    let remaining = qty;
    const updates: Prisma.PrismaPromise<unknown>[] = [];
    for (const b of batches) {
      if (remaining <= 0) break;
      const take = Math.min(Number(b.remainingQty), remaining);
      remaining -= take;
      updates.push(
        this.prisma.stockBatch.update({
          where: { id: b.id },
          data: { remainingQty: round(Number(b.remainingQty) - take) },
        }),
      );
    }
    // Record the full required quantity so consumption-rate stays accurate.
    updates.push(
      this.prisma.stockMovement.create({
        data: { tenantId, itemId, type: 'out', qty: round(qty), reason: reason ?? 'Order consumption' },
      }),
    );
    await this.prisma.$transaction(updates);
  }

  // ---- helpers ----

  /**
   * Current unit cost per inventory item — weighted average of remaining batches,
   * falling back to the most recent batch's cost. Returned as a Map(itemId -> cost).
   */
  async unitCostByItem(tenantId: string): Promise<Map<string, number>> {
    const batches = await this.prisma.stockBatch.findMany({
      where: { tenantId },
      orderBy: { receivedAt: 'desc' },
      select: { itemId: true, remainingQty: true, unitCost: true, receivedAt: true },
    });
    const agg = new Map<string, { qty: number; cost: number; latest?: number }>();
    for (const b of batches) {
      const cur = agg.get(b.itemId) ?? { qty: 0, cost: 0 };
      const rem = Number(b.remainingQty);
      cur.qty += rem;
      cur.cost += rem * Number(b.unitCost);
      if (cur.latest === undefined) cur.latest = Number(b.unitCost); // first seen = most recent
      agg.set(b.itemId, cur);
    }
    const out = new Map<string, number>();
    for (const [itemId, v] of agg) {
      out.set(itemId, v.qty > 0 ? v.cost / v.qty : (v.latest ?? 0));
    }
    return out;
  }

  /** Average daily consumption (out + waste) per item over the recent window. */
  private async consumptionByItem(tenantId: string): Promise<Map<string, number>> {
    const since = new Date(Date.now() - CONSUMPTION_WINDOW_DAYS * MS_PER_DAY);
    const moves = await this.prisma.stockMovement.findMany({
      where: { tenantId, type: { in: ['out', 'waste'] }, createdAt: { gte: since } },
      select: { itemId: true, qty: true },
    });
    const map = new Map<string, number>();
    for (const m of moves) {
      map.set(m.itemId, (map.get(m.itemId) ?? 0) + Number(m.qty));
    }
    for (const [k, v] of map) map.set(k, v / CONSUMPTION_WINDOW_DAYS);
    return map;
  }

  private async findOwned(id: string) {
    const tenantId = getTenantIdOrThrow();
    const item = await this.prisma.inventoryItem.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Inventory item not found');
    return item;
  }
}
