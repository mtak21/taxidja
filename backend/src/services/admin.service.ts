import { DriverVerificationStatus, Prisma, RideStatus, UserRole, VehicleType } from '@prisma/client';
import { prisma } from '../config/prisma';

const PAGE_SIZE = 20;

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function getStats() {
  const [
    totalUsers,
    totalDrivers,
    onlineDrivers,
    totalVehicles,
    ridesToday,
    completedRides,
    cancelledRides,
    revenueAgg,
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.driver.count(),
    prisma.driver.count({ where: { onlineStatus: true } }),
    prisma.vehicle.count(),
    prisma.ride.count({ where: { requestedAt: { gte: startOfToday() } } }),
    prisma.ride.count({ where: { status: RideStatus.COMPLETED } }),
    prisma.ride.count({ where: { status: RideStatus.CANCELLED } }),
    prisma.ride.aggregate({ where: { status: RideStatus.COMPLETED }, _sum: { finalPrice: true } }),
  ]);

  return {
    totalUsers,
    totalDrivers,
    onlineDrivers,
    totalVehicles,
    ridesToday,
    completedRides,
    cancelledRides,
    totalRevenue: revenueAgg._sum.finalPrice ?? 0,
  };
}

// --- Users ------------------------------------------------------------

export async function listUsers(params: { page: number; search?: string; role?: UserRole }) {
  const where: Prisma.UserWhereInput = {
    ...(params.role ? { role: params.role } : {}),
    ...(params.search
      ? {
          OR: [
            { firstName: { contains: params.search, mode: 'insensitive' } },
            { lastName: { contains: params.search, mode: 'insensitive' } },
            { phone: { contains: params.search, mode: 'insensitive' } },
            { email: { contains: params.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page: params.page, pageSize: PAGE_SIZE };
}

export async function updateUserStatus(id: string, isActive: boolean) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return { error: 'not_found' as const };

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return { user: updated };
}

// --- Drivers ------------------------------------------------------------

export async function listDrivers(params: { page: number; search?: string }) {
  const where: Prisma.DriverWhereInput = params.search
    ? {
        user: {
          OR: [
            { firstName: { contains: params.search, mode: 'insensitive' } },
            { lastName: { contains: params.search, mode: 'insensitive' } },
            { phone: { contains: params.search, mode: 'insensitive' } },
          ],
        },
      }
    : {};

  const [drivers, total] = await prisma.$transaction([
    prisma.driver.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: true, vehicles: true },
    }),
    prisma.driver.count({ where }),
  ]);

  const items = drivers.map(({ user, vehicles, ...driver }) => ({
    ...driver,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    isActive: user.isActive,
    vehicles: vehicles.map((v) => ({
      id: v.id,
      type: v.type,
      brand: v.brand,
      model: v.model,
      plate: v.plate,
      color: v.color,
      isActive: v.isActive,
    })),
  }));

  return { drivers: items, total, page: params.page, pageSize: PAGE_SIZE };
}

export async function updateDriverVerification(id: string, status: DriverVerificationStatus) {
  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) return { error: 'not_found' as const };

  const updated = await prisma.driver.update({
    where: { id },
    data: { verificationStatus: status },
    include: { user: true },
  });

  const { user, ...rest } = updated;
  return {
    driver: {
      ...rest,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
    },
  };
}

// --- Vehicles ------------------------------------------------------------

export async function listVehicles(params: { page: number }) {
  const [vehicles, total] = await prisma.$transaction([
    prisma.vehicle.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { driver: { include: { user: true } } },
    }),
    prisma.vehicle.count(),
  ]);

  const items = vehicles.map(({ driver, ...vehicle }) => ({
    ...vehicle,
    driverName: `${driver.user.firstName} ${driver.user.lastName}`,
  }));

  return { vehicles: items, total, page: params.page, pageSize: PAGE_SIZE };
}

export async function createVehicle(input: {
  driverId: string;
  type: VehicleType;
  plate?: string;
  brand?: string;
  model?: string;
  color?: string;
  isActive: boolean;
}) {
  const driver = await prisma.driver.findUnique({ where: { id: input.driverId } });
  if (!driver) return { error: 'driver_not_found' as const };

  const vehicle = await prisma.vehicle.create({ data: input });
  return { vehicle };
}

