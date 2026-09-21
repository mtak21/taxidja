import { View, StyleSheet, type ViewProps } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';

interface CardProps extends ViewProps {
  padded?: boolean;
}

export function Card({ style, padded = true, ...viewProps }: CardProps) {
  return <View {...viewProps} style={[styles.card, padded && styles.padded, style]} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  padded: { padding: spacing.lg },
});
