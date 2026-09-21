import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';
import { typography } from '../../theme/typography';

export type BadgeTone = 'neutral' | 'info' | 'positive' | 'negative' | 'warning';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const toneStyle = toneStyles[tone];
  return (
    <View style={[styles.badge, { backgroundColor: toneStyle.background }]}>
      <Text style={[styles.text, { color: toneStyle.text }]}>{label}</Text>
    </View>
  );
}

const toneStyles: Record<BadgeTone, { background: string; text: string }> = {
  neutral: { background: colors.border, text: colors.textSecondary },
  info: { background: colors.primaryLight, text: colors.primaryDark },
  positive: { background: '#DCEADF', text: colors.secondaryDark },
  negative: { background: colors.dangerLight, text: colors.danger },
  warning: { background: colors.warningLight, text: colors.warning },
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  text: { ...typography.smallMedium },
});

// Ride status -> badge (tone, short label). Shared across the ride status
// screen and the history list so a given status always reads the same way.
export type RideStatus =
  | 'REQUESTED'
  | 'SEARCHING'
  | 'ACCEPTED'
  | 'DRIVER_ARRIVING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export const RIDE_STATUS_BADGE: Record<RideStatus, { label: string; tone: BadgeTone }> = {
  REQUESTED: { label: 'En attente', tone: 'neutral' },
  SEARCHING: { label: 'En attente', tone: 'neutral' },
  ACCEPTED: { label: 'Acceptée', tone: 'info' },
  DRIVER_ARRIVING: { label: 'Conducteur arrivé', tone: 'info' },
  IN_PROGRESS: { label: 'En cours', tone: 'warning' },
  COMPLETED: { label: 'Terminée', tone: 'positive' },
  CANCELLED: { label: 'Annulée', tone: 'negative' },
};

export function RideStatusBadge({ status }: { status: RideStatus }) {
  const { label, tone } = RIDE_STATUS_BADGE[status];
  return <Badge label={label} tone={tone} />;
}
