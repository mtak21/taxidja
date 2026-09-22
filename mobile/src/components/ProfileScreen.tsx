import { useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AxiosError } from 'axios';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import type { AuthUserVehicle } from '../store/authStore';
import { useLogout } from '../hooks/useLogout';
import { updateProfile, changePassword, uploadAvatar } from '../services/users';
import { addVehicle, updateVehicle, type VehicleInput } from '../services/driver';
import { baseURL } from '../services/api';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { VehicleIcon, type VehicleKind } from './ui/VehicleIcon';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';
import { typography } from '../theme/typography';

const VEHICLE_OPTIONS: { type: VehicleKind; label: string }[] = [
  { type: 'MOTO', label: 'Moto' },
  { type: 'RAKCHA', label: 'Rakcha' },
  { type: 'CAR', label: 'Voiture' },
];

const VERIFICATION_LABELS: Record<string, { label: string; tone: 'positive' | 'warning' | 'negative' }> = {
  PENDING: { label: 'Vérification en cours', tone: 'warning' },
  VERIFIED: { label: 'Vérifié', tone: 'positive' },
  SUSPENDED: { label: 'Suspendu', tone: 'negative' },
};

const profileSchema = z.object({
  firstName: z.string().trim().min(1, 'Prénom requis'),
  lastName: z.string().trim().min(1, 'Nom requis'),
  email: z.union([z.literal(''), z.string().trim().email('Email invalide')]).optional(),
});
type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Mot de passe actuel requis'),
    newPassword: z.string().min(8, '8 caractères minimum'),
    confirmPassword: z.string().min(1, 'Confirmation requise'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });
type PasswordForm = z.infer<typeof passwordSchema>;

const vehicleSchema = z.object({
  type: z.enum(['MOTO', 'RAKCHA', 'CAR']),
  brand: z.string().trim().min(1, 'Marque requise'),
  model: z.string().trim().min(1, 'Modèle requis'),
  plate: z.string().trim().min(1, 'Plaque requise'),
  color: z.string().trim().min(1, 'Couleur requise'),
});
type VehicleForm = z.infer<typeof vehicleSchema>;

function AvatarPicker() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [isUploading, setIsUploading] = useState(false);

  const handlePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', "Autorise l'accès à tes photos pour changer ta photo de profil.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets[0]) return;

    setIsUploading(true);
    try {
      const updated = await uploadAvatar(result.assets[0].uri);
      setUser(updated);
    } catch {
      Alert.alert('Erreur', "Impossible d'envoyer la photo. Vérifie qu'elle fait moins de 5 Mo (JPG/PNG).");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Pressable style={styles.avatarWrap} onPress={handlePick} disabled={isUploading}>
      {user?.avatarUrl ? (
        <Image source={{ uri: `${baseURL}${user.avatarUrl}` }} style={styles.avatarImage} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <MaterialCommunityIcons name="account" size={48} color={colors.textOnPrimary} />
        </View>
      )}
      <View style={styles.avatarEditBadge}>
        <MaterialCommunityIcons name="camera" size={16} color={colors.textOnPrimary} />
      </View>
    </Pressable>
  );
}

function ProfileForm() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [serverError, setServerError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
    },
  });

  const onSubmit = async (values: ProfileForm) => {
    setServerError(null);
    setSavedMessage(null);
    setIsSubmitting(true);
    try {
      const updated = await updateProfile({ ...values, email: values.email || undefined });
      setUser(updated);
      setSavedMessage('Profil mis à jour.');
    } catch (error) {
      const message = error instanceof AxiosError ? error.response?.data?.error : undefined;
      setServerError(message ?? 'Impossible de mettre à jour le profil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card style={styles.section}>
      <Text style={styles.sectionTitle}>Informations</Text>

      <Input label="Téléphone" value={user?.phone ?? ''} editable={false} style={styles.readOnlyInput} />

      <Controller
        control={control}
        name="firstName"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input label="Prénom" onBlur={onBlur} onChangeText={onChange} value={value} />
        )}
      />
      {errors.firstName && <Text style={styles.error}>{errors.firstName.message}</Text>}

      <Controller
        control={control}
        name="lastName"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input label="Nom" onBlur={onBlur} onChangeText={onChange} value={value} />
        )}
      />
      {errors.lastName && <Text style={styles.error}>{errors.lastName.message}</Text>}

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input label="Email" autoCapitalize="none" keyboardType="email-address" onBlur={onBlur} onChangeText={onChange} value={value} />
        )}
      />
      {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}

      {serverError && <Text style={styles.error}>{serverError}</Text>}
      {savedMessage && <Text style={styles.success}>{savedMessage}</Text>}

      <Button title={isSubmitting ? 'Enregistrement...' : 'Enregistrer'} onPress={handleSubmit(onSubmit)} disabled={isSubmitting} loading={isSubmitting} />
    </Card>
  );
}

function PasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (values: PasswordForm) => {
    setServerError(null);
    setSavedMessage(null);
    setIsSubmitting(true);
    try {
      await changePassword(values.oldPassword, values.newPassword);
      setSavedMessage('Mot de passe modifié.');
      reset();
    } catch (error) {
      const message =
        error instanceof AxiosError && error.response?.status === 401
          ? 'Mot de passe actuel incorrect.'
          : 'Impossible de modifier le mot de passe.';
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card style={styles.section}>
      <Text style={styles.sectionTitle}>Changer le mot de passe</Text>

      <Controller
        control={control}
        name="oldPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input label="Mot de passe actuel" secureTextEntry onBlur={onBlur} onChangeText={onChange} value={value} />
        )}
      />
      {errors.oldPassword && <Text style={styles.error}>{errors.oldPassword.message}</Text>}

      <Controller
        control={control}
        name="newPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input label="Nouveau mot de passe" secureTextEntry onBlur={onBlur} onChangeText={onChange} value={value} />
        )}
      />
      {errors.newPassword && <Text style={styles.error}>{errors.newPassword.message}</Text>}

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input label="Confirmer le nouveau mot de passe" secureTextEntry onBlur={onBlur} onChangeText={onChange} value={value} />
        )}
      />
      {errors.confirmPassword && <Text style={styles.error}>{errors.confirmPassword.message}</Text>}

      {serverError && <Text style={styles.error}>{serverError}</Text>}
      {savedMessage && <Text style={styles.success}>{savedMessage}</Text>}

      <Button title={isSubmitting ? 'Envoi...' : 'Modifier le mot de passe'} variant="secondary" onPress={handleSubmit(onSubmit)} disabled={isSubmitting} loading={isSubmitting} />
    </Card>
  );
}

function VehicleForm({
  vehicle,
  onDone,
}: {
  vehicle?: AuthUserVehicle;
  onDone: (updated: AuthUserVehicle) => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VehicleForm>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      type: vehicle?.type ?? 'CAR',
      brand: vehicle?.brand ?? '',
      model: vehicle?.model ?? '',
      plate: vehicle?.plate ?? '',
      color: vehicle?.color ?? '',
    },
  });
  const type = watch('type');

  const onSubmit = async (values: VehicleForm) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const input: VehicleInput = values;
      const result = vehicle ? await updateVehicle(vehicle.id, input) : await addVehicle(input);
      onDone(result);
    } catch {
      setServerError("Impossible d'enregistrer le véhicule.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.vehicleForm}>
      <View style={styles.vehicleRow}>
        {VEHICLE_OPTIONS.map((option) => (
          <Pressable
            key={option.type}
            style={[styles.vehicleOption, type === option.type && styles.vehicleOptionSelected]}
            onPress={() => setValue('type', option.type)}
          >
            <VehicleIcon type={option.type} size={24} color={type === option.type ? colors.primary : colors.textSecondary} />
            <Text style={[styles.vehicleLabel, type === option.type && styles.vehicleLabelSelected]}>{option.label}</Text>
          </Pressable>
        ))}
      </View>

      <Controller
        control={control}
        name="brand"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input placeholder="Marque" onBlur={onBlur} onChangeText={onChange} value={value} />
        )}
      />
      {errors.brand && <Text style={styles.error}>{errors.brand.message}</Text>}

      <Controller
        control={control}
        name="model"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input placeholder="Modèle" onBlur={onBlur} onChangeText={onChange} value={value} />
        )}
      />
      {errors.model && <Text style={styles.error}>{errors.model.message}</Text>}

      <Controller
        control={control}
        name="plate"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input placeholder="Plaque d'immatriculation" autoCapitalize="characters" onBlur={onBlur} onChangeText={onChange} value={value} />
        )}
      />
      {errors.plate && <Text style={styles.error}>{errors.plate.message}</Text>}

      <Controller
        control={control}
        name="color"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input placeholder="Couleur" onBlur={onBlur} onChangeText={onChange} value={value} />
        )}
      />
      {errors.color && <Text style={styles.error}>{errors.color.message}</Text>}

      {serverError && <Text style={styles.error}>{serverError}</Text>}

      <Button
        title={isSubmitting ? 'Enregistrement...' : vehicle ? 'Enregistrer les modifications' : 'Ajouter le véhicule'}
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
        loading={isSubmitting}
      />
    </View>
  );
}

