import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { getRideHistory, type HistoryRide } from '../services/ride';

const STATUS_LABELS: Record<HistoryRide['status'], string> = {
  REQUESTED: 'En attente',
  SEARCHING: 'En attente',
  ACCEPTED: 'Acceptée',
  DRIVER_ARRIVING: 'Conducteur arrivé',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};

function formatDate(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function RideHistoryList() {
  const role = useAuthStore((state) => state.user?.role);
  const isDriver = role === 'DRIVER';

  const [rides, setRides] = useState<HistoryRide[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalRevenue, setTotalRevenue] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (targetPage: number) => {
    setLoading(true);
    try {
      const data = await getRideHistory(targetPage);
      setRides(data.rides);
      setTotal(data.total);
      setPageSize(data.pageSize);
      setTotalRevenue(data.totalRevenue);
      setPage(targetPage);
    } catch {
      Alert.alert('Erreur', "Impossible de charger l'historique.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <View style={styles.container}>
      {isDriver && totalRevenue !== undefined && (
        <View style={styles.revenueBox}>
          <Text style={styles.revenueLabel}>Revenus totaux</Text>
          <Text style={styles.revenueValue}>{totalRevenue} FCFA</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" style={styles.spinner} />
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucune course dans l'historique.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardDate}>{formatDate(item.requestedAt)}</Text>
                <Text style={[styles.cardStatus, item.status === 'CANCELLED' && styles.cardStatusCancelled]}>
                  {STATUS_LABELS[item.status]}
                </Text>
              </View>
              {isDriver && item.passenger && (
                <Text style={styles.cardLine}>Passager : {item.passenger.firstName} {item.passenger.lastName}</Text>
              )}
              {!isDriver && item.driver && (
                <Text style={styles.cardLine}>Conducteur : {item.driver.firstName} {item.driver.lastName}</Text>
              )}
              {item.destinationAddress && <Text style={styles.cardLine}>Destination : {item.destinationAddress}</Text>}
              <Text style={styles.cardPrice}>
                {item.status === 'COMPLETED' && item.finalPrice !== null ? `${item.finalPrice} FCFA` : `${item.estimatedPrice} FCFA (estimé)`}
              </Text>
            </View>
          )}
        />
      )}

      {totalPages > 1 && (
        <View style={styles.pagination}>
          <Pressable disabled={page <= 1} onPress={() => load(page - 1)} style={[styles.pageButton, page <= 1 && styles.pageButtonDisabled]}>
            <Text style={styles.pageButtonText}>Précédent</Text>
          </Pressable>
          <Text style={styles.pageInfo}>{page} / {totalPages}</Text>
          <Pressable disabled={page >= totalPages} onPress={() => load(page + 1)} style={[styles.pageButton, page >= totalPages && styles.pageButtonDisabled]}>
            <Text style={styles.pageButtonText}>Suivant</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  spinner: { marginTop: 32 },
  revenueBox: { margin: 16, marginBottom: 0, backgroundColor: '#e8f5e9', borderRadius: 12, padding: 16, alignItems: 'center' },
  revenueLabel: { fontSize: 13, color: '#2e7d32', fontWeight: '600' },
  revenueValue: { fontSize: 24, fontWeight: '700', color: '#2e7d32', marginTop: 4 },
  list: { padding: 16, gap: 12 },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 32 },
  card: { backgroundColor: '#f5f5f5', borderRadius: 12, padding: 16, gap: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardDate: { fontSize: 12, color: '#888' },
  cardStatus: { fontSize: 12, fontWeight: '600', color: '#2e7d32' },
  cardStatusCancelled: { color: '#d32f2f' },
  cardLine: { fontSize: 14, color: '#333' },
  cardPrice: { fontSize: 16, fontWeight: '700', color: '#1a73e8', marginTop: 4 },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 16 },
  pageButton: { backgroundColor: '#1a73e8', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
  pageButtonDisabled: { backgroundColor: '#ccc' },
  pageButtonText: { color: '#fff', fontWeight: '600' },
  pageInfo: { fontSize: 14, color: '#555' },
});
