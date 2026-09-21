import { useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AxiosError } from 'axios';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { registerRequest } from '../../src/services/auth';
import { useAuthStore } from '../../src/store/authStore';
import { homeRouteForRole } from '../../src/utils/roleRoutes';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { VehicleIcon, type VehicleKind } from '../../src/components/ui/VehicleIcon';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { radius } from '../../src/theme/radius';
import { typography } from '../../src/theme/typography';

type Role = 'PASSENGER' | 'DRIVER';

const VEHICLE_OPTIONS: { type: VehicleKind; label: string }[] = [
  { type: 'MOTO', label: 'Moto' },
  { type: 'RAKCHA', label: 'Rakcha' },
  { type: 'CAR', label: 'Voiture' },
];

// AAAA-MM-JJ text input rather than a native date picker: avoids pulling in
// a new native dependency (a new EAS build/prebuild cycle) for a single
// field — acceptable trade-off for this MVP.
const dateFieldSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format attendu : AAAA-MM-JJ')
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Date invalide')
  .refine((value) => new Date(value).getTime() > Date.now(), 'La date doit être dans le futur');

const commonFields = {
  firstName: z.string().trim().min(1, 'Prénom requis'),
  lastName: z.string().trim().min(1, 'Nom requis'),
  phone: z.string().trim().min(8, 'Numéro de téléphone invalide'),
  email: z.union([z.literal(''), z.string().trim().email('Email invalide')]).optional(),
  password: z.string().min(8, '8 caractères minimum'),
};

const passengerSchema = z.object(commonFields);
type PassengerForm = z.infer<typeof passengerSchema>;

const driverSchema = z.object({
  ...commonFields,
  vehicleType: z.enum(['MOTO', 'RAKCHA', 'CAR']),
  vehicleBrand: z.string().trim().min(1, 'Marque requise'),
  vehicleModel: z.string().trim().min(1, 'Modèle requis'),
  vehiclePlate: z.string().trim().min(1, 'Plaque requise'),
  vehicleColor: z.string().trim().min(1, 'Couleur requise'),
  licenseNumber: z.string().trim().min(1, 'Numéro de permis requis'),
  licenseExpiry: dateFieldSchema,
});
type DriverForm = z.infer<typeof driverSchema>;

function Brand() {
  return (
    <View style={styles.brandBlock}>
      <View style={styles.logoCircle}>
        <Image source={require('../../assets/splash-icon.png')} style={styles.logoImage} resizeMode="contain" />
      </View>
      <Text style={styles.brand}>TaxiDja</Text>
    </View>
  );
}

function RoleChoice({ onSelect }: { onSelect: (role: Role) => void }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Brand />
      <Text style={styles.title}>Inscription</Text>
      <Text style={styles.subtitle}>Comment veux-tu utiliser TaxiDja ?</Text>

      <Pressable style={styles.roleCard} onPress={() => onSelect('PASSENGER')}>
        <MaterialCommunityIcons name="account" size={36} color={colors.primary} />
        <View style={styles.roleCardText}>
          <Text style={styles.roleCardTitle}>Je suis passager</Text>
          <Text style={styles.roleCardSubtitle}>Réserve des courses en quelques taps</Text>
        </View>
      </Pressable>

      <Pressable style={styles.roleCard} onPress={() => onSelect('DRIVER')}>
        <MaterialCommunityIcons name="steering" size={36} color={colors.primary} />
        <View style={styles.roleCardText}>
          <Text style={styles.roleCardTitle}>Je suis conducteur</Text>
          <Text style={styles.roleCardSubtitle}>Inscris ton véhicule et reçois des courses</Text>
        </View>
      </Pressable>

      <Link href="/(auth)/login" style={styles.link}>
        Déjà un compte ? Se connecter
      </Link>
    </ScrollView>
  );
}

