import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

interface LocationState {
  coordinates: Coordinates | null;
  loading: boolean;
  errorMessage: string | null;
  permissionDenied: boolean;
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    coordinates: null,
    loading: true,
    errorMessage: null,
    permissionDenied: false,
  });

  const fetchLocation = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, errorMessage: null }));

    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setState({
          coordinates: null,
          loading: false,
          errorMessage: 'Le GPS est désactivé. Active-le pour voir ta position sur la carte.',
          permissionDenied: false,
        });
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState({
          coordinates: null,
          loading: false,
          errorMessage: "Permission de localisation refusée. Autorise l'accès pour voir ta position.",
          permissionDenied: true,
        });
        return;
      }

      // Prefer the last known fix — it resolves instantly and is good enough
      // for centering a map. Fall back to a fresh, more precise reading.
      let position = await Location.getLastKnownPositionAsync();
      if (!position) {
        position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      }

      setState({
        coordinates: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
        loading: false,
        errorMessage: null,
        permissionDenied: false,
      });
    } catch {
      setState({
        coordinates: null,
        loading: false,
        errorMessage: "Impossible d'obtenir ta position pour le moment.",
        permissionDenied: false,
      });
    }
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return { ...state, refetch: fetchLocation };
}
