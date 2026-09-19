import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getRide, type Ride } from '../../../src/services/ride';

const STATUS_LABELS: Record<Ride['status'], string> = {
  REQUESTED: 'En attente',
  SEARCHING: 'En attente',
  ACCEPTED: 'Course acceptée — direction le passager',
  DRIVER_ARRIVING: "Arrivée au point de départ",
  IN_PROGRESS: 'Course en cours',
  COMPLETED: 'Course terminée',
  CANCELLED: 'Course annulée',
};

export default function DriverRideScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRide = useCallback(async () => {
    try {
      const data = await getRide(id);
      setRide(data);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger la course.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadRide();
  }, [loadRide]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={styles.center}>
        <Text>Course introuvable.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.statusText}>{STATUS_LABELS[ride.status]}</Text>

      <View style={styles.details}>
        {ride.pickupAddress && <Text style={styles.detailText}>Départ : {ride.pickupAddress}</Text>}
        {ride.destinationAddress && <Text style={styles.detailText}>Destination : {ride.destinationAddress}</Text>}
        <Text style={styles.detailText}>Distance : {ride.distance} km</Text>
        <Text style={styles.detailText}>Durée estimée : {ride.estimatedDuration} min</Text>
        <Text style={styles.priceText}>{ride.estimatedPrice} FCFA</Text>
      </View>

      <Pressable style={styles.homeButton} onPress={() => router.replace('/(driver)')}>
        <Text style={styles.homeButtonText}>Retour à l'accueil</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statusText: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  details: { gap: 8, alignItems: 'center' },
  detailText: { fontSize: 14, color: '#555' },
  priceText: { fontSize: 22, fontWeight: '700', color: '#1a73e8', marginTop: 8 },
  homeButton: { backgroundColor: '#1a73e8', borderRadius: 8, padding: 16, alignItems: 'center' },
  homeButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
