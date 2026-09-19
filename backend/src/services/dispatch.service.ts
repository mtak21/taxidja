import { RideStatus, VehicleType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { findCandidates, type DriverCandidate } from './matching.service';
import { estimateDurationMinutes } from './pricing.service';
import { getIo, userRoom } from '../socket/io';

// Ride dispatch is orchestrated in-memory: each active search holds the
// ordered candidate list and which one we're currently waiting on. This is
// a deliberate MVP simplification — it assumes a single backend process.
// Scaling to multiple instances would need this state moved to something
// shared (Redis, a DB table), since a candidate's response could land on a
// different process than the one that made the offer. Not needed here.
const RESPONSE_TIMEOUT_MS = 15000;

interface DispatchState {
  candidates: DriverCandidate[];
  currentIndex: number;
  timer: NodeJS.Timeout | null;
  ride: {
    passengerId: string;
    pickupAddress: string | null;
    destinationAddress: string | null;
    distance: number;
    estimatedDuration: number;
    estimatedPrice: number;
    vehicleType: VehicleType;
  };
}

const activeSearches = new Map<string, DispatchState>();

export async function startSearch(rideId: string) {
  const ride = await prisma.ride.update({
    where: { id: rideId },
    data: { status: RideStatus.SEARCHING },
  });

  const candidates = await findCandidates(
    { latitude: ride.pickupLatitude, longitude: ride.pickupLongitude },
    ride.vehicleType,
  );

  activeSearches.set(rideId, {
    candidates,
    currentIndex: 0,
    timer: null,
    ride: {
      passengerId: ride.passengerId,
      pickupAddress: ride.pickupAddress,
      destinationAddress: ride.destinationAddress,
      distance: ride.distance,
      estimatedDuration: ride.estimatedDuration,
      estimatedPrice: ride.estimatedPrice,
      vehicleType: ride.vehicleType,
    },
  });

  await offerNextCandidate(rideId);
}

async function offerNextCandidate(rideId: string) {
  const state = activeSearches.get(rideId);
  if (!state) return;

  if (state.currentIndex >= state.candidates.length) {
    await exhaustSearch(rideId);
    return;
  }

  const candidate = state.candidates[state.currentIndex]!;

  getIo()
    .to(userRoom(candidate.userId))
    .emit('ride:requested', {
      rideId,
      pickupAddress: state.ride.pickupAddress,
      destinationAddress: state.ride.destinationAddress,
      distanceToPickupKm: candidate.distanceKm,
      rideDistanceKm: state.ride.distance,
      estimatedDuration: state.ride.estimatedDuration,
      estimatedPrice: state.ride.estimatedPrice,
      vehicleType: state.ride.vehicleType,
      responseTimeoutSeconds: RESPONSE_TIMEOUT_MS / 1000,
    });

  state.timer = setTimeout(() => {
    handleDriverResponse(rideId, candidate.userId, 'timeout').catch(console.error);
  }, RESPONSE_TIMEOUT_MS);
}

export async function handleDriverResponse(
  rideId: string,
  userId: string,
  response: 'accepted' | 'rejected' | 'timeout',
) {
  const state = activeSearches.get(rideId);
  if (!state) return; // ride already resolved (accepted/cancelled) — ignore late/duplicate responses

  const candidate = state.candidates[state.currentIndex];
  if (!candidate || candidate.userId !== userId) return; // stale response from a driver no longer being asked

  if (state.timer) clearTimeout(state.timer);
  state.timer = null;

  if (response === 'accepted') {
    await finalizeAcceptance(rideId, state, candidate);
    return;
  }

  state.currentIndex += 1;
  await offerNextCandidate(rideId);
}

async function finalizeAcceptance(rideId: string, state: DispatchState, candidate: DriverCandidate) {
  const ride = await prisma.ride.update({
    where: { id: rideId },
    data: { driverId: candidate.driverId, status: RideStatus.ACCEPTED, acceptedAt: new Date() },
  });

  activeSearches.delete(rideId);

  const etaMinutes = estimateDurationMinutes(candidate.distanceKm, state.ride.vehicleType);

  getIo()
    .to(userRoom(ride.passengerId))
    .emit('ride:driver_assigned', {
      rideId,
      driver: {
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        rating: candidate.rating,
      },
      etaMinutes,
    });
}

// No candidate accepted (list exhausted): the MVP choice is to cancel the
// ride outright rather than silently reverting it to REQUESTED for a retry.
// Reasoning: REQUESTED implies "waiting", but nothing is actually happening
// anymore — the passenger would sit on a dead ride until they noticed and
// manually cancelled. CANCELLED is an honest terminal state, reuses the
// existing cancel plumbing (status, cancelledAt, the app's "Course annulée"
// screen) with zero new UI, and the socket event lets the client explain why
// before showing that screen. Trade-off: no automatic retry — the passenger
// has to book again. Acceptable for an MVP; a "no drivers nearby, retry?"
// flow can be layered on later without changing this contract.
async function exhaustSearch(rideId: string) {
  const state = activeSearches.get(rideId);
  if (!state) return;

  const ride = await prisma.ride.update({
    where: { id: rideId },
    data: { status: RideStatus.CANCELLED, cancelledAt: new Date() },
  });

  activeSearches.delete(rideId);

  getIo().to(userRoom(ride.passengerId)).emit('ride:no_driver_available', { rideId });
}

/** A driver's socket dropped while they were the one being asked — treat it as an immediate timeout/reject. */
export async function handleDriverDisconnect(userId: string) {
  for (const [rideId, state] of activeSearches) {
    const candidate = state.candidates[state.currentIndex];
    if (candidate && candidate.userId === userId) {
      await handleDriverResponse(rideId, userId, 'timeout');
    }
  }
}

/** Stops an in-flight search, e.g. when the passenger cancels while SEARCHING. */
export function cancelSearch(rideId: string) {
  const state = activeSearches.get(rideId);
  if (!state) return;
  if (state.timer) clearTimeout(state.timer);
  activeSearches.delete(rideId);
}
