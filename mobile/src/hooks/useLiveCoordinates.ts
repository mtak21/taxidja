import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import type { Coordinates } from './useLocation';

// Faster/finer than useDriverLocationTracking (15s/50m) on purpose: this
// hook is display-only (moves a marker on the driver's own map), it never
// hits the network, so there's no backend load to weigh against freshness.
const TIME_INTERVAL_MS = 5000;
const DISTANCE_INTERVAL_M = 20;

/**
 * Watches the device position purely for local display (e.g. the driver's
 * own live marker during a trip) — does not push anything to the backend.
 * That's already handled separately by useDriverLocationTracking, which
 * keeps running in the still-mounted driver home screen.
 */
export function useLiveCoordinates(enabled: boolean): Coordinates | null {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) return;

      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: TIME_INTERVAL_MS,
          distanceInterval: DISTANCE_INTERVAL_M,
        },
        (position) => {
          setCoordinates({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        },
      );
    }

    if (enabled) {
      start();
    } else {
      setCoordinates(null);
    }

    return () => {
      cancelled = true;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, [enabled]);

  return coordinates;
}
