import { useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AxiosError } from 'axios';
import { registerRequest } from '../../src/services/auth';
import { useAuthStore } from '../../src/store/authStore';
import { homeRouteForRole } from '../../src/utils/roleRoutes';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';

const registerSchema = z.object({
  firstName: z.string().trim().min(1, 'Prénom requis'),
  lastName: z.string().trim().min(1, 'Nom requis'),
  phone: z.string().trim().min(8, 'Numéro de téléphone invalide'),
  email: z.union([z.literal(''), z.string().trim().email('Email invalide')]).optional(),
  password: z.string().min(8, '8 caractères minimum'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const setSession = useAuthStore((state) => state.setSession);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: '', lastName: '', phone: '', email: '', password: '' },
  });

  const onSubmit = async (values: RegisterForm) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const { user, accessToken, refreshToken } = await registerRequest({
        ...values,
        email: values.email || undefined,
      });
      await setSession(user, accessToken, refreshToken);
      router.replace(homeRouteForRole(user.role));
    } catch (error) {
      const message =
        error instanceof AxiosError ? error.response?.data?.error : undefined;
      setServerError(message ?? 'Inscription impossible. Réessayez.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.brandBlock}>
        <View style={styles.logoCircle}>
          <Image source={require('../../assets/splash-icon.png')} style={styles.logoImage} resizeMode="contain" />
        </View>
        <Text style={styles.brand}>TaxiDja</Text>
      </View>

      <Text style={styles.title}>Inscription</Text>

      <Controller
        control={control}
        name="firstName"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input placeholder="Prénom" onBlur={onBlur} onChangeText={onChange} value={value} />
        )}
      />
      {errors.firstName && <Text style={styles.error}>{errors.firstName.message}</Text>}

      <Controller
        control={control}
        name="lastName"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input placeholder="Nom" onBlur={onBlur} onChangeText={onChange} value={value} />
        )}
      />
      {errors.lastName && <Text style={styles.error}>{errors.lastName.message}</Text>}

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
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            placeholder="Email (optionnel)"
            autoCapitalize="none"
            keyboardType="email-address"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input placeholder="Mot de passe" secureTextEntry onBlur={onBlur} onChangeText={onChange} value={value} />
        )}
      />
      {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}

      {serverError && <Text style={styles.error}>{serverError}</Text>}

      <Button
        title={isSubmitting ? 'Inscription...' : "S'inscrire"}
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
        loading={isSubmitting}
      />

      <Link href="/(auth)/login" style={styles.link}>
        Déjà un compte ? Se connecter
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.md, backgroundColor: colors.background },
  brandBlock: { alignItems: 'center', marginBottom: spacing.md, gap: spacing.sm },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: { width: 32, height: 32 },
  brand: { ...typography.brand, color: colors.dark },
  title: { ...typography.title, color: colors.text, marginBottom: spacing.sm, textAlign: 'center' },
  error: { ...typography.small, color: colors.danger },
  link: { textAlign: 'center', marginTop: spacing.lg, color: colors.primary, ...typography.smallMedium },
});
