import { useEffect, useState } from 'react';
import { View, Text, Switch, Pressable, StyleSheet, Alert } from 'react-native';
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
        <Text style={styles.statusLabel}>{isOnline ? 'En ligne' : 'Hors ligne'}</Text>
        <Switch value={isOnline} onValueChange={handleToggle} disabled={isUpdatingStatus} />
      </View>

      <Pressable style={styles.historyButton} onPress={() => router.push('/(driver)/history')}>
        <Text style={styles.historyButtonText}>Mes courses</Text>
      </Pressable>

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
  container: { flex: 1 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  mapArea: { flex: 2 },
  requestsPlaceholder: {
    flex: 1,
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabel: { fontSize: 16, fontWeight: '600' },
  requestsPlaceholderText: { color: '#666', fontSize: 16 },
  historyButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1a73e8',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  historyButtonText: { color: '#1a73e8', fontWeight: '600', fontSize: 14 },
});
