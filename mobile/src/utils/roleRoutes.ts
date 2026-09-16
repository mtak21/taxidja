import type { AuthUser } from '../store/authStore';

export function homeRouteForRole(role: AuthUser['role']): string {
  switch (role) {
    case 'PASSENGER':
      return '/(passenger)';
    case 'DRIVER':
      return '/(driver)';
    case 'ADMIN':
      return '/(admin)';
  }
}
