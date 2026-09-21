import { DriverVerificationStatus, RideStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { getIo, userRoom } from '../socket/io';

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
