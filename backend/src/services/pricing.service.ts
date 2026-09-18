import { VehicleType } from '@prisma/client';
import { prisma } from '../config/prisma';

const EARTH_RADIUS_KM = 6371;

// Average urban travel speed per vehicle type, used only to estimate duration.
const AVERAGE_SPEED_KMH: Record<VehicleType, number> = {
  MOTO: 30,
  RAKCHA: 25,
  CAR: 22,
};

const MIN_DURATION_MINUTES = 3;

export interface Coordinates {
  latitude: number;
  longitude: number;
}

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

/** Great-circle distance between two points, in kilometers. */
export function calculateDistanceKm(from: Coordinates, to: Coordinates): number {
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

export function estimateDurationMinutes(distanceKm: number, vehicleType: VehicleType): number {
  const hours = distanceKm / AVERAGE_SPEED_KMH[vehicleType];
  return Math.max(MIN_DURATION_MINUTES, Math.ceil(hours * 60));
}

export async function calculatePrice(distanceKm: number, vehicleType: VehicleType): Promise<number> {
  const config = await prisma.pricingConfig.findUnique({ where: { vehicleType } });
  if (!config) {
    throw new Error(`No pricing configured for vehicle type ${vehicleType}`);
  }
  return Math.round(config.baseFare + distanceKm * config.pricePerKm);
}

export async function estimateRide(pickup: Coordinates, destination: Coordinates, vehicleType: VehicleType) {
  const distance = calculateDistanceKm(pickup, destination);
  const estimatedDuration = estimateDurationMinutes(distance, vehicleType);
  const estimatedPrice = await calculatePrice(distance, vehicleType);

  return {
    distance: Math.round(distance * 100) / 100,
    estimatedDuration,
    estimatedPrice,
  };
}
