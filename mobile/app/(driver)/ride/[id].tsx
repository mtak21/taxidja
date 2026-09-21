import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  getRide,
  markArriving,
  startRide,
  completeRide,
  estimateRide,
  type Ride,
  type RoutePoint,
} from '../../../src/services/ride';
import { useLiveCoordinates } from '../../../src/hooks/useLiveCoordinates';
import { RideTrackingMap } from '../../../src/components/RideTrackingMap';
import { Button } from '../../../src/components/ui/Button';
import { RideStatusBadge } from '../../../src/components/ui/Badge';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { typography } from '../../../src/theme/typography';

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

// The map/GPS marker is only worth showing (and worth tracking locally)
// during these statuses — before ACCEPTED there's nothing to navigate to yet.
const TRACKING_STATUSES: Ride['status'][] = ['ACCEPTED', 'DRIVER_ARRIVING', 'IN_PROGRESS'];

export default function DriverRideScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [waypointRoute, setWaypointRoute] = useState<RoutePoint[] | null>(null);

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

  const isTracking = ride ? TRACKING_STATUSES.includes(ride.status) : false;
  const myPosition = useLiveCoordinates(isTracking);

  // Route to the next waypoint: the passenger's pickup point while
  // ACCEPTED/DRIVER_ARRIVING, then the final destination once IN_PROGRESS.
  // Recomputed on mount and whenever the phase changes — not on every GPS
  // tick, to stay well within the public OSRM demo server's fair-use limits
  // (see README.md). The live marker itself still moves on every tick.
  useEffect(() => {
    if (!ride || !myPosition || !isTracking) {
      setWaypointRoute(null);
      return;
    }

    const target =
      ride.status === 'IN_PROGRESS'
        ? { latitude: ride.destinationLatitude, longitude: ride.destinationLongitude }
        : { latitude: ride.pickupLatitude, longitude: ride.pickupLongitude };

    estimateRide(myPosition, target, ride.vehicleType)
      .then((estimateResult) => setWaypointRoute(estimateResult.routeGeometry))
      .catch(() => {
        // Non-fatal — the map still works without the route line.
      });
    // Only re-run on phase change, deliberately not on every myPosition tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ride?.status, isTracking]);

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

  const nextAction = NEXT_ACTION[ride.status];
  const isCompleted = ride.status === 'COMPLETED';

  return (
    <View style={styles.container}>
      {isTracking && (
        <View style={styles.mapArea}>
          <RideTrackingMap
            pickup={{ latitude: ride.pickupLatitude, longitude: ride.pickupLongitude }}
            destination={{ latitude: ride.destinationLatitude, longitude: ride.destinationLongitude }}
            route={waypointRoute}
            driverPosition={myPosition}
          />
        </View>
      )}

      <ScrollView contentContainerStyle={styles.infoArea}>
        <RideStatusBadge status={ride.status} />
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
          <Button
            title={isUpdating ? 'Mise à jour...' : nextAction.label}
            onPress={handleNextAction}
            disabled={isUpdating}
            loading={isUpdating}
          />
        )}

        {!nextAction && <Button title="Retour à l'accueil" onPress={() => router.replace('/(driver)')} />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  mapArea: { flex: 1, margin: spacing.lg, marginBottom: 0 },
  infoArea: { padding: spacing.xl, gap: spacing.lg, alignItems: 'center' },
  statusText: { ...typography.subtitle, color: colors.text, textAlign: 'center' },
  details: { gap: spacing.sm, alignItems: 'center' },
  detailText: { ...typography.body, color: colors.textSecondary },
  priceText: { ...typography.price, color: colors.primary, marginTop: spacing.xs },
});
