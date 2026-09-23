import { PrismaClient, UserRole, VehicleType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const BCRYPT_SALT_ROUNDS = 12;

// FCFA — reasonable N'Djamena estimates.
const PRICING: Record<VehicleType, { baseFare: number; pricePerKm: number }> = {
  MOTO: { baseFare: 300, pricePerKm: 100 },
  RAKCHA: { baseFare: 500, pricePerKm: 150 },
  CAR: { baseFare: 1000, pricePerKm: 250 },
};

// Dev-only credentials for the admin dashboard — see admin/README.md.
const ADMIN_EMAIL = 'admin@taxidja.td';
const ADMIN_PASSWORD = 'admin1234';

async function main() {
  for (const [vehicleType, config] of Object.entries(PRICING) as [VehicleType, typeof PRICING.MOTO][]) {
    await prisma.pricingConfig.upsert({
      where: { vehicleType },
      create: { vehicleType, ...config },
      update: config,
    });
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_SALT_ROUNDS);
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    create: {
      firstName: 'Admin',
      lastName: 'TaxiDja',
      phone: '23500000000',
      email: ADMIN_EMAIL,
      passwordHash,
      role: UserRole.ADMIN,
    },
    // Never overwrite the password of an existing admin on re-seed.
    update: {},
  });

  const city = await prisma.city.upsert({
    where: { name: "N'Djamena" },
    create: { name: "N'Djamena" },
    update: {},
  });

  await prisma.zone.upsert({
    where: { cityId_name: { cityId: city.id, name: 'Centre-ville' } },
    create: { cityId: city.id, name: 'Centre-ville' },
    update: {},
  });

  console.log(`Seed complete: admin (${ADMIN_EMAIL}), city "${city.name}", pricing config for ${Object.keys(PRICING).length} vehicle types.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
