import { create } from 'zustand';
import { saveTokens, loadTokens, clearTokens } from '../services/secureStorage';

export interface AuthUserVehicle {
  id: string;
  type: 'MOTO' | 'RAKCHA' | 'CAR';
  brand: string | null;
  model: string | null;
  plate: string | null;
  color: string | null;
  isActive: boolean;
}

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  role: 'PASSENGER' | 'DRIVER' | 'ADMIN';
  avatarUrl?: string | null;
  // Only meaningful when role === 'DRIVER' — null/empty otherwise. Refreshed
  // by re-fetching the current user (see fetchMe in services/auth.ts), not
  // pushed in real time: the driver home/profile screens re-fetch it on
  // mount, so an admin's validation or a vehicle edit shows up next time the
  // driver opens/foregrounds the app.
  driverVerificationStatus?: 'PENDING' | 'VERIFIED' | 'SUSPENDED' | null;
  driverRating?: number | null;
  driverLicenseNumber?: string | null;
  driverLicenseExpiry?: string | null;
  vehicles?: AuthUserVehicle[];
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setSession: (user: AuthUser, accessToken: string, refreshToken: string) => Promise<void>;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: AuthUser) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isHydrated: false,

  hydrate: async () => {
    const { accessToken, refreshToken } = await loadTokens();
    set({
      accessToken,
      refreshToken,
      isAuthenticated: Boolean(accessToken && refreshToken),
      isHydrated: true,
    });
  },

  setSession: async (user, accessToken, refreshToken) => {
    await saveTokens(accessToken, refreshToken);
    set({ user, accessToken, refreshToken, isAuthenticated: true });
  },

  setAccessToken: (accessToken) => set({ accessToken }),

  setUser: (user) => set({ user }),

  logout: async () => {
    await clearTokens();
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },
}));
