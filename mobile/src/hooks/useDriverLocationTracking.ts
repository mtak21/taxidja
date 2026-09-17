import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { updateDriverLocation } from '../services/driver';

// Balance battery/data usage against freshness: update at most every 15s,
// or every 50m of movement, whichever comes first — not continuous tracking.
const TIME_INTERVAL_MS = 15000;
const DISTANCE_INTERVAL_M = 50;

/**
 * Starts watching the device position and pushing updates to the backend
 * while `enabled` is true. Stops and cleans up as soon as it becomes false
 * or the component unmounts.
 */
export function useDriverLocationTracking(enabled: boolean, onError?: (message: string) => void) {
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        onError?.("Permission de localisation refusée. Impossible de partager ta position.");
        return;
      }

      if (cancelled) return;

      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: TIME_INTERVAL_MS,
          distanceInterval: DISTANCE_INTERVAL_M,
        },
        (position) => {
          updateDriverLocation(position.coords.latitude, position.coords.longitude).catch(() => {
            onError?.('Échec de l\'envoi de la position au serveur.');
          });
        },
      );
    }

    if (enabled) {
      start();
    }

    return () => {
      cancelled = true;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}
