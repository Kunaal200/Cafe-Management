import { PrismaClient, UserRole, TenantStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // Platform super admin (no tenant).
  const adminEmail = 'admin@cafe-platform.local';
  const adminHash = await argon2.hash('Admin123!');
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: '', email: adminEmail } },
    update: {},
    create: {
      fullName: 'Platform Admin',
      email: adminEmail,
      passwordHash: adminHash,
      role: UserRole.super_admin,
      isVerified: true,
    },
  }).catch(async () => {
    // Composite unique with null tenantId can't be targeted via upsert; fall back.
    const existing = await prisma.user.findFirst({ where: { email: adminEmail, tenantId: null } });
    if (!existing) {
      await prisma.user.create({
        data: {
          fullName: 'Platform Admin',
          email: adminEmail,
          passwordHash: adminHash,
          role: UserRole.super_admin,
          isVerified: true,
        },
      });
    }
  });

  // Demo tenant with one outlet, a tax rule, a category, items, and tables.
  let demo = await prisma.tenant.findUnique({ where: { subdomain: 'demo' } });
  if (!demo) {
    demo = await prisma.tenant.create({
      data: {
        name: 'Demo Cafe',
        subdomain: 'demo',
        status: TenantStatus.active,
        businessType: 'cafe',
        country: 'US',
      },
    });

    const ownerHash = await argon2.hash('Owner123!');
    await prisma.user.create({
      data: {
        tenantId: demo.id,
        fullName: 'Demo Owner',
        email: 'owner@demo.local',
        passwordHash: ownerHash,
        role: UserRole.owner,
        isVerified: true,
      },
    });

    const outlet = await prisma.outlet.create({
      data: {
        tenantId: demo.id,
        name: 'Main Branch',
        currency: 'USD',
        timezone: 'UTC',
        serviceTypes: ['dine_in', 'takeaway'],
      },
    });

    const tax = await prisma.taxRule.create({
      data: { tenantId: demo.id, name: 'Sales Tax', rate: '8.00', mode: 'exclusive' },
    });

    const category = await prisma.menuCategory.create({
      data: { tenantId: demo.id, name: 'Coffee', sortOrder: 1 },
    });

    await prisma.menuItem.createMany({
      data: [
        { tenantId: demo.id, categoryId: category.id, name: 'Espresso', price: '3.00', taxRuleId: tax.id, isVeg: true },
        { tenantId: demo.id, categoryId: category.id, name: 'Cappuccino', price: '4.50', taxRuleId: tax.id, isVeg: true },
        { tenantId: demo.id, categoryId: category.id, name: 'Latte', price: '4.75', taxRuleId: tax.id, isVeg: true },
      ],
    });

    await prisma.restaurantTable.createMany({
      data: [
        { tenantId: demo.id, outletId: outlet.id, name: 'T1', capacity: 2 },
        { tenantId: demo.id, outletId: outlet.id, name: 'T2', capacity: 4 },
        { tenantId: demo.id, outletId: outlet.id, name: 'T3', capacity: 4 },
      ],
    });
  }

  // eslint-disable-next-line no-console
  console.log('Seed complete. Super admin: admin@cafe-platform.local / Admin123!');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
