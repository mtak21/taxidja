import { useState } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';
import { ScreenHeader } from '../../src/components/ScreenHeader';

export default function DriverHome() {
  const user = useAuthStore((state) => state.user);
  const [isOnline, setIsOnline] = useState(false);

  return (
    <View style={styles.container}>
      <ScreenHeader title={`Bonjour ${user?.firstName ?? ''}`} />

      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>{isOnline ? 'En ligne' : 'Hors ligne'}</Text>
        <Switch value={isOnline} onValueChange={setIsOnline} />
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
  statusLabel: { fontSize: 16, fontWeight: '600' },
  requestsPlaceholder: {
    flex: 1,
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestsPlaceholderText: { color: '#666', fontSize: 16 },
});
