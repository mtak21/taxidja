import { View, ActivityIndicator } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { useRoleGuard } from '../hooks/useRoleGuard';
import type { AuthUser } from '../store/authStore';
import { colors } from '../theme/colors';

export function RoleGroupLayout({ requiredRole }: { requiredRole: AuthUser['role'] }) {
  const guard = useRoleGuard(requiredRole);

  if (guard.status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (guard.status === 'redirect') {
    return <Redirect href={guard.href} />;
  }

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />;
}
