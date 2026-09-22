import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RideHistoryList } from '../../../src/components/RideHistoryList';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { radius } from '../../../src/theme/radius';
import { typography } from '../../../src/theme/typography';

export default function DriverHistoryScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes courses</Text>
        <Pressable style={styles.earningsLink} onPress={() => router.push('/(driver)/earnings')}>
          <MaterialCommunityIcons name="cash-multiple" size={20} color={colors.primary} />
          <Text style={styles.earningsLinkText}>Mes revenus</Text>
        </Pressable>
      </View>
      <RideHistoryList />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: 56,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { ...typography.subtitle, color: colors.text },
  earningsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  earningsLinkText: { ...typography.small, color: colors.primary, fontWeight: '600' },
});
