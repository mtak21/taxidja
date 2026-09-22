import { Pressable, Text, StyleSheet, Alert, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';
import { typography } from '../theme/typography';

interface CallButtonProps {
  /** No button renders if this is absent — e.g. the API didn't expose a phone for this viewer. */
  phone?: string | null;
  label: string;
}

/** Opens the native phone dialer pre-filled with the other party's number — no in-app telephony. */
export function CallButton({ phone, label }: CallButtonProps) {
  if (!phone) return null;

  const handlePress = () => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Erreur', "Impossible d'ouvrir l'application téléphone.");
    });
  };

  return (
    <Pressable style={styles.button} onPress={handlePress}>
      <MaterialCommunityIcons name="phone" size={18} color={colors.textOnPrimary} />
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.secondary,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignSelf: 'center',
    minHeight: 40,
  },
  text: { ...typography.smallMedium, color: colors.textOnPrimary },
});
