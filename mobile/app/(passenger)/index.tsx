import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';
import { ScreenHeader } from '../../src/components/ScreenHeader';

export default function PassengerHome() {
  const user = useAuthStore((state) => state.user);

  const handleReserve = () => {
    Alert.alert('Bientôt disponible', 'La réservation de course arrive prochainement.');
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title={`Bonjour ${user?.firstName ?? ''}`} />

      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapPlaceholderText}>Carte à venir</Text>
      </View>

      <Pressable style={styles.reserveButton} onPress={handleReserve}>
        <Text style={styles.reserveButtonText}>Réserver une course</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapPlaceholder: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholderText: { color: '#666', fontSize: 16 },
  reserveButton: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#1a73e8',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  reserveButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
