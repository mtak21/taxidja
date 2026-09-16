import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AxiosError } from 'axios';
import { loginRequest } from '../../src/services/auth';
import { useAuthStore } from '../../src/store/authStore';

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
      router.replace('/(app)');
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
      <Text style={styles.title}>Connexion</Text>

      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
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
          <TextInput
            style={styles.input}
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

      <Pressable style={styles.button} onPress={handleSubmit(onSubmit)} disabled={isSubmitting}>
        <Text style={styles.buttonText}>{isSubmitting ? 'Connexion...' : 'Se connecter'}</Text>
      </Pressable>

      <Link href="/(auth)/register" style={styles.link}>
        Pas de compte ? S'inscrire
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  error: { color: '#d32f2f', fontSize: 13 },
  button: { backgroundColor: '#1a73e8', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
  link: { textAlign: 'center', marginTop: 16, color: '#1a73e8' },
});
