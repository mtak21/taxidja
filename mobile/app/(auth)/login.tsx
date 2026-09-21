import { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AxiosError } from 'axios';
import { loginRequest } from '../../src/services/auth';
import { useAuthStore } from '../../src/store/authStore';
import { homeRouteForRole } from '../../src/utils/roleRoutes';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';

const loginSchema = z.object({
  phone: z.string().trim().min(8, 'Numéro de téléphone invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const setSession = useAuthStore((state) => state.setSession);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '', password: '' },
  });

  const onSubmit = async (values: LoginForm) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const { user, accessToken, refreshToken } = await loginRequest(values);
      await setSession(user, accessToken, refreshToken);
      router.replace(homeRouteForRole(user.role));
    } catch (error) {
      const message =
        error instanceof AxiosError ? error.response?.data?.error : undefined;
      setServerError(message ?? 'Connexion impossible. Réessayez.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.brandBlock}>
        <View style={styles.logoCircle}>
          <Image source={require('../../assets/splash-icon.png')} style={styles.logoImage} resizeMode="contain" />
        </View>
        <Text style={styles.brand}>TaxiDja</Text>
      </View>

      <Text style={styles.title}>Connexion</Text>

      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            placeholder="Téléphone"
            keyboardType="phone-pad"
            autoCapitalize="none"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.phone && <Text style={styles.error}>{errors.phone.message}</Text>}

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            placeholder="Mot de passe"
            secureTextEntry
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}

      {serverError && <Text style={styles.error}>{serverError}</Text>}

      <Button
        title={isSubmitting ? 'Connexion...' : 'Se connecter'}
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
        loading={isSubmitting}
      />

      <Link href="/(auth)/register" style={styles.link}>
        Pas de compte ? S'inscrire
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.md, backgroundColor: colors.background },
  brandBlock: { alignItems: 'center', marginBottom: spacing.lg, gap: spacing.sm },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: { width: 36, height: 36 },
  brand: { ...typography.brand, color: colors.dark },
  title: { ...typography.title, color: colors.text, marginBottom: spacing.sm, textAlign: 'center' },
  error: { ...typography.small, color: colors.danger },
  link: { textAlign: 'center', marginTop: spacing.lg, color: colors.primary, ...typography.smallMedium },
});
