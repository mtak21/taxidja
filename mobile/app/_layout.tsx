import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { api } from '../src/services/api';

export default function RootLayout() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isHydrated && isAuthenticated && !user) {
      api
        .get('/auth/me')
        .then(({ data }) => setUser(data.user))
        .catch(() => logout());
    }
  }, [isHydrated, isAuthenticated, user, setUser, logout]);

  if (!isHydrated || (isAuthenticated && !user)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