function PassengerRegisterForm({ onBack }: { onBack: () => void }) {
  const setSession = useAuthStore((state) => state.setSession);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PassengerForm>({
    resolver: zodResolver(passengerSchema),
    defaultValues: { firstName: '', lastName: '', phone: '', email: '', password: '' },
  });

  const onSubmit = async (values: PassengerForm) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const { user, accessToken, refreshToken } = await registerRequest({
        role: 'PASSENGER',
        ...values,
        email: values.email || undefined,
      });
      await setSession(user, accessToken, refreshToken);
      router.replace(homeRouteForRole(user.role));
    } catch (error) {
      const message = error instanceof AxiosError ? error.response?.data?.error : undefined;
      setServerError(message ?? 'Inscription impossible. Réessayez.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Brand />
      <Pressable onPress={onBack}>
        <Text style={styles.backLink}>← Changer de rôle</Text>
      </Pressable>
      <Text style={styles.title}>Inscription passager</Text>

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
          <Input placeholder="Téléphone" keyboardType="phone-pad" autoCapitalize="none" onBlur={onBlur} onChangeText={onChange} value={value} />
        )}
      />
      {errors.phone && <Text style={styles.error}>{errors.phone.message}</Text>}

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input placeholder="Email (optionnel)" autoCapitalize="none" keyboardType="email-address" onBlur={onBlur} onChangeText={onChange} value={value} />
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

      <Button title={isSubmitting ? 'Inscription...' : "S'inscrire"} onPress={handleSubmit(onSubmit)} disabled={isSubmitting} loading={isSubmitting} />

      <Link href="/(auth)/login" style={styles.link}>
        Déjà un compte ? Se connecter
      </Link>
    </ScrollView>
  );
}