function VehiclesSection() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const vehicles = user?.vehicles ?? [];

  function applyVehicleUpdate(updated: AuthUserVehicle) {
    if (!user) return;
    const existingIds = vehicles.map((v) => v.id);
    const nextVehicles = existingIds.includes(updated.id)
      ? vehicles.map((v) => (v.id === updated.id ? updated : { ...v, isActive: updated.isActive ? false : v.isActive }))
      : [...vehicles.map((v) => ({ ...v, isActive: updated.isActive ? false : v.isActive })), updated];
    setUser({ ...user, vehicles: nextVehicles });
    setEditingId(null);
    setIsAdding(false);
  }

  return (
    <Card style={styles.section}>
      <Text style={styles.sectionTitle}>Mes véhicules</Text>

      {vehicles.map((vehicle) => (
        <View key={vehicle.id} style={styles.vehicleCard}>
          {editingId === vehicle.id ? (
            <VehicleForm vehicle={vehicle} onDone={applyVehicleUpdate} />
          ) : (
            <>
              <View style={styles.vehicleCardHeader}>
                <VehicleIcon type={vehicle.type} size={26} />
                <View style={styles.vehicleCardInfo}>
                  <Text style={styles.vehicleCardTitle}>
                    {vehicle.brand} {vehicle.model}
                  </Text>
                  <Text style={styles.vehicleCardSubtitle}>
                    {vehicle.plate ?? '—'} · {vehicle.color ?? '—'}
                  </Text>
                </View>
                {vehicle.isActive && <Badge label="Actif" tone="positive" />}
              </View>
              <View style={styles.vehicleCardActions}>
                <Button title="Modifier" variant="secondary" fullWidth={false} onPress={() => setEditingId(vehicle.id)} />
                {!vehicle.isActive && (
                  <Button
                    title="Rendre actif"
                    variant="secondary"
                    fullWidth={false}
                    onPress={async () => {
                      try {
                        const updated = await updateVehicle(vehicle.id, { isActive: true });
                        applyVehicleUpdate(updated);
                      } catch {
                        Alert.alert('Erreur', "Impossible de changer le véhicule actif.");
                      }
                    }}
                  />
                )}
              </View>
            </>
          )}
        </View>
      ))}

      {isAdding ? (
        <VehicleForm onDone={applyVehicleUpdate} />
      ) : (
        <Button title="+ Ajouter un véhicule" variant="secondary" onPress={() => setIsAdding(true)} />
      )}
    </Card>
  );
}

export function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const handleLogout = useLogout();
  const isDriver = user?.role === 'DRIVER';
  const verification = user?.driverVerificationStatus ? VERIFICATION_LABELS[user.driverVerificationStatus] : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Compte</Text>
      </View>

      <View style={styles.identityBlock}>
        <AvatarPicker />
        <Text style={styles.name}>
          {user?.firstName} {user?.lastName}
        </Text>
        {isDriver && (
          <View style={styles.driverMeta}>
            {verification && <Badge label={verification.label} tone={verification.tone} />}
            {user?.driverRating != null && <Text style={styles.ratingText}>Note : {user.driverRating.toFixed(1)} / 5</Text>}
          </View>
        )}
      </View>

      {isDriver && <Button title="Mes revenus" variant="secondary" onPress={() => router.push('/(driver)/earnings')} />}

      <ProfileForm />
      <PasswordForm />
      {isDriver && <VehiclesSection />}

      <Pressable onPress={() => router.push('/privacy-policy')} style={styles.privacyLink}>
        <Text style={styles.privacyLinkText}>Politique de confidentialité</Text>
      </Pressable>

      <Button title="Déconnexion" variant="danger" onPress={handleLogout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingTop: 56, paddingBottom: spacing.sm },
  headerTitle: { ...typography.subtitle, color: colors.text },
  identityBlock: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  avatarWrap: { width: 96, height: 96 },
  avatarImage: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.border },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  name: { ...typography.title, color: colors.text },
  driverMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  ratingText: { ...typography.small, color: colors.textSecondary },
  section: { gap: spacing.md },
  sectionTitle: { ...typography.bodyMedium, color: colors.text },
  readOnlyInput: { opacity: 0.6 },
  error: { ...typography.small, color: colors.danger },
  success: { ...typography.small, color: colors.secondaryDark },
  vehicleForm: { gap: spacing.sm },
  vehicleRow: { flexDirection: 'row', gap: spacing.sm },
  vehicleOption: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  vehicleOptionSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  vehicleLabel: { ...typography.smallMedium, color: colors.textSecondary },
  vehicleLabelSelected: { color: colors.primary },
  vehicleCard: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md, gap: spacing.sm },
  vehicleCardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  vehicleCardInfo: { flex: 1 },
  vehicleCardTitle: { ...typography.bodyMedium, color: colors.text },
  vehicleCardSubtitle: { ...typography.small, color: colors.textSecondary },
  vehicleCardActions: { flexDirection: 'row', gap: spacing.sm },
  privacyLink: { alignItems: 'center', paddingVertical: spacing.sm },
  privacyLinkText: { ...typography.smallMedium, color: colors.primary },
});
