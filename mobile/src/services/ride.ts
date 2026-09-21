import { api } from './api';

export type VehicleType = 'MOTO' | 'RAKCHA' | 'CAR';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface RideEstimate {
  distance: number;
  estimatedDuration: number;
  estimatedPrice: number;
  /** Road-route polyline from OSRM (backend falls back to a 2-point straight line if OSRM is unreachable). */
  routeGeometry: RoutePoint[];
}

export interface RideDriver {
  id: string;
  firstName: string;
  lastName: string;
  rating: number;
  /** Present while a driver is assigned — seeds the live-tracking marker before the first socket update arrives. */
  currentLatitude?: number | null;
  currentLongitude?: number | null;
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
  /** null if the ride predates this field or OSRM was unreachable at creation time. */
  routeGeometry: RoutePoint[] | null;
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

export interface Rating {
  id: string;
  rideId: string;
  score: number;
  comment: string | null;
  createdAt: string;
}

export async function rateRide(id: string, score: number, comment?: string): Promise<Rating> {
  const { data } = await api.post(`/rides/${id}/rating`, { score, comment });
  return data.rating;
}

export interface HistoryRide {
  id: string;
  driver: RideDriver | null;
  passenger: RidePassenger | null;
  destinationAddress: string | null;
  pickupAddress: string | null;
  distance: number;
  estimatedPrice: number;
  finalPrice: number | null;
  status: Ride['status'];
  requestedAt: string;
}

export interface HistoryResponse {
  rides: HistoryRide[];
  total: number;
  page: number;
  pageSize: number;
  totalRevenue?: number;
}

export async function getRideHistory(page = 1): Promise<HistoryResponse> {
  const { data } = await api.get('/rides/history', { params: { page } });
  return data;
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

/** Payload of the `driver:position_update` socket event, sent to the assigned passenger on every driver location update while the trip is active. */
export interface DriverPositionUpdatePayload {
  rideId: string;
  latitude: number;
  longitude: number;
}