export async function updateVehicle(
  id: string,
  input: {
    type?: VehicleType;
    plate?: string | null;
    brand?: string | null;
    model?: string | null;
    color?: string | null;
    isActive?: boolean;
  },
) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) return { error: 'not_found' as const };

  const updated = await prisma.vehicle.update({ where: { id }, data: input });
  return { vehicle: updated };
}

export async function deleteVehicle(id: string) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) return { error: 'not_found' as const };

  await prisma.vehicle.delete({ where: { id } });
  return { success: true as const };
}

// --- Rides ------------------------------------------------------------

export async function listRides(params: { page: number; search?: string; status?: RideStatus }) {
  const where: Prisma.RideWhereInput = {
    ...(params.status ? { status: params.status } : {}),
    ...(params.search
      ? {
          OR: [
            { pickupAddress: { contains: params.search, mode: 'insensitive' } },
            { destinationAddress: { contains: params.search, mode: 'insensitive' } },
            { passenger: { firstName: { contains: params.search, mode: 'insensitive' } } },
            { passenger: { lastName: { contains: params.search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const [rawRides, total] = await prisma.$transaction([
    prisma.ride.findMany({
      where,
      orderBy: { requestedAt: 'desc' },
      skip: (params.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { passenger: true, driver: { include: { user: true } } },
    }),
    prisma.ride.count({ where }),
  ]);

  const rides = rawRides.map(({ passenger, driver, ...ride }) => ({
    ...ride,
    passenger: { firstName: passenger.firstName, lastName: passenger.lastName },
    driver: driver ? { firstName: driver.user.firstName, lastName: driver.user.lastName } : null,
  }));

  return { rides, total, page: params.page, pageSize: PAGE_SIZE };
}

export async function getRideDetail(id: string) {
  const ride = await prisma.ride.findUnique({
    where: { id },
    include: { passenger: true, driver: { include: { user: true } }, rating: true },
  });
  if (!ride) return { error: 'not_found' as const };

  const { passenger, driver, ...rest } = ride;
  return {
    ride: {
      ...rest,
      passenger: { firstName: passenger.firstName, lastName: passenger.lastName, phone: passenger.phone },
      driver: driver
        ? { firstName: driver.user.firstName, lastName: driver.user.lastName, phone: driver.user.phone, rating: driver.rating }
        : null,
    },
  };
}

// --- Cities ------------------------------------------------------------

export async function listCities() {
  return prisma.city.findMany({ orderBy: { name: 'asc' }, include: { zones: true } });
}

export async function createCity(name: string) {
  return prisma.city.create({ data: { name } });
}

export async function updateCity(id: string, input: { name?: string; isActive?: boolean }) {
  const city = await prisma.city.findUnique({ where: { id } });
  if (!city) return { error: 'not_found' as const };

  const updated = await prisma.city.update({ where: { id }, data: input });
  return { city: updated };
}

// --- Zones ------------------------------------------------------------

export async function listZones(cityId?: string) {
  return prisma.zone.findMany({
    where: cityId ? { cityId } : undefined,
    orderBy: { name: 'asc' },
    include: { city: true },
  });
}

export async function createZone(input: { cityId: string; name: string }) {
  const city = await prisma.city.findUnique({ where: { id: input.cityId } });
  if (!city) return { error: 'city_not_found' as const };

  const zone = await prisma.zone.create({ data: input });
  return { zone };
}

export async function updateZone(id: string, input: { name?: string; isActive?: boolean }) {
  const zone = await prisma.zone.findUnique({ where: { id } });
  if (!zone) return { error: 'not_found' as const };

  const updated = await prisma.zone.update({ where: { id }, data: input });
  return { zone: updated };
}

// --- Pricing ------------------------------------------------------------

export async function listPricing() {
  return prisma.pricingConfig.findMany({ orderBy: { vehicleType: 'asc' } });
}

export async function updatePricing(vehicleType: VehicleType, input: { baseFare: number; pricePerKm: number }) {
  return prisma.pricingConfig.upsert({
    where: { vehicleType },
    create: { vehicleType, ...input },
    update: input,
  });
}
