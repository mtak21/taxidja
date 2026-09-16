import { api } from './api';
import { AuthUser } from '../store/authStore';

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export async function registerRequest(input: {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  password: string;
}) {
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
