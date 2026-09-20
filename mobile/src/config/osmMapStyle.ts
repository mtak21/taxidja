import type { StyleSpecification } from '@maplibre/maplibre-react-native';

// The public OSM tile server is free and requires no API key/billing account,
// but it's meant for light/evaluation use (see the OSM Tile Usage Policy:
// https://operations.osmfoundation.org/policies/tiles/). Before shipping to
// real users, switch `tiles` below to a dedicated provider — either a paid
// tier with a generous free allowance that accepts more payment methods than
// Google Cloud (e.g. MapTiler, Stadia Maps), or a self-hosted tile server.
export const OSM_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm-tiles',
      type: 'raster',
      source: 'osm',
    },
  ],
};
