import { useEffect, useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import type { RideRequestPayload } from '../services/ride';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';
import { typography } from '../theme/typography';

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
          <View style={styles.countdownCircle}>
            <Text style={styles.countdown}>{secondsLeft}</Text>
          </View>
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
  backdrop: { flex: 1, backgroundColor: 'rgba(26,46,68,0.6)', justifyContent: 'flex-end' },
  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
    alignItems: 'center',
  },
  countdownCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdown: { ...typography.title, color: colors.textOnPrimary },
  title: { ...typography.subtitle, color: colors.text, textAlign: 'center' },
  details: { gap: spacing.xs, alignSelf: 'stretch' },
  detailText: { ...typography.body, color: colors.textSecondary },
  priceText: { ...typography.price, color: colors.primary, marginTop: spacing.xs },
  buttonRow: { flexDirection: 'row', gap: spacing.md, alignSelf: 'stretch' },
  button: { flex: 1, minHeight: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  rejectButton: { backgroundColor: colors.danger },
  acceptButton: { backgroundColor: colors.secondary },
  buttonText: { ...typography.button, color: colors.textOnPrimary },
});
