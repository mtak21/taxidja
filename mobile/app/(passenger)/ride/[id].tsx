import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  getRide,
  cancelRide,
  rateRide,
  type Ride,
  type DriverAssignedPayload,
  type RideLifecyclePayload,
  type RideCompletedPayload,
  type DriverPositionUpdatePayload,
} from '../../../src/services/ride';
import type { Coordinates } from '../../../src/hooks/useLocation';
import { connectSocket, disconnectSocket } from '../../../src/services/socket';
import { StarRating } from '../../../src/components/StarRating';
import { RideTrackingMap } from '../../../src/components/RideTrackingMap';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { Input } from '../../../src/components/ui/Input';
import { RideStatusBadge } from '../../../src/components/ui/Badge';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { typography } from '../../../src/theme/typography';

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
// A driver marker is only meaningful once a driver is assigned and en route/on trip.
const TRACKABLE_STATUSES: Ride['status'][] = ['ACCEPTED', 'DRIVER_ARRIVING', 'IN_PROGRESS'];

export default function RideStatusScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  const [noDriverMessage, setNoDriverMessage] = useState(false);
  const [driverPosition, setDriverPosition] = useState<Coordinates | null>(null);
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  const loadRide = useCallback(async () => {
    try {
      const data = await getRide(id);
      setRide(data);
      if (data.driver?.currentLatitude != null && data.driver?.currentLongitude != null) {
        setDriverPosition({ latitude: data.driver.currentLatitude, longitude: data.driver.currentLongitude });
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de charger la course.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadRide();
  }, [loadRide]);

  // Listen for realtime dispatch, trip-lifecycle, and live-position events — no polling.
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

    const handlePositionUpdate = (payload: DriverPositionUpdatePayload) => {
      if (payload.rideId !== id) return;
      setDriverPosition({ latitude: payload.latitude, longitude: payload.longitude });
    };

    socket.on('ride:driver_assigned', handleAssigned);
    socket.on('ride:no_driver_available', handleNoDriver);
    socket.on('ride:arriving', handleArriving);
    socket.on('ride:started', handleStarted);
    socket.on('ride:completed', handleCompleted);
    socket.on('driver:position_update', handlePositionUpdate);

    return () => {
      socket.off('ride:driver_assigned', handleAssigned);
      socket.off('ride:no_driver_available', handleNoDriver);
      socket.off('ride:arriving', handleArriving);
      socket.off('ride:started', handleStarted);
      socket.off('ride:completed', handleCompleted);
      socket.off('driver:position_update', handlePositionUpdate);
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

  const handleSubmitRating = async () => {
    if (ratingScore < 1) {
      Alert.alert('Note requise', 'Choisis une note de 1 à 5 étoiles.');
      return;
    }
    setIsSubmittingRating(true);
    try {
      await rateRide(id, ratingScore, ratingComment.trim() || undefined);
      setHasRated(true);
    } catch (error: any) {
      if (error?.response?.status === 409) {
        // Already rated (e.g. resumed after an earlier successful submit) — treat as done.
        setHasRated(true);
      } else {
        Alert.alert('Erreur', "Impossible d'envoyer la notation. Réessaie.");
      }
    } finally {
      setIsSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={styles.center}>
        <Text style={typography.body}>Course introuvable.</Text>
      </View>
    );
  }

  const canCancel = CANCELLABLE_STATUSES.includes(ride.status);
  const isCompleted = ride.status === 'COMPLETED';
  const showTrackingMarker = TRACKABLE_STATUSES.includes(ride.status);

  return (
    <View style={styles.container}>
      <View style={styles.mapArea}>
        <RideTrackingMap
          pickup={{ latitude: ride.pickupLatitude, longitude: ride.pickupLongitude }}
          destination={{ latitude: ride.destinationLatitude, longitude: ride.destinationLongitude }}
          route={ride.routeGeometry}
          driverPosition={showTrackingMarker ? driverPosition : null}
        />
      </View>

      <ScrollView contentContainerStyle={styles.infoArea}>
        <View style={styles.statusBox}>
          {SEARCHING_STATUSES.includes(ride.status) && (
            <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
          )}
          <RideStatusBadge status={ride.status} />
          <Text style={styles.statusText}>{STATUS_LABELS[ride.status]}</Text>
          {ride.status === 'CANCELLED' && noDriverMessage && (
            <Text style={styles.noDriverText}>Aucun conducteur disponible pour le moment. Réessaie dans quelques minutes.</Text>
          )}
        </View>

        {ride.driver && (
          <Card style={styles.driverBox}>
            <Text style={styles.driverName}>
              {ride.driver.firstName} {ride.driver.lastName}
            </Text>
            <Text style={styles.detailText}>Note : {ride.driver.rating.toFixed(1)} / 5</Text>
            {etaMinutes !== null && !isCompleted && (
              <Text style={styles.detailText}>Arrivée estimée : {etaMinutes} min</Text>
            )}
          </Card>
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
          <Button
            title={isCancelling ? 'Annulation...' : 'Annuler la course'}
            variant="danger"
            onPress={handleCancel}
            disabled={isCancelling}
            loading={isCancelling}
          />
        )}

        {isCompleted && !hasRated && (
          <Card style={styles.ratingBox}>
            <Text style={styles.ratingTitle}>Note ton conducteur</Text>
            <View style={styles.starsWrap}>
              <StarRating value={ratingScore} onChange={setRatingScore} disabled={isSubmittingRating} />
            </View>
            <Input
              placeholder="Commentaire (optionnel)"
              value={ratingComment}
              onChangeText={setRatingComment}
              editable={!isSubmittingRating}
              multiline
              style={styles.commentInput}
            />
            <Button
              title={isSubmittingRating ? 'Envoi...' : 'Envoyer la note'}
              onPress={handleSubmitRating}
              disabled={isSubmittingRating}
              loading={isSubmittingRating}
            />
            <Button title="Passer" variant="secondary" onPress={() => setHasRated(true)} disabled={isSubmittingRating} />
          </Card>
        )}

        {!canCancel && (!isCompleted || hasRated) && (
          <Button title="Retour à l'accueil" onPress={() => router.replace('/(passenger)')} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  mapArea: { flex: 1, margin: spacing.lg, marginBottom: 0 },
  infoArea: { padding: spacing.xl, gap: spacing.xl },
  statusBox: { alignItems: 'center', gap: spacing.md },
  spinner: { marginBottom: spacing.xs },
  statusText: { ...typography.subtitle, color: colors.text, textAlign: 'center' },
  noDriverText: { ...typography.small, color: colors.danger, textAlign: 'center' },
  driverBox: { alignItems: 'center', gap: spacing.xs },
  driverName: { ...typography.bodyMedium, color: colors.text },
  details: { gap: spacing.sm, alignItems: 'center' },
  detailText: { ...typography.body, color: colors.textSecondary },
  priceText: { ...typography.price, color: colors.primary, marginTop: spacing.xs },
  ratingBox: { gap: spacing.md },
  ratingTitle: { ...typography.bodyMedium, color: colors.text, textAlign: 'center' },
  starsWrap: { alignItems: 'center' },
  commentInput: { minHeight: 48 },
});
