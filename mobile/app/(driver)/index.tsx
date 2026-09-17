import { useState } from 'react';
import { View, Text, Switch, StyleSheet, Alert } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { AppMap } from '../../src/components/AppMap';
import { useLocation } from '../../src/hooks/useLocation';
import { useDriverLocationTracking } from '../../src/hooks/useDriverLocationTracking';
import { updateDriverStatus } from '../../src/services/driver';

export default function DriverHome() {
  const user = useAuthStore((state) => state.user);
  const { coordinates, loading, errorMessage } = useLocation();
  const [isOnline, setIsOnline] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useDriverLocationTracking(isOnline, (message) => Alert.alert('Suivi de position', message));

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

  return (
    <View style={styles.container}>
      <ScreenHeader title={`Bonjour ${user?.firstName ?? ''}`} />

      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>{isOnline ? 'En ligne' : 'Hors ligne'}</Text>
        <Switch value={isOnline} onValueChange={handleToggle} disabled={isUpdatingStatus} />
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
        <Text style={styles.requestsPlaceholderText}>Aucune demande pour le moment</Text>
      </View>
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
});
