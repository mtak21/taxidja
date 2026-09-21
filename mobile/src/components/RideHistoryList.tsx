import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { getRideHistory, type HistoryRide } from '../services/ride';
import { Card } from './ui/Card';
import { RideStatusBadge } from './ui/Badge';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';
import { typography } from '../theme/typography';

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
        <Card style={styles.revenueBox}>
          <Text style={styles.revenueLabel}>Revenus totaux</Text>
          <Text style={styles.revenueValue}>{totalRevenue} FCFA</Text>
        </Card>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucune course dans l'historique.</Text>}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardDate}>{formatDate(item.requestedAt)}</Text>
                <RideStatusBadge status={item.status} />
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
            </Card>
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
  container: { flex: 1, backgroundColor: colors.background },
  spinner: { marginTop: spacing.xxl },
  revenueBox: { margin: spacing.lg, marginBottom: 0, alignItems: 'center', backgroundColor: '#EDF4EF' },
  revenueLabel: { ...typography.smallMedium, color: colors.secondaryDark },
  revenueValue: { ...typography.title, color: colors.secondaryDark, marginTop: spacing.xs },
  list: { padding: spacing.lg, gap: spacing.md },
  emptyText: { ...typography.body, textAlign: 'center', color: colors.textSecondary, marginTop: spacing.xxl },
  card: { gap: spacing.xs },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  cardDate: { ...typography.small, color: colors.textSecondary },
  cardLine: { ...typography.body, color: colors.text },
  cardPrice: { ...typography.subtitle, color: colors.primary, marginTop: spacing.xs },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.lg },
  pageButton: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  pageButtonDisabled: { backgroundColor: colors.disabled },
  pageButtonText: { ...typography.smallMedium, color: colors.textOnPrimary },
  pageInfo: { ...typography.body, color: colors.textSecondary },
});
