/**
 * providers/googleMaps.js — Google Maps JavaScript API adapter.
 *
 * Uses the official async bootstrap (loading=async + importLibrary) and
 * AdvancedMarkerElement with a custom DOM pin from markers.js.
 *
 * Adapter contract (shared with providers/leaflet.js):
 *   setListings(listings)   create one marker per listing
 *   setVisible(idSet)       show only markers whose id is in the set
 *   focus(id)               pan to marker and open its info window
 *   centerOn(center, zoom)  move the camera
 *   fitTo(listings)         fit bounds to a list of listings
 *   closeInfo()
 */
import { createPinElement, setPinActive } from '../markers.js';
import { renderInfoContent } from '../infoWindow.js';

let loaderPromise;

/** Inject the Maps JS bootstrap once. Rejects on network or auth failure. */
export function loadGoogleMaps(apiKey) {
  if (loaderPromise) return loaderPromise;
  loaderPromise = new Promise((resolve, reject) => {
    if (window.google?.maps?.importLibrary) return resolve(window.google.maps);

    const cbName = '__estateGmapsReady';
    window[cbName] = () => resolve(window.google.maps);
    // Google calls this global when the key is invalid / referrer not allowed.
    window.gm_authFailure = () => {
      window.dispatchEvent(new CustomEvent('gmaps:authfailure'));
      reject(new Error('Google Maps rejected the API key (check referrer restrictions and billing).'));
    };

    const params = new URLSearchParams({
      key: apiKey, v: 'weekly', loading: 'async', callback: cbName, libraries: 'marker',
    });
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?${params}`;
    s.async = true;
    s.onerror = () => reject(new Error('Could not reach maps.googleapis.com'));
    document.head.appendChild(s);
    setTimeout(() => reject(new Error('Google Maps load timed out')), 15000);
  });
  return loaderPromise;
}

export async function createGoogleMap(container, { apiKey, mapId, center, zoom, onMarkerClick }) {
  await loadGoogleMaps(apiKey);
  const { Map: GoogleMap, InfoWindow } = await google.maps.importLibrary('maps');
  const { AdvancedMarkerElement } = await google.maps.importLibrary('marker');

  const map = new GoogleMap(container, {
    center, zoom, mapId,
    disableDefaultUI: true,
    zoomControl: true,
    fullscreenControl: true,
    gestureHandling: 'greedy',
    clickableIcons: false,
  });

  const info = new InfoWindow({ maxWidth: 300 });
  const markers = new Map();   // id -> { marker, el, listing }
  let activeId = null;

  info.addListener('closeclick', () => setActive(null));
  map.addListener('click', () => { info.close(); setActive(null); });

  function setActive(id) {
    if (activeId && markers.has(activeId)) {
      const m = markers.get(activeId);
      setPinActive(m.el, false);
      m.marker.zIndex = null;
    }
    activeId = id;
    if (id && markers.has(id)) {
      const m = markers.get(id);
      setPinActive(m.el, true);
      m.marker.zIndex = 9999;
    }
  }

  function open(id) {
    const m = markers.get(id);
    if (!m) return;
    info.setContent(renderInfoContent(m.listing));
    info.open({ map, anchor: m.marker });
    setActive(id);
  }

  return {
    provider: 'google',
    setListings(listings) {
      markers.forEach(({ marker }) => (marker.map = null));
      markers.clear();
      listings.forEach((listing) => {
        const el = createPinElement(listing);
        const marker = new AdvancedMarkerElement({
          map, position: listing.position, content: el, title: listing.title,
          gmpClickable: true,
        });
        // 'gmp-click' is the current AdvancedMarkerElement event (addListener('click') is deprecated).
        marker.addEventListener('gmp-click', () => { open(listing.id); onMarkerClick?.(listing.id); });
        markers.set(listing.id, { marker, el, listing });
      });
    },
    setVisible(idSet) {
      markers.forEach((m, id) => {
        const show = idSet.has(id);
        if (show && !m.marker.map) m.marker.map = map;
        if (!show && m.marker.map) m.marker.map = null;
      });
      if (activeId && !idSet.has(activeId)) { info.close(); setActive(null); }
    },
    focus(id) {
      const m = markers.get(id);
      if (!m) return;
      map.panTo(m.listing.position);
      if (map.getZoom() < 13) map.setZoom(14);
      open(id);
    },
    centerOn(c, z) { map.panTo(c); if (z) map.setZoom(z); },
    fitTo(listings) {
      if (!listings.length) return;
      if (listings.length === 1) return this.centerOn(listings[0].position, 14);
      const b = new google.maps.LatLngBounds();
      listings.forEach((l) => b.extend(l.position));
      map.fitBounds(b, { top: 60, right: 60, bottom: 60, left: 60 });
    },
    closeInfo() { info.close(); setActive(null); },
  };
}
