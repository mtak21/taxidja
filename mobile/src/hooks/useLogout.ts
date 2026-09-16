import { router } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { logoutRequest } from '../services/auth';

export function useLogout() {
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const logout = useAuthStore((state) => state.logout);

  return async function handleLogout() {
    if (refreshToken) {
      try {
        await logoutRequest(refreshToken);
      } catch {
        // ignore network errors on logout, clear local session anyway
      }
    }
    await logout();
    router.replace('/(auth)/login');
  };
}
