import { Prisma, RideStatus, UserRole, VehicleType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { calculatePrice, type Coordinates } from './pricing.service';
import { getRoute } from './routing.service';

interface CreateRideParams {
  passengerId: string;
  pickup: Coordinates;
  destination: Coordinates;
  vehicleType: VehicleType;
  pickupAddress?: string;
  destinationAddress?: string;
}

export async function estimate(pickup: Coordinates, destination: Coordinates, vehicleType: VehicleType) {
  const route = await getRoute(pickup, destination, vehicleType);
  const estimatedPrice = await calculatePrice(route.distanceKm, vehicleType);

  return {
    distance: route.distanceKm,
    estimatedDuration: route.durationMinutes,
    estimatedPrice,
    routeGeometry: route.geometry,
  };
}

export async function createRide(params: CreateRideParams) {
  const { passengerId, pickup, destination, vehicleType, pickupAddress, destinationAddress } = params;

  // Never trust a client-supplied price — recompute it server-side.
  const { distance, estimatedDuration, estimatedPrice, routeGeometry } = await estimate(pickup, destination, vehicleType);

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
      routeGeometry: routeGeometry as unknown as Prisma.InputJsonValue,
      status: RideStatus.REQUESTED,
    },
  });
}

const ACTIVE_STATUSES: RideStatus[] = [
  RideStatus.REQUESTED,
  RideStatus.SEARCHING,
  RideStatus.ACCEPTED,
  RideStatus.DRIVER_ARRIVING,
  RideStatus.IN_PROGRESS,
];

/**
 * The caller's one in-flight ride, if any — used to resume the app straight
 * into the ride's status screen instead of Accueil after a cold start.
 * `driverId` is scoped to that driver's own Driver profile, not the raw
 * userId, same lookup pattern as getRideForDriverTransition.
 */
export async function getActiveRide(userId: string, role: UserRole) {
  if (role === UserRole.DRIVER) {
    const driver = await prisma.driver.findUnique({ where: { userId } });
    if (!driver) return null;
    return prisma.ride.findFirst({
      where: { driverId: driver.id, status: { in: ACTIVE_STATUSES } },
      orderBy: { requestedAt: 'desc' },
    });
  }

  return prisma.ride.findFirst({
    where: { passengerId: userId, status: { in: ACTIVE_STATUSES } },
    orderBy: { requestedAt: 'desc' },
  });
}

