import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { useLocation } from '../../src/hooks/useLocation';
import { DestinationPicker } from '../../src/components/DestinationPicker';
import { estimateRide, createRide, type RideEstimate, type VehicleType } from '../../src/services/ride';
import type { Coordinates } from '../../src/hooks/useLocation';

const VEHICLE_OPTIONS: { type: VehicleType; label: string; icon: string }[] = [
  { type: 'MOTO', label: 'Moto', icon: '🛵' },
  { type: 'RAKCHA', label: 'Rakcha', icon: '🛺' },
  { type: 'CAR', label: 'Voiture', icon: '🚗' },
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
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>← Retour</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Réserver une course</Text>
      </View>

      <View style={styles.mapArea}>
        {pickupLoading ? (
          <ActivityIndicator size="large" style={styles.center} />
        ) : (
          <DestinationPicker pickup={pickup} destination={destination} onSelectDestination={setDestination} />
        )}
      </View>
      {pickupError && <Text style={styles.warningText}>{pickupError}</Text>}

      <View style={styles.form}>
        <TextInput
          style={styles.addressInput}
          placeholder="Adresse de départ (optionnel)"
          value={pickupAddress}
          onChangeText={setPickupAddress}
        />
        <TextInput
          style={styles.addressInput}
          placeholder="Adresse de destination (optionnel)"
          value={destinationAddress}
          onChangeText={setDestinationAddress}
        />

        <View style={styles.vehicleRow}>
          {VEHICLE_OPTIONS.map((option) => (
            <Pressable
              key={option.type}
              style={[styles.vehicleOption, vehicleType === option.type && styles.vehicleOptionSelected]}
              onPress={() => setVehicleType(option.type)}
            >
              <Text style={styles.vehicleIcon}>{option.icon}</Text>
              <Text style={styles.vehicleLabel}>{option.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.estimateBox}>
          {!destination && <Text style={styles.estimateHint}>Choisis une destination pour voir le prix estimé</Text>}
          {destination && estimateLoading && <ActivityIndicator />}
          {destination && !estimateLoading && estimateError && <Text style={styles.warningText}>{estimateError}</Text>}
          {destination && !estimateLoading && estimate && (
            <View style={styles.estimateRow}>
              <Text style={styles.estimateValue}>{estimate.distance} km</Text>
              <Text style={styles.estimateValue}>{estimate.estimatedDuration} min</Text>
              <Text style={styles.estimatePrice}>{estimate.estimatedPrice} FCFA</Text>
            </View>
          )}
        </View>

        <Pressable
          style={[styles.confirmButton, (!estimate || isConfirming) && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={!estimate || isConfirming}
        >
          <Text style={styles.confirmButtonText}>{isConfirming ? 'Confirmation...' : 'Confirmer la course'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    paddingTop: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backText: { color: '#1a73e8', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  mapArea: { flex: 1, margin: 16 },
  center: { flex: 1 },
  form: { padding: 16, gap: 10 },
  addressInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  vehicleRow: { flexDirection: 'row', gap: 8 },
  vehicleOption: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    gap: 4,
  },
  vehicleOptionSelected: { borderColor: '#1a73e8', backgroundColor: '#e8f0fe' },
  vehicleIcon: { fontSize: 24 },
  vehicleLabel: { fontSize: 13, fontWeight: '600' },
  estimateBox: { minHeight: 48, justifyContent: 'center', alignItems: 'center' },
  estimateHint: { color: '#888', fontSize: 13, textAlign: 'center' },
  estimateRow: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  estimateValue: { fontSize: 14, color: '#333' },
  estimatePrice: { fontSize: 18, fontWeight: '700', color: '#1a73e8' },
  warningText: { color: '#d32f2f', fontSize: 13, textAlign: 'center', paddingHorizontal: 16 },
  confirmButton: { backgroundColor: '#1a73e8', borderRadius: 8, padding: 16, alignItems: 'center' },
  confirmButtonDisabled: { backgroundColor: '#a0c0f0' },
  confirmButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
