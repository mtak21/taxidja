import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { AppMap } from '../../src/components/AppMap';
import { useLocation } from '../../src/hooks/useLocation';
import { Button } from '../../src/components/ui/Button';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

export default function PassengerHome() {
  const user = useAuthStore((state) => state.user);
  const { coordinates, loading, errorMessage } = useLocation();

  const handleReserve = () => {
    router.push('/(passenger)/book');
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title={`Bonjour ${user?.firstName ?? ''}`} onProfilePress={() => router.push('/(passenger)/profile')} />

      <AppMap
        coordinates={coordinates}
        loading={loading}
        errorMessage={errorMessage}
        markerTitle="Ma position"
      />

      <View style={styles.actions}>
        <Button title="Réserver une course" onPress={handleReserve} />
        <Button title="Mes courses" variant="secondary" onPress={() => router.push('/(passenger)/history')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  actions: { padding: spacing.lg, paddingTop: 0, gap: spacing.md },
});
