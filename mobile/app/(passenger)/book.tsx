import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { useLocation } from '../../src/hooks/useLocation';
import { DestinationPicker } from '../../src/components/DestinationPicker';
import { estimateRide, createRide, type RideEstimate, type VehicleType } from '../../src/services/ride';
import type { Coordinates } from '../../src/hooks/useLocation';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/ui/Input';
import { VehicleIcon } from '../../src/components/ui/VehicleIcon';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { radius } from '../../src/theme/radius';
import { typography } from '../../src/theme/typography';

const VEHICLE_OPTIONS: { type: VehicleType; label: string }[] = [
  { type: 'MOTO', label: 'Moto' },
  { type: 'RAKCHA', label: 'Rakcha' },
  { type: 'CAR', label: 'Voiture' },
];

export default function BookRideScreen() {
  const { coordinates: pickup, loading: pickupLoading, errorMessage: pickupError } = useLocation();
  const [destination, setDestination] = useState<Coordinates | null>(null);
  const [vehicleType, setVehicleType] = useState<VehicleType>('MOTO');
  const [pickupAddress, setPickupAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');

  const [estimate, setEstimate] = useState<RideEstimate | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (!pickup || !destination) {
      setEstimate(null);
      return;
    }

    setEstimateError(null);
    setEstimateLoading(true);

    const timeout = setTimeout(() => {
      estimateRide(pickup, destination, vehicleType)
        .then(setEstimate)
        .catch(() => setEstimateError("Impossible d'estimer le prix pour le moment."))
        .finally(() => setEstimateLoading(false));
    }, 400);

    return () => clearTimeout(timeout);
  }, [pickup, destination, vehicleType]);

  const handleConfirm = async () => {
    if (!pickup || !destination) return;

    setIsConfirming(true);
    try {
      const ride = await createRide({
        pickup,
        destination,
        vehicleType,
        pickupAddress: pickupAddress.trim() || undefined,
        destinationAddress: destinationAddress.trim() || undefined,
      });
      router.push(`/(passenger)/ride/${ride.id}`);
    } catch {
      Alert.alert('Erreur', 'Impossible de créer la course. Réessaie.');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backText}>← Retour</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Réserver une course</Text>
      </View>

      <View style={styles.mapArea}>
        {pickupLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.center} />
        ) : (
          <DestinationPicker
            pickup={pickup}
            destination={destination}
            onSelectDestination={setDestination}
            route={estimate?.routeGeometry}
          />
        )}
      </View>
      {pickupError && <Text style={styles.warningText}>{pickupError}</Text>}

      <View style={styles.form}>
        <Input placeholder="Adresse de départ (optionnel)" value={pickupAddress} onChangeText={setPickupAddress} />
        <Input placeholder="Adresse de destination (optionnel)" value={destinationAddress} onChangeText={setDestinationAddress} />

        <View style={styles.vehicleRow}>
          {VEHICLE_OPTIONS.map((option) => (
            <Pressable
              key={option.type}
              style={[styles.vehicleOption, vehicleType === option.type && styles.vehicleOptionSelected]}
              onPress={() => setVehicleType(option.type)}
            >
              <VehicleIcon
                type={option.type}
                size={30}
                color={vehicleType === option.type ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.vehicleLabel, vehicleType === option.type && styles.vehicleLabelSelected]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Card style={styles.estimateBox} padded={false}>
          {!destination && <Text style={styles.estimateHint}>Choisis une destination pour voir le prix estimé</Text>}
          {destination && estimateLoading && <ActivityIndicator color={colors.primary} />}
          {destination && !estimateLoading && estimateError && <Text style={styles.warningText}>{estimateError}</Text>}
          {destination && !estimateLoading && estimate && (
            <View style={styles.estimateRow}>
              <Text style={styles.estimateValue}>{estimate.distance} km</Text>
              <Text style={styles.estimateValue}>{estimate.estimatedDuration} min</Text>
              <Text style={styles.estimatePrice}>{estimate.estimatedPrice} FCFA</Text>
            </View>
          )}
        </Card>

        <Button
          title={isConfirming ? 'Confirmation...' : 'Confirmer la course'}
          onPress={handleConfirm}
          disabled={!estimate || isConfirming}
          loading={isConfirming}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    paddingTop: 56,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backText: { ...typography.smallMedium, color: colors.primary },
  headerTitle: { ...typography.subtitle, color: colors.text },
  mapArea: { flex: 1, margin: spacing.lg },
  center: { flex: 1 },
  form: { padding: spacing.lg, gap: spacing.md },
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
  estimateBox: { minHeight: 56, justifyContent: 'center', alignItems: 'center', paddingVertical: spacing.md },
  estimateHint: { ...typography.small, color: colors.textSecondary, textAlign: 'center' },
  estimateRow: { flexDirection: 'row', gap: spacing.lg, alignItems: 'center' },
  estimateValue: { ...typography.body, color: colors.text },
  estimatePrice: { ...typography.subtitle, color: colors.primary },
  warningText: { ...typography.small, color: colors.danger, textAlign: 'center', paddingHorizontal: spacing.lg },
});
