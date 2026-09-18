import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getRide, cancelRide, type Ride } from '../../../src/services/ride';

const STATUS_LABELS: Record<Ride['status'], string> = {
  REQUESTED: 'Recherche d\'un conducteur...',
  SEARCHING: 'Recherche d\'un conducteur...',
  ACCEPTED: 'Conducteur trouvé',
  DRIVER_ARRIVING: 'Le conducteur arrive',
  IN_PROGRESS: 'Course en cours',
  COMPLETED: 'Course terminée',
  CANCELLED: 'Course annulée',
};

const CANCELLABLE_STATUSES: Ride['status'][] = ['REQUESTED', 'SEARCHING'];

export default function RideStatusScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

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

  const handleCancel = () => {
    Alert.alert('Annuler la course ?', 'Cette action est irréversible.', [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Oui, annuler',
        style: 'destructive',
        onPress: async () => {
          setIsCancelling(true);
          try {
            const updated = await cancelRide(id);
            setRide(updated);
          } catch {
            Alert.alert('Erreur', "Impossible d'annuler la course.");
          } finally {
            setIsCancelling(false);
          }
        },
      },
    ]);
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

  const canCancel = CANCELLABLE_STATUSES.includes(ride.status);

  return (
    <View style={styles.container}>
      <View style={styles.statusBox}>
        {(ride.status === 'REQUESTED' || ride.status === 'SEARCHING') && (
          <ActivityIndicator size="large" style={styles.spinner} />
        )}
        <Text style={styles.statusText}>{STATUS_LABELS[ride.status]}</Text>
      </View>

      <View style={styles.details}>
        {ride.destinationAddress && <Text style={styles.detailText}>Destination : {ride.destinationAddress}</Text>}
        <Text style={styles.detailText}>Distance : {ride.distance} km</Text>
        <Text style={styles.detailText}>Durée estimée : {ride.estimatedDuration} min</Text>
        <Text style={styles.priceText}>{ride.estimatedPrice} FCFA</Text>
      </View>

      {canCancel && (
        <Pressable style={styles.cancelButton} onPress={handleCancel} disabled={isCancelling}>
          <Text style={styles.cancelButtonText}>{isCancelling ? 'Annulation...' : 'Annuler la course'}</Text>
        </Pressable>
      )}

      {!canCancel && (
        <Pressable style={styles.homeButton} onPress={() => router.replace('/(passenger)')}>
          <Text style={styles.homeButtonText}>Retour à l'accueil</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statusBox: { alignItems: 'center', gap: 16 },
  spinner: { marginBottom: 8 },
  statusText: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  details: { gap: 8, alignItems: 'center' },
  detailText: { fontSize: 14, color: '#555' },
  priceText: { fontSize: 22, fontWeight: '700', color: '#1a73e8', marginTop: 8 },
  cancelButton: { backgroundColor: '#d32f2f', borderRadius: 8, padding: 16, alignItems: 'center' },
  cancelButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  homeButton: { backgroundColor: '#1a73e8', borderRadius: 8, padding: 16, alignItems: 'center' },
  homeButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
