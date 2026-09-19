import { api } from './api';

export type VehicleType = 'MOTO' | 'RAKCHA' | 'CAR';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface RideEstimate {
  distance: number;
  estimatedDuration: number;
  estimatedPrice: number;
}

export interface RideDriver {
  id: string;
  firstName: string;
  lastName: string;
  rating: number;
}

export interface RidePassenger {
  firstName: string;
  lastName: string;
}

export interface Ride {
  id: string;
  passengerId: string;
  driverId: string | null;
  driver: RideDriver | null;
  passenger: RidePassenger | null;
  vehicleType: VehicleType;
  pickupLatitude: number;
  pickupLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
  pickupAddress: string | null;
  destinationAddress: string | null;
  distance: number;
  estimatedDuration: number;
  estimatedPrice: number;
  finalPrice: number | null;
  status: 'REQUESTED' | 'SEARCHING' | 'ACCEPTED' | 'DRIVER_ARRIVING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  requestedAt: string;
}

export async function estimateRide(
  pickup: Coordinates,
  destination: Coordinates,
  vehicleType: VehicleType,
): Promise<RideEstimate> {
  const { data } = await api.post('/rides/estimate', { pickup, destination, vehicleType });
  return data.estimate;
}

export async function createRide(params: {
  pickup: Coordinates;
  destination: Coordinates;
  vehicleType: VehicleType;
  pickupAddress?: string;
  destinationAddress?: string;
}): Promise<Ride> {
  const { data } = await api.post('/rides', params);
  return data.ride;
}

export async function getRide(id: string): Promise<Ride> {
  const { data } = await api.get(`/rides/${id}`);
  return data.ride;
}

export async function cancelRide(id: string): Promise<Ride> {
  const { data } = await api.patch(`/rides/${id}/cancel`);
  return data.ride;
}

export async function markArriving(id: string): Promise<Ride> {
  const { data } = await api.patch(`/rides/${id}/arriving`);
  return data.ride;
}

export async function startRide(id: string): Promise<Ride> {
  const { data } = await api.patch(`/rides/${id}/start`);
  return data.ride;
}

export async function completeRide(id: string): Promise<Ride> {
  const { data } = await api.patch(`/rides/${id}/complete`);
  return data.ride;
}

/** Payload of the `ride:requested` socket event sent to a candidate driver. */
export interface RideRequestPayload {
  rideId: string;
  pickupAddress: string | null;
  destinationAddress: string | null;
  distanceToPickupKm: number;
  rideDistanceKm: number;
  estimatedDuration: number;
  estimatedPrice: number;
  vehicleType: VehicleType;
  responseTimeoutSeconds: number;
}

/** Payload of the `ride:driver_assigned` socket event sent to the passenger. */
export interface DriverAssignedPayload {
  rideId: string;
  driver: { firstName: string; lastName: string; rating: number };
  etaMinutes: number;
}

/** Payloads of the trip-lifecycle socket events sent to the passenger. */
export interface RideLifecyclePayload {
  rideId: string;
}

export interface RideCompletedPayload {
  rideId: string;
  finalPrice: number;
}
