import { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Map, Camera, Marker, type CameraRef } from '@maplibre/maplibre-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Coordinates } from '../hooks/useLocation';
import type { RoutePoint } from '../services/ride';
import { MapErrorBoundary } from './MapErrorBoundary';
import { RoutePolyline } from './RoutePolyline';
import { OSM_STYLE } from '../config/osmMapStyle';
import { colors } from '../theme/colors';
import { radius } from '../theme/radius';

interface RideTrackingMapProps {
  pickup: Coordinates;
  destination: Coordinates;
  /** The road route to draw — pickup→destination for the passenger, or the driver's route to its next waypoint. */
  route?: RoutePoint[] | null;
  /** The driver's live position, when known — renders a moving marker and gently follows the camera. */
  driverPosition?: Coordinates | null;
}

/** Shared trip map for both the passenger and driver ride-status screens. */
export function RideTrackingMap({ pickup, destination, route, driverPosition }: RideTrackingMapProps) {
  const cameraRef = useRef<CameraRef>(null);
  const center = driverPosition ?? pickup;

  useEffect(() => {
    if (driverPosition) {
      cameraRef.current?.easeTo({ center: [driverPosition.longitude, driverPosition.latitude], duration: 1000 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverPosition?.latitude, driverPosition?.longitude]);

  return (
    <View style={styles.container}>
      <MapErrorBoundary>
        <Map style={StyleSheet.absoluteFill} mapStyle={OSM_STYLE}>
          <Camera ref={cameraRef} initialViewState={{ center: [center.longitude, center.latitude], zoom: 14 }} />

          {route && route.length > 1 && <RoutePolyline points={route} />}

          <Marker id="pickup" lngLat={[pickup.longitude, pickup.latitude]}>
            <View style={[styles.pin, styles.pickupPin]} />
          </Marker>

          <Marker id="destination" lngLat={[destination.longitude, destination.latitude]}>
            <View style={[styles.pin, styles.destinationPin]} />
          </Marker>

          {driverPosition && (
            <Marker id="driver" lngLat={[driverPosition.longitude, driverPosition.latitude]}>
              <View style={styles.driverMarker}>
                <MaterialCommunityIcons name="car" size={18} color={colors.textOnPrimary} />
              </View>
            </Marker>
          )}
        </Map>
      </MapErrorBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, borderRadius: radius.lg, overflow: 'hidden' },
  pin: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  pickupPin: { backgroundColor: colors.primary },
  destinationPin: { backgroundColor: colors.danger },
  driverMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
});
