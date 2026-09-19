import { RideStatus, VehicleType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { estimateRide, calculateDistanceKm, calculatePrice, type Coordinates } from './pricing.service';

interface CreateRideParams {
  passengerId: string;
  pickup: Coordinates;
  destination: Coordinates;
  vehicleType: VehicleType;
  pickupAddress?: string;
  destinationAddress?: string;
}

export async function estimate(pickup: Coordinates, destination: Coordinates, vehicleType: VehicleType) {
  return estimateRide(pickup, destination, vehicleType);
}

export async function createRide(params: CreateRideParams) {
  const { passengerId, pickup, destination, vehicleType, pickupAddress, destinationAddress } = params;

  // Never trust a client-supplied price — recompute it server-side.
  const { distance, estimatedDuration, estimatedPrice } = await estimateRide(pickup, destination, vehicleType);

  return prisma.ride.create({
    data: {
      passengerId,
      vehicleType,
      pickupLatitude: pickup.latitude,
      pickupLongitude: pickup.longitude,
      destinationLatitude: destination.latitude,
      destinationLongitude: destination.longitude,
      pickupAddress,
      destinationAddress,
      distance,
      estimatedDuration,
      estimatedPrice,
      status: RideStatus.REQUESTED,
    },
  });
}

export async function getRideById(id: string) {
  return prisma.ride.findUnique({
    where: { id },
    include: { driver: { include: { user: true } }, passenger: true },
  });
}

const CANCELLABLE_STATUSES: RideStatus[] = [RideStatus.REQUESTED, RideStatus.SEARCHING];

export async function cancelRide(id: string, passengerId: string) {
  const ride = await prisma.ride.findUnique({ where: { id } });

  if (!ride || ride.passengerId !== passengerId) {
    return { error: 'not_found' as const };
  }

  if (!CANCELLABLE_STATUSES.includes(ride.status)) {
    return { error: 'not_cancellable' as const };
  }

  const updated = await prisma.ride.update({
    where: { id },
    data: { status: RideStatus.CANCELLED, cancelledAt: new Date() },
  });

  return { ride: updated };
}

type TransitionError = 'not_found' | 'not_assigned_driver' | 'invalid_transition';

/**
 * Loads the ride for a driver-initiated transition and checks: the caller
 * has a Driver profile, is the ride's assigned driver, and the ride is
 * currently in the exact status this transition expects — no skipping
 * steps, no going backwards.
 */
interface TransitionFailure {
  error: TransitionError;
}

async function getRideForDriverTransition(
  rideId: string,
  userId: string,
  expectedStatus: RideStatus,
): Promise<TransitionFailure | { ride: Awaited<ReturnType<typeof prisma.ride.findUniqueOrThrow>>; driver: Awaited<ReturnType<typeof prisma.driver.findUniqueOrThrow>> }> {
  const driver = await prisma.driver.findUnique({ where: { userId } });
  if (!driver) {
    return { error: 'not_assigned_driver' };
  }

  const ride = await prisma.ride.findUnique({ where: { id: rideId } });
  if (!ride) {
    return { error: 'not_found' };
  }
  if (ride.driverId !== driver.id) {
    return { error: 'not_assigned_driver' };
  }
  if (ride.status !== expectedStatus) {
    return { error: 'invalid_transition' };
  }

  return { ride, driver };
}

export async function markArriving(rideId: string, userId: string) {
  const result = await getRideForDriverTransition(rideId, userId, RideStatus.ACCEPTED);
  if ('error' in result) return result;

  const ride = await prisma.ride.update({
    where: { id: rideId },
    data: { status: RideStatus.DRIVER_ARRIVING, arrivingAt: new Date() },
  });

  return { ride };
}

export async function startRide(rideId: string, userId: string) {
  const result = await getRideForDriverTransition(rideId, userId, RideStatus.DRIVER_ARRIVING);
  if ('error' in result) return result;

  const ride = await prisma.ride.update({
    where: { id: rideId },
    data: { status: RideStatus.IN_PROGRESS, startedAt: new Date() },
  });

  return { ride };
}

// Below this gap between the actual end position and the planned
// destination, we treat the trip as "went as planned" and keep the
// estimate as the final price — GPS noise alone can produce a few tens of
// meters of difference, and re-pricing for that would be noise, not signal.
const FINAL_DISTANCE_TOLERANCE_KM = 0.1;

export async function completeRide(rideId: string, userId: string) {
  const result = await getRideForDriverTransition(rideId, userId, RideStatus.IN_PROGRESS);
  if ('error' in result) return result;
  const { ride, driver } = result;

  // Recompute from the driver's last known position (continuously tracked
  // while online) as a proxy for where the trip actually ended. If it's
  // unavailable, or ends up essentially at the planned destination, we
  // simply keep estimatedPrice rather than force a recalculation.
  let finalPrice = ride.estimatedPrice;

  if (driver.currentLatitude !== null && driver.currentLongitude !== null) {
    const actualDistance = calculateDistanceKm(
      { latitude: ride.pickupLatitude, longitude: ride.pickupLongitude },
      { latitude: driver.currentLatitude, longitude: driver.currentLongitude },
    );

    if (Math.abs(actualDistance - ride.distance) >= FINAL_DISTANCE_TOLERANCE_KM) {
      finalPrice = await calculatePrice(actualDistance, ride.vehicleType);
    }
  }

  const [updated] = await prisma.$transaction([
    prisma.ride.update({
      where: { id: rideId },
      data: { status: RideStatus.COMPLETED, completedAt: new Date(), finalPrice },
    }),
    prisma.driver.update({
      where: { id: driver.id },
      data: { totalTrips: { increment: 1 } },
    }),
  ]);

  return { ride: updated };
}
