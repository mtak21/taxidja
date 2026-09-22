import { useEffect, useState } from 'react';
import { View, Text, Switch, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { AxiosError } from 'axios';
import { useAuthStore } from '../../../src/store/authStore';
import { AppMap } from '../../../src/components/AppMap';
import { RideRequestModal } from '../../../src/components/RideRequestModal';
import { useLocation } from '../../../src/hooks/useLocation';
import { useDriverLocationTracking } from '../../../src/hooks/useDriverLocationTracking';
import { updateDriverStatus } from '../../../src/services/driver';
import { fetchMe } from '../../../src/services/auth';
import { connectSocket, disconnectSocket } from '../../../src/services/socket';
import type { RideRequestPayload } from '../../../src/services/ride';
import { Badge } from '../../../src/components/ui/Badge';
import { Card } from '../../../src/components/ui/Card';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { radius } from '../../../src/theme/radius';
import { typography } from '../../../src/theme/typography';

const VERIFICATION_MESSAGES: Record<'PENDING' | 'SUSPENDED', string> = {
  PENDING: "Ton compte est en cours de vérification. Tu seras notifié une fois validé — tu ne peux pas encore passer en ligne.",
  SUSPENDED: 'Ton compte a été suspendu. Contacte le support TaxiDja pour plus d\'informations.',
};

export default function DriverHome() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const { coordinates, loading, errorMessage } = useLocation();
  const [isOnline, setIsOnline] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<RideRequestPayload | null>(null);

  const verificationStatus = user?.driverVerificationStatus ?? null;
  const isVerified = verificationStatus === 'VERIFIED';

  // Refreshes the driver's verification status on every visit to this
  // screen — this is how an admin's validation reaches the app: no push,
  // just picked up the next time the driver opens/foregrounds it.
  useEffect(() => {
    fetchMe()
      .then(setUser)
      .catch(() => {
        // Non-fatal: the screen still works with the status from login/register.
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useDriverLocationTracking(isOnline, (message) => Alert.alert('Suivi de position', message));

  useEffect(() => {
    if (!isOnline) {
      setPendingRequest(null);
      return;
    }

    const socket = connectSocket();
    const handleRequested = (payload: RideRequestPayload) => setPendingRequest(payload);
    socket.on('ride:requested', handleRequested);

    return () => {
      socket.off('ride:requested', handleRequested);
      disconnectSocket();
    };
  }, [isOnline]);

  const handleToggle = async (value: boolean) => {
    setIsUpdatingStatus(true);
    try {
      await updateDriverStatus(value);
      setIsOnline(value);
    } catch (error) {
      const message =
        error instanceof AxiosError && error.response?.status === 403
          ? "Ton compte n'est pas encore vérifié — impossible de passer en ligne."
          : 'Impossible de mettre à jour ton statut. Réessaie.';
      Alert.alert('Erreur', message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAccept = () => {
    if (!pendingRequest) return;
    connectSocket().emit('ride:accepted', { rideId: pendingRequest.rideId });
    const rideId = pendingRequest.rideId;
    setPendingRequest(null);
    router.push(`/(driver)/ride/${rideId}`);
  };

  const handleReject = () => {
    if (!pendingRequest) return;
    connectSocket().emit('ride:rejected', { rideId: pendingRequest.rideId });
    setPendingRequest(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View style={styles.statusLeft}>
          <Text style={styles.statusLabel}>{isOnline ? 'En ligne' : 'Hors ligne'}</Text>
          <Badge label={isOnline ? 'Disponible' : 'Indisponible'} tone={isOnline ? 'positive' : 'neutral'} />
        </View>
        <Switch
          value={isOnline}
          onValueChange={handleToggle}
          disabled={isUpdatingStatus || !isVerified}
          trackColor={{ true: colors.secondary, false: colors.border }}
          thumbColor={colors.surface}
        />
      </View>

      {!isVerified && (verificationStatus === 'PENDING' || verificationStatus === 'SUSPENDED') && (
        <View style={styles.verificationBannerWrap}>
          <Card style={styles.verificationBanner}>
            <Badge
              label={verificationStatus === 'PENDING' ? 'Vérification en cours' : 'Compte suspendu'}
              tone={verificationStatus === 'PENDING' ? 'warning' : 'negative'}
            />
            <Text style={styles.verificationText}>{VERIFICATION_MESSAGES[verificationStatus]}</Text>
          </Card>
        </View>
      )}

      <View style={styles.mapArea}>
        <AppMap
          coordinates={coordinates}
          loading={loading}
          errorMessage={errorMessage}
          markerTitle="Ma position"
        />
      </View>

      <View style={styles.requestsPlaceholder}>
        <Text style={styles.requestsPlaceholderText}>
          {isOnline ? 'En attente de demandes...' : 'Aucune demande pour le moment'}
        </Text>
      </View>

      <RideRequestModal request={pendingRequest} onAccept={handleAccept} onReject={handleReject} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 56, backgroundColor: colors.background },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  verificationBannerWrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  verificationBanner: { gap: spacing.sm },
  verificationText: { ...typography.small, color: colors.textSecondary },
  mapArea: { flex: 2 },
  requestsPlaceholder: {
    flex: 1,
    margin: spacing.lg,
    marginTop: 0,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabel: { ...typography.bodyMedium, color: colors.text },
  requestsPlaceholderText: { ...typography.body, color: colors.textSecondary },
});
