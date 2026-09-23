import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { homeRouteForRole } from '../src/utils/roleRoutes';
import { getActiveRide } from '../src/services/ride';
import { colors } from '../src/theme/colors';

export default function Index() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const [activeRideChecked, setActiveRideChecked] = useState(false);
  const [activeRideRoute, setActiveRideRoute] = useState<string | null>(null);

  // Runs once per app launch, right after auth resolves — resumes straight
  // into an in-progress ride's status screen instead of landing on Accueil.
  // Admins have no ride concept, so they skip straight through.
  useEffect(() => {
    if (!isAuthenticated || !user || user.role === 'ADMIN') {
      setActiveRideChecked(true);
      return;
    }

    let cancelled = false;
    getActiveRide()
      .then((ride) => {
        if (cancelled || !ride) return;
        const base = user.role === 'DRIVER' ? '/(driver)/ride' : '/(passenger)/ride';
        setActiveRideRoute(`${base}/${ride.id}`);
      })
      .catch(() => {
        // Non-fatal — fall through to the normal home landing.
      })
      .finally(() => {
        if (!cancelled) setActiveRideChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user]);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!user) {
    // Still fetching /auth/me after hydration — RootLayout shows a spinner.
    return null;
  }

  if (!activeRideChecked) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (activeRideRoute) {
    return <Redirect href={activeRideRoute} />;
  }

  return <Redirect href={homeRouteForRole(user.role)} />;
}
