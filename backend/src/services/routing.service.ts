import { VehicleType } from '@prisma/client';
import { calculateDistanceKm, estimateDurationMinutes, type Coordinates } from './pricing.service';

// Public OSRM demo server — free, no API key, but rate-limited and explicitly
// "not for production use at scale" per OSRM's own usage policy. A real
// deployment needs either a self-hosted OSRM instance (built from OpenStreetMap
// data for Chad — see http://download.geofabrik.de/africa/chad.html) or a
// paid routing provider (Mapbox Directions, Google Directions, etc). See
// README.md for the full note.
const OSRM_BASE_URL = process.env.OSRM_BASE_URL ?? 'https://router.project-osrm.org';
const OSRM_TIMEOUT_MS = 5000;

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  geometry: RoutePoint[];
  /** Which path produced this result — surfaced so callers/logs can tell an OSRM outage from normal operation. */
  source: 'osrm' | 'haversine';
}

interface OsrmResponse {
  code: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: { coordinates: [number, number][] };
  }>;
}

function haversineFallback(pickup: Coordinates, destination: Coordinates, vehicleType: VehicleType): RouteResult {
  const distanceKm = calculateDistanceKm(pickup, destination);
  return {
    distanceKm: Math.round(distanceKm * 100) / 100,
    durationMinutes: estimateDurationMinutes(distanceKm, vehicleType),
    // A straight line is the only "geometry" a fallback can offer — just the
    // two endpoints, so the map draws a plain segment instead of a road path.
    geometry: [pickup, destination],
    source: 'haversine',
  };
}

/**
 * Real road-route distance/duration/geometry via OSRM, falling back to a
 * Haversine straight-line estimate (same formula used everywhere else in the
 * app) if OSRM is unreachable, slow, or returns an error — a routing outage
 * should degrade the estimate, never break booking.
 */
export async function getRoute(
  pickup: Coordinates,
  destination: Coordinates,
  vehicleType: VehicleType,
): Promise<RouteResult> {
  const url =
    `${OSRM_BASE_URL}/route/v1/driving/` +
    `${pickup.longitude},${pickup.latitude};${destination.longitude},${destination.latitude}` +
    `?overview=full&geometries=geojson`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OSRM_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`OSRM responded with HTTP ${response.status}`);
    }

    const data = (await response.json()) as OsrmResponse;
    const route = data.routes?.[0];
    if (data.code !== 'Ok' || !route) {
      throw new Error(`OSRM returned code "${data.code}" with no route`);
    }

    const geometry: RoutePoint[] = route.geometry.coordinates.map(([longitude, latitude]) => ({
      latitude,
      longitude,
    }));

    return {
      distanceKm: Math.round((route.distance / 1000) * 100) / 100,
      durationMinutes: Math.max(1, Math.ceil(route.duration / 60)),
      geometry,
      source: 'osrm',
    };
  } catch (error) {
    console.error(
      '[routing.service] OSRM request failed, falling back to Haversine straight-line estimate:',
      error instanceof Error ? error.message : error,
    );
    return haversineFallback(pickup, destination, vehicleType);
  } finally {
    clearTimeout(timeout);
  }
}