export async function getRideById(id: string) {
  return prisma.ride.findUnique({
    where: { id },
    include: {
      driver: { include: { user: true, vehicles: { where: { isActive: true }, take: 1 } } },
      passenger: true,
    },
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

const DRIVER_CANCELLABLE_STATUSES: RideStatus[] = [RideStatus.ACCEPTED, RideStatus.DRIVER_ARRIVING];

type DriverCancelError = 'not_found' | 'not_assigned_driver' | 'not_cancellable';

/**
 * A driver backing out after accepting, but before the trip actually starts.
 * Once IN_PROGRESS a ride can no longer be cancelled this way — it has to be
 * completed (or handled as an exceptional case outside this flow).
 *
 * Unlike the passenger's cancelRide (which just marks CANCELLED), this
 * clears driverId/acceptedAt/arrivingAt and leaves the ride's status alone;
 * the caller (ride.controller) is expected to hand it to
 * dispatchService.startSearch right after, which flips it to SEARCHING and
 * re-runs the same candidate-offering flow a fresh ride goes through — see
 * that call site for why re-search (not REQUESTED) was chosen.
 */
export async function cancelRideByDriver(rideId: string, userId: string) {
  const driver = await prisma.driver.findUnique({ where: { userId } });
  if (!driver) {
    return { error: 'not_assigned_driver' as DriverCancelError };
  }

  const ride = await prisma.ride.findUnique({ where: { id: rideId } });
  if (!ride) {
    return { error: 'not_found' as DriverCancelError };
  }
  if (ride.driverId !== driver.id) {
    return { error: 'not_assigned_driver' as DriverCancelError };
  }
  if (!DRIVER_CANCELLABLE_STATUSES.includes(ride.status)) {
    return { error: 'not_cancellable' as DriverCancelError };
  }

  const updated = await prisma.ride.update({
    where: { id: rideId },
    data: { driverId: null, acceptedAt: null, arrivingAt: null },
  });

  return { ride: updated, cancelledDriverId: driver.id };
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

// Above this, the driver's "current position" is too implausible to trust
// for a final-price recalculation on an urban trip — almost certainly a bad
// GPS reading (e.g. a reading near (0, lng) / "null island"), not a real
// 50km+ detour on a city ride.
const MAX_PLAUSIBLE_ACTUAL_DISTANCE_KM = 50;

/**
 * Whether driver.currentLatitude/currentLongitude can be trusted as "roughly
 * where this ride ended", checked *before* it's ever used for pricing:
 *
 * - present at all (a driver who never reported a position has none)
 * - fresh relative to this specific ride — reported at/after the ride's own
 *   startedAt. A position from before the ride started isn't stale GPS
 *   noise, it's a position that predates the trip entirely: tracking never
 *   sent a single update while this ride was in progress (never (re)started,
 *   interrupted, backgrounded, or the driver simply completed the ride
 *   faster than the first 15s/50m tracking tick — see
 *   useDriverLocationTracking on the mobile side). Trusting it silently
 *   recomputes a near-zero distance from pickup, which is exactly what
 *   produced "final price always equals the base fare" in practice.
 * - not a known-bad sentinel coordinate (exactly (0, 0), "null island" —
 *   never a real position for this Chad-based app)
 */
function isDriverPositionTrustworthy(
  driver: { currentLatitude: number | null; currentLongitude: number | null; lastLocationUpdate: Date | null },
  ride: { startedAt: Date | null },
): driver is { currentLatitude: number; currentLongitude: number; lastLocationUpdate: Date } {
  if (driver.currentLatitude === null || driver.currentLongitude === null) return false;
  if (driver.currentLatitude === 0 && driver.currentLongitude === 0) return false;
  if (!ride.startedAt || !driver.lastLocationUpdate) return false;
  return driver.lastLocationUpdate >= ride.startedAt;
}

export async function completeRide(rideId: string, userId: string) {
  const result = await getRideForDriverTransition(rideId, userId, RideStatus.IN_PROGRESS);
  if ('error' in result) return result;
  const { ride, driver } = result;

  // Recompute from the driver's last known position (continuously tracked
  // while online) as a proxy for where the trip actually ended. If it's
  // unavailable, stale, implausible, or ends up essentially at the planned
  // destination, we simply keep estimatedPrice rather than force a
  // recalculation from a value we can't trust.
  let finalPrice = ride.estimatedPrice;
  const logPrefix = `[ride.service] completeRide(${rideId})`;

  if (!isDriverPositionTrustworthy(driver, ride)) {
    console.log(
      `${logPrefix}: driver position not trustworthy (currentLatitude=${driver.currentLatitude}, ` +
        `currentLongitude=${driver.currentLongitude}, lastLocationUpdate=${driver.lastLocationUpdate?.toISOString() ?? 'null'}, ` +
        `rideStartedAt=${ride.startedAt?.toISOString() ?? 'null'}) — keeping estimatedPrice (${finalPrice} FCFA).`,
    );
  } else {
    // ride.distance is now a road-route distance (see routing.service.ts),
    // so the comparison here must use the same road-route metric — comparing
    // it against a Haversine straight-line distance would almost always look
    // "different enough" to trigger a recalculation, silently underpricing
    // every ride.
    const actualRoute = await getRoute(
      { latitude: ride.pickupLatitude, longitude: ride.pickupLongitude },
      { latitude: driver.currentLatitude, longitude: driver.currentLongitude },
      ride.vehicleType,
    );

    if (actualRoute.distanceKm > MAX_PLAUSIBLE_ACTUAL_DISTANCE_KM) {
      console.warn(
        `${logPrefix}: driver position (${driver.currentLatitude}, ${driver.currentLongitude}) is ` +
          `${actualRoute.distanceKm}km from pickup — implausible for an urban trip, keeping estimatedPrice (${finalPrice} FCFA).`,
      );
    } else if (Math.abs(actualRoute.distanceKm - ride.distance) >= FINAL_DISTANCE_TOLERANCE_KM) {
      finalPrice = await calculatePrice(actualRoute.distanceKm, ride.vehicleType);
      console.log(
        `${logPrefix}: recalculated final price from driver position (${driver.currentLatitude}, ${driver.currentLongitude}) — ` +
          `actual distance ${actualRoute.distanceKm}km (planned ${ride.distance}km), final price ${finalPrice} FCFA (was estimated ${ride.estimatedPrice} FCFA).`,
      );
    } else {
      console.log(
        `${logPrefix}: actual distance ${actualRoute.distanceKm}km matches planned ${ride.distance}km within tolerance — ` +
          `keeping estimatedPrice (${finalPrice} FCFA).`,
      );
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

const HISTORY_PAGE_SIZE = 20;
const HISTORY_STATUSES: RideStatus[] = [RideStatus.COMPLETED, RideStatus.CANCELLED];

export async function getHistory(userId: string, role: UserRole, page: number) {
  const isDriver = role === UserRole.DRIVER;
  let driverId: string | null = null;

  if (isDriver) {
    const driver = await prisma.driver.findUnique({ where: { userId } });
    if (!driver) {
      return { rides: [], total: 0, page, pageSize: HISTORY_PAGE_SIZE, totalRevenue: 0 };
    }
    driverId = driver.id;
  }

  const where = isDriver
    ? { driverId, status: { in: HISTORY_STATUSES } }
    : { passengerId: userId, status: { in: HISTORY_STATUSES } };

  const [rawRides, total] = await prisma.$transaction([
    prisma.ride.findMany({
      where,
      orderBy: { requestedAt: 'desc' },
      skip: (page - 1) * HISTORY_PAGE_SIZE,
      take: HISTORY_PAGE_SIZE,
      include: { driver: { include: { user: true } }, passenger: true },
    }),
    prisma.ride.count({ where }),
  ]);

  // Flatten driver/passenger to the same safe subset getRideById's consumer
  // exposes — never leak the full Driver/User rows (location, password hash, etc).
  const rides = rawRides.map(({ driver, passenger, ...rideFields }) => ({
    ...rideFields,
    driver: driver
      ? { id: driver.id, rating: driver.rating, firstName: driver.user.firstName, lastName: driver.user.lastName }
      : null,
    passenger: { firstName: passenger.firstName, lastName: passenger.lastName },
  }));

  // Revenue is summed over ALL of the driver's completed rides (not just this
  // page) — simplest useful MVP definition of "their earnings so far".
  let totalRevenue: number | undefined;
  if (isDriver && driverId) {
    const revenueAgg = await prisma.ride.aggregate({
      where: { driverId, status: RideStatus.COMPLETED },
      _sum: { finalPrice: true },
    });
    totalRevenue = revenueAgg._sum.finalPrice ?? 0;
  }

  return { rides, total, page, pageSize: HISTORY_PAGE_SIZE, totalRevenue };
}
