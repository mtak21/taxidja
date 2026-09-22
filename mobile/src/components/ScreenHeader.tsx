import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLogout } from '../hooks/useLogout';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface ScreenHeaderProps {
  title: string;
  /** Shows a profile icon (left of "Déconnexion") when provided — only the two home screens need it. */
  onProfilePress?: () => void;
}

export function ScreenHeader({ title, onProfilePress }: ScreenHeaderProps) {
  const handleLogout = useLogout();

  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.actions}>
        {onProfilePress && (
          <Pressable hitSlop={8} onPress={onProfilePress}>
            <MaterialCommunityIcons name="account-circle-outline" size={26} color={colors.text} />
          </Pressable>
        )}
        <Pressable hitSlop={8} onPress={handleLogout}>
          <Text style={styles.logoutText}>Déconnexion</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: 56,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { ...typography.subtitle, color: colors.text },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  logoutText: { ...typography.smallMedium, color: colors.danger },
});
