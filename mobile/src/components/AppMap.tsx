import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import type { Coordinates } from '../hooks/useLocation';
import { MapErrorBoundary } from './MapErrorBoundary';

interface AppMapProps {
  coordinates: Coordinates | null;
  loading: boolean;
  errorMessage: string | null;
  markerTitle?: string;
}

// N'Djamena — sensible default center when the device position is unavailable.
const FALLBACK_REGION = {
  latitude: 12.1348,
  longitude: 15.0557,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// On Android, react-native-maps' native Google Maps view throws a fatal
// "API key not found" exception when mounted without a key — it does not
// degrade to a watermarked map like on iOS. So without a key we must avoid
// mounting <MapView> at all on Android rather than relying on it to fail
// gracefully.
export const hasGoogleMapsKey = Boolean(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY);
export const canRenderMap = Platform.OS !== 'android' || hasGoogleMapsKey;

export function AppMap({ coordinates, loading, errorMessage, markerTitle }: AppMapProps) {
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const region = coordinates
    ? { ...coordinates, latitudeDelta: 0.01, longitudeDelta: 0.01 }
    : FALLBACK_REGION;

  return (
    <View style={styles.container}>
      {canRenderMap ? (
        <MapErrorBoundary>
          <MapView
            style={StyleSheet.absoluteFill}
            provider={PROVIDER_GOOGLE}
            initialRegion={region}
            showsUserLocation={Boolean(coordinates)}
          >
            {coordinates && <Marker coordinate={coordinates} title={markerTitle} />}
          </MapView>
        </MapErrorBoundary>
      ) : (
        <View style={styles.noKeyFallback}>
          <Text style={styles.noKeyText}>
            Carte indisponible : aucune clé Google Maps configurée (EXPO_PUBLIC_GOOGLE_MAPS_API_KEY).
          </Text>
          {coordinates && (
            <Text style={styles.coordsText}>
              Position : {coordinates.latitude.toFixed(5)}, {coordinates.longitude.toFixed(5)}
            </Text>
          )}
        </View>
      )}

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
  noKeyFallback: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  noKeyText: { textAlign: 'center', color: '#555', fontSize: 14 },
  coordsText: { textAlign: 'center', color: '#333', fontSize: 13, fontWeight: '600' },
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
