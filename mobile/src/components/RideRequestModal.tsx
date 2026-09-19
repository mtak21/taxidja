import { useEffect, useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import type { RideRequestPayload } from '../services/ride';

interface RideRequestModalProps {
  request: RideRequestPayload | null;
  onAccept: () => void;
  onReject: () => void;
}

export function RideRequestModal({ request, onAccept, onReject }: RideRequestModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(request?.responseTimeoutSeconds ?? 15);

  useEffect(() => {
    if (!request) return;
    setSecondsLeft(request.responseTimeoutSeconds);

    const interval = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [request]);

  // Separate effect so onReject() (a parent setState) never runs from inside
  // the setSecondsLeft updater above — doing so triggers React's "cannot
  // update a component while rendering a different component" warning.
  useEffect(() => {
    if (request && secondsLeft === 0) {
      onReject();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, request]);

  if (!request) return null;

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.countdown}>{secondsLeft}s</Text>
          <Text style={styles.title}>Nouvelle demande de course</Text>

          <View style={styles.details}>
            {request.pickupAddress && <Text style={styles.detailText}>Départ : {request.pickupAddress}</Text>}
            {request.destinationAddress && (
              <Text style={styles.detailText}>Destination : {request.destinationAddress}</Text>
            )}
            <Text style={styles.detailText}>Distance jusqu'au passager : {request.distanceToPickupKm} km</Text>
            <Text style={styles.detailText}>Trajet : {request.rideDistanceKm} km · {request.estimatedDuration} min</Text>
            <Text style={styles.priceText}>{request.estimatedPrice} FCFA</Text>
          </View>

          <View style={styles.buttonRow}>
            <Pressable style={[styles.button, styles.rejectButton]} onPress={onReject}>
              <Text style={styles.buttonText}>Refuser</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.acceptButton]} onPress={onAccept}>
              <Text style={styles.buttonText}>Accepter</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  card: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 16 },
  countdown: { fontSize: 28, fontWeight: '700', color: '#d32f2f', textAlign: 'center' },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  details: { gap: 6 },
  detailText: { fontSize: 14, color: '#555' },
  priceText: { fontSize: 22, fontWeight: '700', color: '#1a73e8', marginTop: 4 },
  buttonRow: { flexDirection: 'row', gap: 12 },
  button: { flex: 1, borderRadius: 8, padding: 16, alignItems: 'center' },
  rejectButton: { backgroundColor: '#d32f2f' },
  acceptButton: { backgroundColor: '#2e7d32' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
