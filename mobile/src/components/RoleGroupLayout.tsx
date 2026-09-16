import { View, ActivityIndicator } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { useRoleGuard } from '../hooks/useRoleGuard';
import type { AuthUser } from '../store/authStore';

export function RoleGroupLayout({ requiredRole }: { requiredRole: AuthUser['role'] }) {
  const guard = useRoleGuard(requiredRole);

  if (guard.status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (guard.status === 'redirect') {
    return <Redirect href={guard.href} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
