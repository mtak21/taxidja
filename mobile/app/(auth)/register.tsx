import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AxiosError } from 'axios';
import { registerRequest } from '../../src/services/auth';
import { useAuthStore } from '../../src/store/authStore';

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
      router.replace('/(app)');
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
      <Text style={styles.title}>Inscription</Text>

      <Controller
        control={control}
        name="firstName"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput style={styles.input} placeholder="Prénom" onBlur={onBlur} onChangeText={onChange} value={value} />
        )}
      />
      {errors.firstName && <Text style={styles.error}>{errors.firstName.message}</Text>}

      <Controller
        control={control}
        name="lastName"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput style={styles.input} placeholder="Nom" onBlur={onBlur} onChangeText={onChange} value={value} />
        )}
      />
      {errors.lastName && <Text style={styles.error}>{errors.lastName.message}</Text>}

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
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
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
        <Text style={styles.buttonText}>{isSubmitting ? 'Inscription...' : "S'inscrire"}</Text>
      </Pressable>

      <Link href="/(auth)/login" style={styles.link}>
        Déjà un compte ? Se connecter
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  error: { color: '#d32f2f', fontSize: 13 },
  button: { backgroundColor: '#1a73e8', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
  link: { textAlign: 'center', marginTop: 16, color: '#1a73e8' },
});
