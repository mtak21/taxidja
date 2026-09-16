import { create } from 'zustand';
import { saveTokens, loadTokens, clearTokens } from '../services/secureStorage';

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  role: 'PASSENGER' | 'DRIVER' | 'ADMIN';
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
