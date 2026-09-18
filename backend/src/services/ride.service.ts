import { RideStatus, VehicleType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { estimateRide, type Coordinates } from './pricing.service';

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
  return prisma.ride.findUnique({ where: { id } });
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
