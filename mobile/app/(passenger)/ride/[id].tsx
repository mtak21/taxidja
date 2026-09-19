import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  getRide,
  cancelRide,
  type Ride,
  type DriverAssignedPayload,
  type RideLifecyclePayload,
  type RideCompletedPayload,
} from '../../../src/services/ride';
import { connectSocket, disconnectSocket } from '../../../src/services/socket';

const STATUS_LABELS: Record<Ride['status'], string> = {
  REQUESTED: 'Recherche d\'un conducteur...',
  SEARCHING: 'Recherche d\'un conducteur...',
  ACCEPTED: 'Conducteur en route',
  DRIVER_ARRIVING: 'Conducteur arrivé',
  IN_PROGRESS: 'Course en cours',
  COMPLETED: 'Course terminée',
  CANCELLED: 'Course annulée',
};

const SEARCHING_STATUSES: Ride['status'][] = ['REQUESTED', 'SEARCHING'];
const CANCELLABLE_STATUSES: Ride['status'][] = ['REQUESTED', 'SEARCHING'];
// Any non-terminal status: keep the socket connected across the whole trip,
// not just while searching, so lifecycle updates arrive without polling.
const LIVE_STATUSES: Ride['status'][] = ['REQUESTED', 'SEARCHING', 'ACCEPTED', 'DRIVER_ARRIVING', 'IN_PROGRESS'];

export default function RideStatusScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  const [noDriverMessage, setNoDriverMessage] = useState(false);

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

  // Listen for realtime dispatch and trip-lifecycle events — no polling.
  useEffect(() => {
    if (!ride || !LIVE_STATUSES.includes(ride.status)) return;

    const socket = connectSocket();

    const handleAssigned = (payload: DriverAssignedPayload) => {
      if (payload.rideId !== id) return;
      setEtaMinutes(payload.etaMinutes);
      loadRide();
    };

    const handleNoDriver = (payload: RideLifecyclePayload) => {
      if (payload.rideId !== id) return;
      setNoDriverMessage(true);
      loadRide();
    };

    const handleArriving = (payload: RideLifecyclePayload) => {
      if (payload.rideId !== id) return;
      loadRide();
    };

    const handleStarted = (payload: RideLifecyclePayload) => {
      if (payload.rideId !== id) return;
      loadRide();
    };

    const handleCompleted = (payload: RideCompletedPayload) => {
      if (payload.rideId !== id) return;
      loadRide();
    };

    socket.on('ride:driver_assigned', handleAssigned);
    socket.on('ride:no_driver_available', handleNoDriver);
    socket.on('ride:arriving', handleArriving);
    socket.on('ride:started', handleStarted);
    socket.on('ride:completed', handleCompleted);

    return () => {
      socket.off('ride:driver_assigned', handleAssigned);
      socket.off('ride:no_driver_available', handleNoDriver);
      socket.off('ride:arriving', handleArriving);
      socket.off('ride:started', handleStarted);
      socket.off('ride:completed', handleCompleted);
      disconnectSocket();
    };
  }, [ride?.status, id, loadRide]);

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
  const isCompleted = ride.status === 'COMPLETED';

  return (
    <View style={styles.container}>
      <View style={styles.statusBox}>
        {SEARCHING_STATUSES.includes(ride.status) && <ActivityIndicator size="large" style={styles.spinner} />}
        <Text style={styles.statusText}>{STATUS_LABELS[ride.status]}</Text>
        {ride.status === 'CANCELLED' && noDriverMessage && (
          <Text style={styles.noDriverText}>Aucun conducteur disponible pour le moment. Réessaie dans quelques minutes.</Text>
        )}
      </View>

      {ride.driver && (
        <View style={styles.driverBox}>
          <Text style={styles.driverName}>
            {ride.driver.firstName} {ride.driver.lastName}
          </Text>
          <Text style={styles.detailText}>Note : {ride.driver.rating.toFixed(1)} / 5</Text>
          {etaMinutes !== null && !isCompleted && (
            <Text style={styles.detailText}>Arrivée estimée : {etaMinutes} min</Text>
          )}
        </View>
      )}

      <View style={styles.details}>
        {ride.destinationAddress && <Text style={styles.detailText}>Destination : {ride.destinationAddress}</Text>}
        <Text style={styles.detailText}>Distance : {ride.distance} km</Text>
        <Text style={styles.detailText}>Durée estimée : {ride.estimatedDuration} min</Text>
        {isCompleted && ride.finalPrice !== null ? (
          <Text style={styles.priceText}>{ride.finalPrice} FCFA (prix final)</Text>
        ) : (
          <Text style={styles.priceText}>{ride.estimatedPrice} FCFA</Text>
        )}
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
  noDriverText: { fontSize: 13, color: '#d32f2f', textAlign: 'center' },
  driverBox: { alignItems: 'center', gap: 4, backgroundColor: '#f5f5f5', borderRadius: 12, padding: 16 },
  driverName: { fontSize: 16, fontWeight: '700' },
  details: { gap: 8, alignItems: 'center' },
  detailText: { fontSize: 14, color: '#555' },
  priceText: { fontSize: 22, fontWeight: '700', color: '#1a73e8', marginTop: 8 },
  cancelButton: { backgroundColor: '#d32f2f', borderRadius: 8, padding: 16, alignItems: 'center' },
  cancelButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  homeButton: { backgroundColor: '#1a73e8', borderRadius: 8, padding: 16, alignItems: 'center' },
  homeButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
