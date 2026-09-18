import { View, Text, TextInput, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, MapPressEvent } from 'react-native-maps';
import type { Coordinates } from '../hooks/useLocation';
import { MapErrorBoundary } from './MapErrorBoundary';
import { canRenderMap } from './AppMap';

interface DestinationPickerProps {
  pickup: Coordinates | null;
  destination: Coordinates | null;
  onSelectDestination: (coordinates: Coordinates) => void;
}

const FALLBACK_REGION = {
  latitude: 12.1348,
  longitude: 15.0557,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

/**
 * Lets the passenger pick a destination by tapping the map. Without a
 * configured Google Maps key (see AppMap), the native map can't render on
 * Android, so we fall back to manual latitude/longitude entry — a stand-in
 * for real geocoding/map-tap, not a simulation of it.
 */
export function DestinationPicker({ pickup, destination, onSelectDestination }: DestinationPickerProps) {
  const region = pickup ? { ...pickup, latitudeDelta: 0.02, longitudeDelta: 0.02 } : FALLBACK_REGION;

  const handlePress = (event: MapPressEvent) => {
    onSelectDestination(event.nativeEvent.coordinate);
  };

  if (!canRenderMap) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>
          Sélection sur carte indisponible (aucune clé Google Maps configurée). Entre les coordonnées de
          destination manuellement.
        </Text>
        <View style={styles.coordRow}>
          <TextInput
            style={styles.coordInput}
            placeholder="Latitude"
            keyboardType="numbers-and-punctuation"
            value={destination ? String(destination.latitude) : ''}
            onChangeText={(text) => {
              const latitude = Number(text);
              if (!Number.isNaN(latitude)) {
                onSelectDestination({ latitude, longitude: destination?.longitude ?? FALLBACK_REGION.longitude });
              }
            }}
          />
          <TextInput
            style={styles.coordInput}
            placeholder="Longitude"
            keyboardType="numbers-and-punctuation"
            value={destination ? String(destination.longitude) : ''}
            onChangeText={(text) => {
              const longitude = Number(text);
              if (!Number.isNaN(longitude)) {
                onSelectDestination({ latitude: destination?.latitude ?? FALLBACK_REGION.latitude, longitude });
              }
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapErrorBoundary>
        <MapView
          style={StyleSheet.absoluteFill}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          onPress={handlePress}
        >
          {pickup && <Marker coordinate={pickup} title="Départ" pinColor="#1a73e8" />}
          {destination && <Marker coordinate={destination} title="Destination" pinColor="#d32f2f" />}
        </MapView>
      </MapErrorBoundary>
      <View style={styles.hintBanner}>
        <Text style={styles.hintText}>Touche la carte pour placer ta destination</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  fallback: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    gap: 10,
    justifyContent: 'center',
  },
  fallbackText: { color: '#555', fontSize: 13, textAlign: 'center' },
  coordRow: { flexDirection: 'row', gap: 8 },
  coordInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
  },
  hintBanner: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    padding: 8,
  },
  hintText: { color: '#fff', textAlign: 'center', fontSize: 12 },
});
