import { GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';
import { colors } from '../theme/colors';
import type { RoutePoint } from '../services/ride';

interface RoutePolylineProps {
  points: RoutePoint[];
  color?: string;
  sourceId?: string;
}

/** Draws a road-route polyline on the map — must be rendered as a child of `<Map>`. */
export function RoutePolyline({ points, color = colors.primary, sourceId = 'route-source' }: RoutePolylineProps) {
  if (points.length < 2) return null;

  const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: points.map((point) => [point.longitude, point.latitude]),
    },
  };

  return (
    <GeoJSONSource id={sourceId} data={geojson}>
      <Layer
        id={`${sourceId}-line`}
        type="line"
        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
        paint={{ 'line-color': color, 'line-width': 4, 'line-opacity': 0.85 }}
      />
    </GeoJSONSource>
  );
}
