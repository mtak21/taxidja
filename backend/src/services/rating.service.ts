import { RideStatus } from '@prisma/client';
import { prisma } from '../config/prisma';

type RateRideError = 'not_found' | 'not_owner' | 'ride_not_completed' | 'already_rated' | 'no_driver';

export async function rateRide(rideId: string, passengerId: string, score: number, comment?: string) {
  const ride = await prisma.ride.findUnique({ where: { id: rideId } });

  if (!ride) {
    return { error: 'not_found' as const };
  }
  if (ride.passengerId !== passengerId) {
    return { error: 'not_owner' as const };
  }
  if (ride.status !== RideStatus.COMPLETED) {
    return { error: 'ride_not_completed' as const };
  }
  if (!ride.driverId) {
    return { error: 'no_driver' as const };
  }

  const existing = await prisma.rating.findUnique({ where: { rideId } });
  if (existing) {
    return { error: 'already_rated' as const };
  }

  const driverId = ride.driverId;

  const rating = await prisma.$transaction(async (tx) => {
    const created = await tx.rating.create({
      data: { rideId, passengerId, driverId, score, comment },
    });

    const aggregate = await tx.rating.aggregate({
      where: { driverId },
      _avg: { score: true },
    });

    await tx.driver.update({
      where: { id: driverId },
      data: { rating: aggregate._avg.score ?? score },
    });

    return created;
  });

  return { rating };
}

export type { RateRideError };
