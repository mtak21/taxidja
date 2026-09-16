import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { homeRouteForRole } from '../src/utils/roleRoutes';

export default function Index() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!user) {
    // Still fetching /auth/me after hydration — RootLayout shows a spinner.
    return null;
  }

  return <Redirect href={homeRouteForRole(user.role)} />;
}
