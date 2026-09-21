import { Pressable, Text, StyleSheet, ActivityIndicator, type PressableProps } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';
import { typography } from '../../theme/typography';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({ title, variant = 'primary', loading, fullWidth = true, disabled, ...pressableProps }: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      {...pressableProps}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.fullWidth,
        variantStyles[variant].container,
        pressed && !isDisabled && variantStyles[variant].pressed,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? colors.primary : colors.textOnPrimary} />
      ) : (
        <Text style={[styles.text, variantStyles[variant].text]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  fullWidth: { width: '100%' },
  text: { ...typography.button },
  disabled: { opacity: 0.5 },
});

const variantStyles: Record<ButtonVariant, { container: object; pressed: object; text: object }> = {
  primary: {
    container: { backgroundColor: colors.primary },
    pressed: { backgroundColor: colors.primaryDark },
    text: { color: colors.textOnPrimary },
  },
  secondary: {
    container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
    pressed: { backgroundColor: colors.primaryLight },
    text: { color: colors.primary },
  },
  danger: {
    container: { backgroundColor: colors.danger },
    pressed: { backgroundColor: '#A5301F' },
    text: { color: colors.textOnPrimary },
  },
};