function DriverRegisterForm({ onBack }: { onBack: () => void }) {
  const setSession = useAuthStore((state) => state.setSession);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DriverForm>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      password: '',
      vehicleType: 'MOTO',
      vehicleBrand: '',
      vehicleModel: '',
      vehiclePlate: '',
      vehicleColor: '',
      licenseNumber: '',
      licenseExpiry: '',
    },
  });

  const vehicleType = watch('vehicleType');

  const onSubmit = async (values: DriverForm) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const { user, accessToken, refreshToken } = await registerRequest({
        role: 'DRIVER',
        ...values,
        email: values.email || undefined,
      });
      await setSession(user, accessToken, refreshToken);
      // Same route as a passenger — the driver home screen itself renders
      // the "pending verification" state (banner, toggle disabled) based on
      // user.driverVerificationStatus, rather than a separate gate screen.
      router.replace(homeRouteForRole(user.role));
    } catch (error) {
      const message = error instanceof AxiosError ? error.response?.data?.error : undefined;
      setServerError(message ?? 'Inscription impossible. Réessayez.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Brand />
      <Pressable onPress={onBack}>
        <Text style={styles.backLink}>← Changer de rôle</Text>
      </Pressable>
      <Text style={styles.title}>Inscription conducteur</Text>

      <Text style={styles.sectionLabel}>Informations personnelles</Text>

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
          <Input placeholder="Téléphone" keyboardType="phone-pad" autoCapitalize="none" onBlur={onBlur} onChangeText={onChange} value={value} />
        )}
      />
      {errors.phone && <Text style={styles.error}>{errors.phone.message}</Text>}

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input placeholder="Email (optionnel)" autoCapitalize="none" keyboardType="email-address" onBlur={onBlur} onChangeText={onChange} value={value} />
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

      <Text style={styles.sectionLabel}>Permis de conduire</Text>

      <Controller
        control={control}
        name="licenseNumber"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input placeholder="Numéro de permis" onBlur={onBlur} onChangeText={onChange} value={value} />
        )}
      />
      {errors.licenseNumber && <Text style={styles.error}>{errors.licenseNumber.message}</Text>}

      <Controller
        control={control}
        name="licenseExpiry"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input placeholder="Date d'expiration (AAAA-MM-JJ)" autoCapitalize="none" onBlur={onBlur} onChangeText={onChange} value={value} />
        )}
      />
      {errors.licenseExpiry && <Text style={styles.error}>{errors.licenseExpiry.message}</Text>}

      <Text style={styles.sectionLabel}>Véhicule</Text>

      <View style={styles.vehicleRow}>
        {VEHICLE_OPTIONS.map((option) => (
          <Pressable
            key={option.type}
            style={[styles.vehicleOption, vehicleType === option.type && styles.vehicleOptionSelected]}
            onPress={() => setValue('vehicleType', option.type)}
          >
            <VehicleIcon type={option.type} size={28} color={vehicleType === option.type ? colors.primary : colors.textSecondary} />
            <Text style={[styles.vehicleLabel, vehicleType === option.type && styles.vehicleLabelSelected]}>{option.label}</Text>
          </Pressable>
        ))}
      </View>

      <Controller
        control={control}
        name="vehicleBrand"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input placeholder="Marque (ex. Toyota)" onBlur={onBlur} onChangeText={onChange} value={value} />
        )}
      />
      {errors.vehicleBrand && <Text style={styles.error}>{errors.vehicleBrand.message}</Text>}

      <Controller
        control={control}
        name="vehicleModel"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input placeholder="Modèle (ex. Corolla)" onBlur={onBlur} onChangeText={onChange} value={value} />
        )}
      />
      {errors.vehicleModel && <Text style={styles.error}>{errors.vehicleModel.message}</Text>}

      <Controller
        control={control}
        name="vehiclePlate"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input placeholder="Plaque d'immatriculation" autoCapitalize="characters" onBlur={onBlur} onChangeText={onChange} value={value} />
        )}
      />
      {errors.vehiclePlate && <Text style={styles.error}>{errors.vehiclePlate.message}</Text>}

      <Controller
        control={control}
        name="vehicleColor"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input placeholder="Couleur" onBlur={onBlur} onChangeText={onChange} value={value} />
        )}
      />
      {errors.vehicleColor && <Text style={styles.error}>{errors.vehicleColor.message}</Text>}

      {serverError && <Text style={styles.error}>{serverError}</Text>}

      <Button title={isSubmitting ? 'Inscription...' : "S'inscrire comme conducteur"} onPress={handleSubmit(onSubmit)} disabled={isSubmitting} loading={isSubmitting} />

      <Link href="/(auth)/login" style={styles.link}>
        Déjà un compte ? Se connecter
      </Link>
    </ScrollView>
  );
}

export default function RegisterScreen() {
  const [role, setRole] = useState<Role | null>(null);

  if (role === null) {
    return <RoleChoice onSelect={setRole} />;
  }

  if (role === 'PASSENGER') {
    return <PassengerRegisterForm onBack={() => setRole(null)} />;
  }

  return <DriverRegisterForm onBack={() => setRole(null)} />;
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
  title: { ...typography.title, color: colors.text, marginBottom: spacing.xs, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md },
  sectionLabel: { ...typography.smallMedium, color: colors.textSecondary, marginTop: spacing.sm },
  error: { ...typography.small, color: colors.danger },
  link: { textAlign: 'center', marginTop: spacing.lg, color: colors.primary, ...typography.smallMedium },
  backLink: { ...typography.smallMedium, color: colors.primary, marginBottom: spacing.sm },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  roleCardText: { flex: 1, gap: spacing.xs },
  roleCardTitle: { ...typography.bodyMedium, color: colors.text },
  roleCardSubtitle: { ...typography.small, color: colors.textSecondary },
  vehicleRow: { flexDirection: 'row', gap: spacing.sm },
  vehicleOption: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  vehicleOptionSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  vehicleLabel: { ...typography.smallMedium, color: colors.textSecondary },
  vehicleLabelSelected: { color: colors.primary },
});
