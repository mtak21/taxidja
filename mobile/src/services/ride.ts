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

export interface Ride {
  id: string;
  passengerId: string;
  driverId: string | null;
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
