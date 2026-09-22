import { api } from './api';
import type { AuthUserVehicle } from '../store/authStore';

export async function updateDriverStatus(online: boolean) {
  const { data } = await api.patch('/driver/status', { online });
  return data;
}

export async function updateDriverLocation(latitude: number, longitude: number) {
  const { data } = await api.patch('/driver/location', { latitude, longitude });
  return data;
}

export interface VehicleInput {
  type: 'MOTO' | 'RAKCHA' | 'CAR';
  brand: string;
  model: string;
  plate: string;
  color: string;
}

/** Adds a new vehicle — it becomes the driver's one active vehicle, deactivating any other. */
export async function addVehicle(input: VehicleInput): Promise<AuthUserVehicle> {
  const { data } = await api.post<{ vehicle: AuthUserVehicle }>('/driver/vehicle', input);
  return data.vehicle;
}

export async function updateVehicle(
  id: string,
  input: Partial<VehicleInput> & { isActive?: boolean },
): Promise<AuthUserVehicle> {
  const { data } = await api.patch<{ vehicle: AuthUserVehicle }>(`/driver/vehicle/${id}`, input);
  return data.vehicle;
}
