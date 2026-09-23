import { DriverVerificationStatus, VehicleType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { calculateDistanceKm, type Coordinates } from './pricing.service';

// --- Driver matching: a simple, explainable scoring heuristic -------------
// This is NOT machine learning / AI. It is a deterministic weighted sum of
// two normalized factors, chosen so the ranking is easy to reason about and
// to defend in a report:
//
//   score = (1 / (1 + distance_km)) * PROXIMITY_WEIGHT + (rating / 5) * QUALITY_WEIGHT
//
// - The proximity term is in (0, 1], approaching 1 as distance approaches 0
//   and decaying smoothly as distance grows (no arbitrary cutoff/bucketing).
// - The quality term is the driver's average rating normalized to (0, 1].
// - Weights sum to 1 so the final score also stays in (0, 1], which keeps it
//   readable in logs without further normalization.
// ---------------------------------------------------------------------------

const PROXIMITY_WEIGHT = 0.7;
const QUALITY_WEIGHT = 0.3;

// A driver whose last reported position is older than this is treated as
// possibly stale/offline-in-practice and excluded, even if onlineStatus is
// still true (e.g. app killed without a clean "go offline" toggle).
const MAX_LOCATION_AGE_MS = 2 * 60 * 1000;

export interface DriverCandidate {
  driverId: string;
  userId: string;
  firstName: string;
  lastName: string;
  distanceKm: number;
  rating: number;
  score: number;
}

/**
 * Returns online, location-fresh drivers with an active vehicle of the
 * requested type, ranked best-candidate-first by the scoring heuristic
 * described above.
 */
export async function findCandidates(
  pickup: Coordinates,
  vehicleType: VehicleType,
  excludeDriverId?: string,
): Promise<DriverCandidate[]> {
  const drivers = await prisma.driver.findMany({
    where: {
      onlineStatus: true,
      // The real gate: an unverified/suspended driver must never be offered
      // a ride, even if something upstream (a bug, a direct API call bypassing
      // the mobile app) manages to flip onlineStatus to true for them.
      verificationStatus: DriverVerificationStatus.VERIFIED,
      currentLatitude: { not: null },
      currentLongitude: { not: null },
      lastLocationUpdate: { gte: new Date(Date.now() - MAX_LOCATION_AGE_MS) },
      vehicles: { some: { type: vehicleType, isActive: true } },
      ...(excludeDriverId ? { id: { not: excludeDriverId } } : {}),
    },
    include: { user: true },
  });

  const candidates = drivers.map((driver) => {
    const distanceKm = calculateDistanceKm(pickup, {
      latitude: driver.currentLatitude as number,
      longitude: driver.currentLongitude as number,
    });
    const proximityScore = 1 / (1 + distanceKm);
    const qualityScore = driver.rating / 5;
    const score = proximityScore * PROXIMITY_WEIGHT + qualityScore * QUALITY_WEIGHT;

    return {
      driverId: driver.id,
      userId: driver.userId,
      firstName: driver.user.firstName,
      lastName: driver.user.lastName,
      distanceKm: Math.round(distanceKm * 100) / 100,
      rating: driver.rating,
      score: Math.round(score * 10000) / 10000,
    };
  });

  candidates.sort((a, b) => b.score - a.score);
  return candidates;
}
