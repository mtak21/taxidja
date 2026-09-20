import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { AppMap } from '../../src/components/AppMap';
import { useLocation } from '../../src/hooks/useLocation';

export default function PassengerHome() {
  const user = useAuthStore((state) => state.user);
  const { coordinates, loading, errorMessage } = useLocation();

  const handleReserve = () => {
    router.push('/(passenger)/book');
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title={`Bonjour ${user?.firstName ?? ''}`} />

      <AppMap
        coordinates={coordinates}
        loading={loading}
        errorMessage={errorMessage}
        markerTitle="Ma position"
      />

      <Pressable style={styles.reserveButton} onPress={handleReserve}>
        <Text style={styles.reserveButtonText}>Réserver une course</Text>
      </Pressable>

      <Pressable style={styles.historyButton} onPress={() => router.push('/(passenger)/history')}>
        <Text style={styles.historyButtonText}>Mes courses</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  reserveButton: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#1a73e8',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  reserveButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  historyButton: {
    margin: 16,
    marginTop: 0,
    borderWidth: 1,
    borderColor: '#1a73e8',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  historyButtonText: { color: '#1a73e8', fontWeight: '600', fontSize: 16 },
});
