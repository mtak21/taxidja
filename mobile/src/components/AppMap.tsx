import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Map, Camera, Marker } from '@maplibre/maplibre-react-native';
import type { Coordinates } from '../hooks/useLocation';
import { MapErrorBoundary } from './MapErrorBoundary';
import { OSM_STYLE } from '../config/osmMapStyle';

interface AppMapProps {
  coordinates: Coordinates | null;
  loading: boolean;
  errorMessage: string | null;
  markerTitle?: string;
}

// N'Djamena — sensible default center when the device position is unavailable.
const FALLBACK_CENTER: Coordinates = { latitude: 12.1348, longitude: 15.0557 };

export function AppMap({ coordinates, loading, errorMessage }: AppMapProps) {
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const center = coordinates ?? FALLBACK_CENTER;

  return (
    <View style={styles.container}>
      <MapErrorBoundary>
        <Map style={StyleSheet.absoluteFill} mapStyle={OSM_STYLE}>
          <Camera initialViewState={{ center: [center.longitude, center.latitude], zoom: 15 }} />
          {coordinates && (
            <Marker id="current-position" lngLat={[coordinates.longitude, coordinates.latitude]}>
              <View style={styles.pin} />
            </Marker>
          )}
        </Map>
      </MapErrorBoundary>

      {errorMessage && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{errorMessage}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, margin: 16, borderRadius: 12, overflow: 'hidden' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', margin: 16 },
  pin: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#1a73e8',
    borderWidth: 2,
    borderColor: '#fff',
  },
  banner: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 8,
    padding: 10,
  },
  bannerText: { color: '#fff', textAlign: 'center', fontSize: 13 },
});
