import { api } from './client';
import type {
  AdminDriver,
  AdminRideDetail,
  AdminRideListItem,
  AdminUser,
  AdminVehicle,
  City,
  DriverVerificationStatus,
  PricingConfig,
  RideStatus,
  Stats,
  UserRole,
  VehicleType,
  Zone,
} from '../types';

export async function getStats() {
  const { data } = await api.get<{ stats: Stats }>('/admin/stats');
  return data.stats;
}

// --- Users ------------------------------------------------------------

export async function listUsers(params: { page: number; search?: string; role?: UserRole }) {
  const { data } = await api.get<{ users: AdminUser[]; total: number; page: number; pageSize: number }>(
    '/admin/users',
    { params },
  );
  return data;
}

export async function updateUserStatus(id: string, isActive: boolean) {
  const { data } = await api.patch<{ user: AdminUser }>(`/admin/users/${id}/status`, { isActive });
  return data.user;
}

// --- Drivers ------------------------------------------------------------

export async function listDrivers(params: { page: number; search?: string }) {
  const { data } = await api.get<{ drivers: AdminDriver[]; total: number; page: number; pageSize: number }>(
    '/admin/drivers',
    { params },
  );
  return data;
}

export async function updateDriverVerification(id: string, status: DriverVerificationStatus) {
  const { data } = await api.patch<{ driver: AdminDriver }>(`/admin/drivers/${id}/verification`, { status });
  return data.driver;
}

// --- Vehicles ------------------------------------------------------------

export async function listVehicles(params: { page: number }) {
  const { data } = await api.get<{ vehicles: AdminVehicle[]; total: number; page: number; pageSize: number }>(
    '/admin/vehicles',
    { params },
  );
  return data;
}

export async function createVehicle(input: { driverId: string; type: VehicleType; plate?: string; isActive: boolean }) {
  const { data } = await api.post<{ vehicle: AdminVehicle }>('/admin/vehicles', input);
  return data.vehicle;
}

export async function updateVehicle(id: string, input: { type?: VehicleType; plate?: string | null; isActive?: boolean }) {
  const { data } = await api.patch<{ vehicle: AdminVehicle }>(`/admin/vehicles/${id}`, input);
  return data.vehicle;
}

export async function deleteVehicle(id: string) {
  await api.delete(`/admin/vehicles/${id}`);
}

// --- Rides ------------------------------------------------------------

export async function listRides(params: { page: number; search?: string; status?: RideStatus }) {
  const { data } = await api.get<{ rides: AdminRideListItem[]; total: number; page: number; pageSize: number }>(
    '/admin/rides',
    { params },
  );
  return data;
}

export async function getRideDetail(id: string) {
  const { data } = await api.get<{ ride: AdminRideDetail }>(`/admin/rides/${id}`);
  return data.ride;
}

// --- Cities ------------------------------------------------------------

export async function listCities() {
  const { data } = await api.get<{ cities: City[] }>('/admin/cities');
  return data.cities;
}

export async function createCity(name: string) {
  const { data } = await api.post<{ city: City }>('/admin/cities', { name });
  return data.city;
}

export async function updateCity(id: string, input: { name?: string; isActive?: boolean }) {
  const { data } = await api.patch<{ city: City }>(`/admin/cities/${id}`, input);
  return data.city;
}

// --- Zones ------------------------------------------------------------

export async function createZone(input: { cityId: string; name: string }) {
  const { data } = await api.post<{ zone: Zone }>('/admin/zones', input);
  return data.zone;
}

export async function updateZone(id: string, input: { name?: string; isActive?: boolean }) {
  const { data } = await api.patch<{ zone: Zone }>(`/admin/zones/${id}`, input);
  return data.zone;
}

// --- Pricing ------------------------------------------------------------

export async function listPricing() {
  const { data } = await api.get<{ pricing: PricingConfig[] }>('/admin/pricing');
  return data.pricing;
}

export async function updatePricing(vehicleType: VehicleType, input: { baseFare: number; pricePerKm: number }) {
  const { data } = await api.patch<{ pricing: PricingConfig }>(`/admin/pricing/${vehicleType}`, input);
  return data.pricing;
}
