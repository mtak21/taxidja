import { View, Text, StyleSheet } from 'react-native';
import { Map, Camera, Marker, type MapProps } from '@maplibre/maplibre-react-native';
import type { Coordinates } from '../hooks/useLocation';
import { MapErrorBoundary } from './MapErrorBoundary';
import { OSM_STYLE } from '../config/osmMapStyle';

interface DestinationPickerProps {
  pickup: Coordinates | null;
  destination: Coordinates | null;
  onSelectDestination: (coordinates: Coordinates) => void;
}

const FALLBACK_CENTER: Coordinates = { latitude: 12.1348, longitude: 15.0557 };

/** Lets the passenger pick a destination by tapping the map. */
export function DestinationPicker({ pickup, destination, onSelectDestination }: DestinationPickerProps) {
  const center = pickup ?? FALLBACK_CENTER;

  const handlePress: NonNullable<MapProps['onPress']> = (event) => {
    const [longitude, latitude] = event.nativeEvent.lngLat;
    onSelectDestination({ latitude, longitude });
  };

  return (
    <View style={styles.container}>
      <MapErrorBoundary>
        <Map style={StyleSheet.absoluteFill} mapStyle={OSM_STYLE} onPress={handlePress}>
          <Camera initialViewState={{ center: [center.longitude, center.latitude], zoom: 14 }} />
          {pickup && (
            <Marker id="pickup" lngLat={[pickup.longitude, pickup.latitude]}>
              <View style={[styles.pin, styles.pickupPin]} />
            </Marker>
          )}
          {destination && (
            <Marker id="destination" lngLat={[destination.longitude, destination.latitude]}>
              <View style={[styles.pin, styles.destinationPin]} />
            </Marker>
          )}
        </Map>
      </MapErrorBoundary>
      <View style={styles.hintBanner}>
        <Text style={styles.hintText}>Touche la carte pour placer ta destination</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  pin: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#fff',
  },
  pickupPin: { backgroundColor: '#1a73e8' },
  destinationPin: { backgroundColor: '#d32f2f' },
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
