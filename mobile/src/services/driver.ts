import { api } from './api';

export async function updateDriverStatus(online: boolean) {
  const { data } = await api.patch('/driver/status', { online });
  return data;
}

export async function updateDriverLocation(latitude: number, longitude: number) {
  const { data } = await api.patch('/driver/location', { latitude, longitude });
  return data;
}
