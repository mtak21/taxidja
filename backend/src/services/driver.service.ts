import { DriverVerificationStatus, RideStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { getIo, userRoom } from '../socket/io';
import type { CreateVehicleInput, UpdateVehicleInput } from '../validators/driver.validator';

// Statuses during which a driver's position is worth broadcasting to their
// passenger — before ACCEPTED there's no assigned passenger yet, and after
// IN_PROGRESS the trip is over.
const TRACKABLE_RIDE_STATUSES: RideStatus[] = [RideStatus.ACCEPTED, RideStatus.DRIVER_ARRIVING, RideStatus.IN_PROGRESS];

export async function updateLocation(userId: string, latitude: number, longitude: number) {
  const driver = await prisma.driver.upsert({
    where: { userId },
    create: {
      userId,
      currentLatitude: latitude,
      currentLongitude: longitude,
      lastLocationUpdate: new Date(),
    },
    update: {
      currentLatitude: latitude,
      currentLongitude: longitude,
      lastLocationUpdate: new Date(),
    },
  });

  const activeRide = await prisma.ride.findFirst({
    where: { driverId: driver.id, status: { in: TRACKABLE_RIDE_STATUSES } },
    select: { id: true, passengerId: true },
  });

  if (activeRide) {
    getIo().to(userRoom(activeRide.passengerId)).emit('driver:position_update', {
      rideId: activeRide.id,
      latitude,
      longitude,
    });
  }

  return driver;
}

export async function updateStatus(userId: string, online: boolean) {
  if (online) {
    const driver = await prisma.driver.findUnique({ where: { userId } });
    if (!driver || driver.verificationStatus !== DriverVerificationStatus.VERIFIED) {
      return { error: 'not_verified' as const };
    }
  }

  const driver = await prisma.driver.upsert({
    where: { userId },
    create: {
      userId,
      onlineStatus: online,
    },
    update: {
      onlineStatus: online,
    },
  });

  return { driver };
}

// One active vehicle at a time, chosen simplicity over letting the driver
// pick per-ride: dispatch (matching.service.ts) already only matches on a
// driver's active vehicle, and juggling several simultaneously-active
// vehicles of different types would need per-ride vehicle selection wired
// through the whole booking/dispatch flow for no real MVP benefit.
export async function addVehicle(userId: string, input: CreateVehicleInput) {
  const driver = await prisma.driver.findUnique({ where: { userId } });
  if (!driver) return { error: 'not_found' as const };

  const [, vehicle] = await prisma.$transaction([
    prisma.vehicle.updateMany({ where: { driverId: driver.id }, data: { isActive: false } }),
    prisma.vehicle.create({ data: { driverId: driver.id, ...input, isActive: true } }),
  ]);

  return { vehicle };
}

export async function updateVehicle(userId: string, vehicleId: string, input: UpdateVehicleInput) {
  const driver = await prisma.driver.findUnique({ where: { userId } });
  if (!driver) return { error: 'not_found' as const };

  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle || vehicle.driverId !== driver.id) return { error: 'not_found' as const };

  if (input.isActive) {
    await prisma.vehicle.updateMany({
      where: { driverId: driver.id, id: { not: vehicleId } },
      data: { isActive: false },
    });
  }

  const updated = await prisma.vehicle.update({ where: { id: vehicleId }, data: input });
  return { vehicle: updated };
}

const EARNINGS_PAGE_SIZE = 20;

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// Monday-based week, matching the common convention in Chad/francophone Africa.
function startOfWeek(): Date {
  const start = startOfToday();
  const day = start.getDay(); // 0 (Sun) .. 6 (Sat)
  const diffToMonday = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diffToMonday);
  return start;
}

function startOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function getEarnings(userId: string, page: number) {
  const driver = await prisma.driver.findUnique({ where: { userId } });
  if (!driver) {
    return {
      totals: { today: 0, week: 0, month: 0, allTime: 0 },
      rides: [],
      total: 0,
      page,
      pageSize: EARNINGS_PAGE_SIZE,
    };
  }

  const completedWhere = { driverId: driver.id, status: RideStatus.COMPLETED };

  const [todayAgg, weekAgg, monthAgg, allTimeAgg, rawRides, total] = await prisma.$transaction([
    prisma.ride.aggregate({ where: { ...completedWhere, completedAt: { gte: startOfToday() } }, _sum: { finalPrice: true } }),
    prisma.ride.aggregate({ where: { ...completedWhere, completedAt: { gte: startOfWeek() } }, _sum: { finalPrice: true } }),
    prisma.ride.aggregate({ where: { ...completedWhere, completedAt: { gte: startOfMonth() } }, _sum: { finalPrice: true } }),
    prisma.ride.aggregate({ where: completedWhere, _sum: { finalPrice: true } }),
    prisma.ride.findMany({
      where: completedWhere,
      orderBy: { completedAt: 'desc' },
      skip: (page - 1) * EARNINGS_PAGE_SIZE,
      take: EARNINGS_PAGE_SIZE,
      include: { passenger: true },
    }),
    prisma.ride.count({ where: completedWhere }),
  ]);

  const rides = rawRides.map(({ passenger, ...rideFields }) => ({
    ...rideFields,
    passenger: { firstName: passenger.firstName, lastName: passenger.lastName },
  }));

  return {
    totals: {
      today: todayAgg._sum.finalPrice ?? 0,
      week: weekAgg._sum.finalPrice ?? 0,
      month: monthAgg._sum.finalPrice ?? 0,
      allTime: allTimeAgg._sum.finalPrice ?? 0,
    },
    rides,
    total,
    page,
    pageSize: EARNINGS_PAGE_SIZE,
  };
}
