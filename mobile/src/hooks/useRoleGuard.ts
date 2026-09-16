import { useAuthStore, AuthUser } from '../store/authStore';
import { homeRouteForRole } from '../utils/roleRoutes';

type GuardResult =
  | { status: 'loading' }
  | { status: 'redirect'; href: string }
  | { status: 'ok' };

/**
 * Client-side route guard: redirects away from a role-scoped group if the
 * user isn't authenticated or holds a different role. The backend is the
 * real authority on access control (routes/data are checked via JWT role
 * claims there) — this only prevents an unauthorized screen from flashing.
 */
export function useRoleGuard(requiredRole: AuthUser['role']): GuardResult {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) {
    return { status: 'redirect', href: '/(auth)/login' };
  }
  if (!user) {
    return { status: 'loading' };
  }
  if (user.role !== requiredRole) {
    return { status: 'redirect', href: homeRouteForRole(user.role) };
  }
  return { status: 'ok' };
}
