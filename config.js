/**
 * config.js — central configuration + API key resolution.
 *
 * Key resolution order (first match wins):
 *   1. window.APP_ENV.GOOGLE_MAPS_API_KEY  (injected at build/deploy time, see env.example.js)
 *   2. ?key=YOUR_KEY URL query parameter    (handy for quick testing)
 *   (The in-app "Map key" dialog applies a key by reloading with ?key=, so no browser
 *    storage is used. Swap in your own persistence, e.g. a backend proxy, if needed.)
 *
 * If no key is found the dashboard runs in Demo mode (Leaflet + OpenStreetMap tiles)
 * using the exact same data, filter and marker modules.
 *
 * SECURITY: Google Maps JS keys are always visible in the browser. Protect them by
 * restricting the key in Google Cloud Console → Credentials:
 *   - Application restriction: HTTP referrers (e.g. https://yourdomain.com/*)
 *   - API restriction: "Maps JavaScript API" only
 */

export const CONFIG = {
  dataUrl: './data/properties.geojson',

  // Map ID is required for Advanced Markers. "DEMO_MAP_ID" works for development;
  // create your own in Cloud Console → Map Management for production styling.
  mapId: (window.APP_ENV && window.APP_ENV.GOOGLE_MAPS_MAP_ID) || 'DEMO_MAP_ID',

  // Initial location id (from `locations` below). The map centers on it at startup.
  defaultLocation: 'jeddah',
  defaultCenter: { lat: 21.5900, lng: 39.1600 },
  defaultZoom: 11,

  // Selectable locations for auto-centering. bounds-free: center + zoom.
  locations: [
    { id: 'all',     label: 'All of Saudi Arabia', center: { lat: 23.8859, lng: 45.0792 }, zoom: 5 },
    { id: 'jeddah',  label: 'Jeddah',              center: { lat: 21.5900, lng: 39.1600 }, zoom: 11 },
    { id: 'riyadh',  label: 'Riyadh',              center: { lat: 24.7600, lng: 46.6450 }, zoom: 11 },
    { id: 'makkah',  label: 'Makkah',              center: { lat: 21.3900, lng: 39.8500 }, zoom: 12 },
    { id: 'eastern', label: 'Dammam & Al Khobar',  center: { lat: 26.3700, lng: 50.1500 }, zoom: 11 },
  ],

  propertyTypes: [
    { id: 'villa',     label: 'Villa' },
    { id: 'apartment', label: 'Apartment' },
    { id: 'townhouse', label: 'Townhouse' },
    { id: 'office',    label: 'Office' },
    { id: 'land',      label: 'Land' },
  ],

  // Price slider is logarithmic so annual rents (≈40k) and villas (≈9M) share one control.
  price: { min: 20000, max: 10000000 },
};

/** Custom marker styling per listing status. Edit here to restyle the whole app. */
export const STATUS_STYLES = {
  sale: { label: 'For sale', fill: '#0f6b5c', stroke: '#ffffff', text: '#ffffff' },
  rent: { label: 'For rent', fill: '#2f5bd3', stroke: '#ffffff', text: '#ffffff' },
  sold: { label: 'Sold',     fill: '#8a8580', stroke: '#ffffff', text: '#ffffff', faded: true },
};

export function resolveApiKey() {
  const injected = window.APP_ENV && window.APP_ENV.GOOGLE_MAPS_API_KEY;
  if (injected) return { key: injected, source: 'env' };

  const fromUrl = new URLSearchParams(location.search).get('key');
  if (fromUrl) return { key: fromUrl, source: 'url' };

  return { key: null, source: 'none' };
}

/** Apply a key for this session by reloading with ?key= (empty key → Demo mode). */
export function applyApiKey(key) {
  const url = new URL(location.href);
  if (key) url.searchParams.set('key', key.trim());
  else url.searchParams.delete('key');
  location.replace(url.toString());
}
