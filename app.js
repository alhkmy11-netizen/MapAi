/**
 * app.js — orchestration. Wires data → filters → map adapter → UI.
 */
import { CONFIG, resolveApiKey, applyApiKey } from './config.js';
import { loadProperties } from './data.js';
import { createFilterState, applyFilters } from './filters.js';
import { createGoogleMap } from './providers/googleMaps.js';
import { createLeafletMap } from './providers/leaflet.js';
import { initControls, renderList, renderStats, setActiveCard, setProviderBadge, toast } from './ui.js';

const mapEl = document.getElementById('map');
const state = { listings: [], filtered: [], filters: createFilterState(), map: null };

async function createMap() {
  const { key } = resolveApiKey();
  const opts = {
    center: CONFIG.defaultCenter, zoom: CONFIG.defaultZoom, mapId: CONFIG.mapId,
    onMarkerClick: (id) => setActiveCard(id, { scroll: true }),
  };
  if (key) {
    try {
      const m = await createGoogleMap(mapEl, { ...opts, apiKey: key });
      setProviderBadge('google');
      return m;
    } catch (err) {
      console.warn(err);
      toast(`${err.message} Showing Demo mode instead.`);
    }
  }
  mapEl.innerHTML = '';
  setProviderBadge('demo');
  return createLeafletMap(mapEl, opts);
}

/** Rough distance (km) for sorting results nearest-first to the selected location. */
function distanceKm(a, b) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function refresh() {
  state.filtered = applyFilters(state.listings, state.filters);
  const origin = state.origin || CONFIG.locations.find((l) => l.id === state.filters.location)?.center;
  if (origin && (state.origin || state.filters.location !== 'all')) {
    state.filtered.sort((a, b) => distanceKm(origin, a.position) - distanceKm(origin, b.position));
  }
  state.map.setVisible(new Set(state.filtered.map((l) => l.id)));
  renderList(state.filtered, { onSelect: (id) => focusListing(id) });
  renderStats(state.filtered, state.listings.length);
  document.getElementById('empty').hidden = state.filtered.length > 0;
}

function focusListing(id) {
  state.map.focus(id);
  setActiveCard(id);
}

function centerOnLocation(locId) {
  const loc = CONFIG.locations.find((l) => l.id === locId);
  if (loc) state.map.centerOn(loc.center, loc.zoom);
}

function centerOnUser() {
  if (!navigator.geolocation) return toast('Geolocation is not available in this browser.');
  toast('Finding your location…');
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      state.origin = { lat: coords.latitude, lng: coords.longitude };
      state.map.centerOn(state.origin, 13);
      refresh();
      toast('Centered on your location.');
    },
    () => toast('Location permission was denied or unavailable.'),
    { enableHighAccuracy: false, timeout: 8000 },
  );
}

async function boot() {
  try {
    const [listings, map] = await Promise.all([loadProperties(CONFIG.dataUrl), createMap()]);
    state.listings = listings;
    state.map = map;
    map.setListings(listings);

    initControls(state.filters, {
      onChange: refresh,
      onLocation: (id) => { state.filters.location = id; state.origin = null; centerOnLocation(id); refresh(); },
      onNearMe: centerOnUser,
      onFit: () => state.map.fitTo(state.filtered),
      onSaveKey: (key) => applyApiKey(key),
    });
    refresh();
    centerOnLocation(state.filters.location);
  } catch (err) {
    console.error(err);
    document.getElementById('list').innerHTML =
      `<li class="list-error">Could not load listings. ${err.message}</li>`;
  }
  document.body.classList.remove('is-loading');
}

// If Google rejects the key after the map has rendered, fall back to demo mode.
window.addEventListener('gmaps:authfailure', async () => {
  if (!state.map || state.map.provider !== 'google') return;
  toast('Google Maps rejected the API key. Switched to Demo mode.');
  mapEl.innerHTML = '';
  setProviderBadge('demo');
  state.map = await createLeafletMap(mapEl, {
    center: CONFIG.defaultCenter, zoom: CONFIG.defaultZoom,
    onMarkerClick: (id) => setActiveCard(id, { scroll: true }),
  });
  state.map.setListings(state.listings);
  refresh();
  state.map.fitTo(state.filtered);
});

boot();
