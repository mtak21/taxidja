import { useEffect, useState } from 'react';
import { View, Text, Switch, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { AppMap } from '../../src/components/AppMap';
import { RideRequestModal } from '../../src/components/RideRequestModal';
import { useLocation } from '../../src/hooks/useLocation';
import { useDriverLocationTracking } from '../../src/hooks/useDriverLocationTracking';
import { updateDriverStatus } from '../../src/services/driver';
import { connectSocket, disconnectSocket } from '../../src/services/socket';
import type { RideRequestPayload } from '../../src/services/ride';
import { Button } from '../../src/components/ui/Button';
import { Badge } from '../../src/components/ui/Badge';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { radius } from '../../src/theme/radius';
import { typography } from '../../src/theme/typography';

export default function DriverHome() {
  const user = useAuthStore((state) => state.user);
  const { coordinates, loading, errorMessage } = useLocation();
  const [isOnline, setIsOnline] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<RideRequestPayload | null>(null);

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
    } catch {
      Alert.alert('Erreur', "Impossible de mettre à jour ton statut. Réessaie.");
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
      <ScreenHeader title={`Bonjour ${user?.firstName ?? ''}`} />

      <View style={styles.statusRow}>
        <View style={styles.statusLeft}>
          <Text style={styles.statusLabel}>{isOnline ? 'En ligne' : 'Hors ligne'}</Text>
          <Badge label={isOnline ? 'Disponible' : 'Indisponible'} tone={isOnline ? 'positive' : 'neutral'} />
        </View>
        <Switch
          value={isOnline}
          onValueChange={handleToggle}
          disabled={isUpdatingStatus}
          trackColor={{ true: colors.secondary, false: colors.border }}
          thumbColor={colors.surface}
        />
      </View>

      <View style={styles.historyButtonWrap}>
        <Button title="Mes courses" variant="secondary" onPress={() => router.push('/(driver)/history')} />
      </View>

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
  container: { flex: 1, backgroundColor: colors.background },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
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
  historyButtonWrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
});
