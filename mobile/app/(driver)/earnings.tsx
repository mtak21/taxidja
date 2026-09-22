import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { getEarnings, type EarningsResponse, type EarningsRide } from '../../src/services/driver';
import { Card } from '../../src/components/ui/Card';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { radius } from '../../src/theme/radius';
import { typography } from '../../src/theme/typography';

function formatDate(iso: string) {
  const date = new Date(iso);
  return (
    date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' +
    date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  );
}

export default function DriverEarningsScreen() {
  const [data, setData] = useState<EarningsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (targetPage: number) => {
    setLoading(true);
    try {
      const result = await getEarnings(targetPage);
      setData(result);
      setPage(targetPage);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger les revenus.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  const renderItem = ({ item }: { item: EarningsRide }) => (
    <Card style={styles.rideCard}>
      <View style={styles.rideCardHeader}>
        <Text style={styles.rideCardDate}>{formatDate(item.completedAt ?? item.requestedAt)}</Text>
        <Text style={styles.rideCardPrice}>{item.finalPrice ?? 0} FCFA</Text>
      </View>
      <Text style={styles.rideCardLine}>
        Passager : {item.passenger.firstName} {item.passenger.lastName}
      </Text>
      {item.destinationAddress && <Text style={styles.rideCardLine}>Destination : {item.destinationAddress}</Text>}
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backText}>← Retour</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Mes revenus</Text>
      </View>

      {loading && !data ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
      ) : (
        <FlatList
          data={data?.rides ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            data ? (
              <View style={styles.statsGrid}>
                <Card style={styles.statCard}>
                  <Text style={styles.statLabel}>Aujourd'hui</Text>
                  <Text style={styles.statValue}>{data.totals.today} FCFA</Text>
                </Card>
                <Card style={styles.statCard}>
                  <Text style={styles.statLabel}>Cette semaine</Text>
                  <Text style={styles.statValue}>{data.totals.week} FCFA</Text>
                </Card>
                <Card style={styles.statCard}>
                  <Text style={styles.statLabel}>Ce mois-ci</Text>
                  <Text style={styles.statValue}>{data.totals.month} FCFA</Text>
                </Card>
                <Card style={[styles.statCard, styles.statCardTotal]}>
                  <Text style={styles.statLabelTotal}>Total</Text>
                  <Text style={styles.statValueTotal}>{data.totals.allTime} FCFA</Text>
                </Card>
              </View>
            ) : null
          }
          ListEmptyComponent={<Text style={styles.emptyText}>Aucune course terminée pour le moment.</Text>}
          renderItem={renderItem}
        />
      )}

      {data && totalPages > 1 && (
        <View style={styles.pagination}>
          <Pressable
            disabled={page <= 1}
            onPress={() => load(page - 1)}
            style={[styles.pageButton, page <= 1 && styles.pageButtonDisabled]}
          >
            <Text style={styles.pageButtonText}>Précédent</Text>
          </Pressable>
          <Text style={styles.pageInfo}>
            {page} / {totalPages}
          </Text>
          <Pressable
            disabled={page >= totalPages}
            onPress={() => load(page + 1)}
            style={[styles.pageButton, page >= totalPages && styles.pageButtonDisabled]}
          >
            <Text style={styles.pageButtonText}>Suivant</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    paddingTop: 56,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backText: { ...typography.smallMedium, color: colors.primary },
  headerTitle: { ...typography.subtitle, color: colors.text },
  spinner: { marginTop: spacing.xxl },
  list: { padding: spacing.lg, gap: spacing.md },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.md },
  statCard: { width: '47%', gap: spacing.xs },
  statCardTotal: { backgroundColor: colors.primaryLight },
  statLabel: { ...typography.smallMedium, color: colors.textSecondary },
  statValue: { ...typography.subtitle, color: colors.text },
  statLabelTotal: { ...typography.smallMedium, color: colors.primaryDark },
  statValueTotal: { ...typography.subtitle, color: colors.primaryDark },
  emptyText: { ...typography.body, textAlign: 'center', color: colors.textSecondary, marginTop: spacing.xxl },
  rideCard: { gap: spacing.xs },
  rideCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  rideCardDate: { ...typography.small, color: colors.textSecondary },
  rideCardPrice: { ...typography.subtitle, color: colors.primary },
  rideCardLine: { ...typography.body, color: colors.text },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.lg },
  pageButton: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  pageButtonDisabled: { backgroundColor: colors.disabled },
  pageButtonText: { ...typography.smallMedium, color: colors.textOnPrimary },
  pageInfo: { ...typography.body, color: colors.textSecondary },
});
