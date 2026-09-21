import { api } from './api';
import { AuthUser } from '../store/authStore';

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export type VehicleKind = 'MOTO' | 'RAKCHA' | 'CAR';

interface RegisterPassengerInput {
  role: 'PASSENGER';
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  password: string;
}

interface RegisterDriverInput {
  role: 'DRIVER';
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  password: string;
  vehicleType: VehicleKind;
  vehicleBrand: string;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleColor: string;
  licenseNumber: string;
  licenseExpiry: string;
}

export type RegisterInput = RegisterPassengerInput | RegisterDriverInput;

export async function registerRequest(input: RegisterInput) {
  const { data } = await api.post<AuthResponse>('/auth/register', input);
  return data;
}

export async function loginRequest(input: { phone: string; password: string }) {
  const { data } = await api.post<AuthResponse>('/auth/login', input);
  return data;
}

export async function logoutRequest(refreshToken: string) {
  await api.post('/auth/logout', { refreshToken });
}

export async function fetchMe() {
  const { data } = await api.get<{ user: AuthUser }>('/auth/me');
  return data.user;
}
