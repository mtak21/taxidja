import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getRide, markArriving, startRide, completeRide, type Ride } from '../../../src/services/ride';

const STATUS_LABELS: Record<Ride['status'], string> = {
  REQUESTED: 'En attente',
  SEARCHING: 'En attente',
  ACCEPTED: 'Course acceptée — direction le passager',
  DRIVER_ARRIVING: 'Arrivée au point de départ',
  IN_PROGRESS: 'Course en cours',
  COMPLETED: 'Course terminée',
  CANCELLED: 'Course annulée',
};

// The one action available at each stage, and the transition it triggers.
const NEXT_ACTION: Partial<Record<Ride['status'], { label: string; action: (id: string) => Promise<Ride> }>> = {
  ACCEPTED: { label: 'Je suis arrivé', action: markArriving },
  DRIVER_ARRIVING: { label: 'Démarrer la course', action: startRide },
  IN_PROGRESS: { label: 'Terminer la course', action: completeRide },
};

export default function DriverRideScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

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

  const handleNextAction = async () => {
    if (!ride) return;
    const next = NEXT_ACTION[ride.status];
    if (!next) return;

    setIsUpdating(true);
    try {
      const updated = await next.action(id);
      setRide(updated);
    } catch {
      Alert.alert('Erreur', 'Impossible de mettre à jour la course. Réessaie.');
    } finally {
      setIsUpdating(false);
    }
  };

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

  const nextAction = NEXT_ACTION[ride.status];
  const isCompleted = ride.status === 'COMPLETED';

  return (
    <View style={styles.container}>
      <Text style={styles.statusText}>{STATUS_LABELS[ride.status]}</Text>

      <View style={styles.details}>
        {ride.passenger && (
          <Text style={styles.detailText}>
            Passager : {ride.passenger.firstName} {ride.passenger.lastName}
          </Text>
        )}
        {ride.pickupAddress && <Text style={styles.detailText}>Départ : {ride.pickupAddress}</Text>}
        {ride.destinationAddress && <Text style={styles.detailText}>Destination : {ride.destinationAddress}</Text>}
        <Text style={styles.detailText}>Distance : {ride.distance} km</Text>
        <Text style={styles.detailText}>Durée estimée : {ride.estimatedDuration} min</Text>
        <Text style={styles.priceText}>
          {isCompleted && ride.finalPrice !== null ? `${ride.finalPrice} FCFA (prix final)` : `${ride.estimatedPrice} FCFA`}
        </Text>
      </View>

      {nextAction && (
        <Pressable style={styles.actionButton} onPress={handleNextAction} disabled={isUpdating}>
          <Text style={styles.actionButtonText}>{isUpdating ? 'Mise à jour...' : nextAction.label}</Text>
        </Pressable>
      )}

      {!nextAction && (
        <Pressable style={styles.homeButton} onPress={() => router.replace('/(driver)')}>
          <Text style={styles.homeButtonText}>Retour à l'accueil</Text>
        </Pressable>
      )}
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
  actionButton: { backgroundColor: '#2e7d32', borderRadius: 8, padding: 16, alignItems: 'center' },
  actionButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  homeButton: { backgroundColor: '#1a73e8', borderRadius: 8, padding: 16, alignItems: 'center' },
  homeButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
