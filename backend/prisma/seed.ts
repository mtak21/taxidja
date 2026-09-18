import { PrismaClient, VehicleType } from '@prisma/client';

const prisma = new PrismaClient();

// FCFA — reasonable N'Djamena estimates.
const PRICING: Record<VehicleType, { baseFare: number; pricePerKm: number }> = {
  MOTO: { baseFare: 300, pricePerKm: 100 },
  RAKCHA: { baseFare: 500, pricePerKm: 150 },
  CAR: { baseFare: 1000, pricePerKm: 250 },
};

async function main() {
  for (const [vehicleType, config] of Object.entries(PRICING) as [VehicleType, typeof PRICING.MOTO][]) {
    await prisma.pricingConfig.upsert({
      where: { vehicleType },
      create: { vehicleType, ...config },
      update: config,
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
