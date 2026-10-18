/**
 * providers/leaflet.js — Demo-mode adapter (no API key needed).
 * Implements the same contract as googleMaps.js so the rest of the app is unchanged.
 */
import { createPinElement, setPinActive } from '../markers.js';
import { renderInfoContent } from '../infoWindow.js';

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  return new Promise((resolve, reject) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload = () => resolve(window.L);
    s.onerror = () => reject(new Error('Could not load Leaflet'));
    document.head.appendChild(s);
  });
}

export async function createLeafletMap(container, { center, zoom, onMarkerClick }) {
  const L = await loadLeaflet();
  const map = L.map(container, { zoomControl: false, attributionControl: true })
    .setView([center.lat, center.lng], zoom);
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  const markers = new Map(); // id -> { marker, el, listing }
  let activeId = null;
  const popup = L.popup({ maxWidth: 300, minWidth: 260, offset: [0, -34], className: 'iw-leaflet', autoPanPadding: [40, 40] });
  popup.on('remove', () => setActive(null));

  function setActive(id) {
    if (activeId && markers.has(activeId)) setPinActive(markers.get(activeId).el, false);
    activeId = id;
    if (id && markers.has(id)) setPinActive(markers.get(id).el, true);
  }

  function open(id) {
    const m = markers.get(id);
    if (!m) return;
    popup.setLatLng(m.marker.getLatLng()).setContent(renderInfoContent(m.listing)).openOn(map);
    setActive(id);
  }

  return {
    provider: 'leaflet',
    setListings(listings) {
      markers.forEach(({ marker }) => marker.remove());
      markers.clear();
      listings.forEach((listing) => {
        const el = createPinElement(listing);
        const icon = L.divIcon({ html: el, className: 'pin-host', iconSize: [0, 0], iconAnchor: [0, 0] });
        const marker = L.marker([listing.position.lat, listing.position.lng], { icon, title: listing.title, riseOnHover: true })
          .addTo(map);
        marker.on('click', () => { open(listing.id); onMarkerClick?.(listing.id); });
        markers.set(listing.id, { marker, el, listing });
      });
    },
    setVisible(idSet) {
      markers.forEach((m, id) => {
        const on = map.hasLayer(m.marker);
        if (idSet.has(id) && !on) m.marker.addTo(map);
        if (!idSet.has(id) && on) m.marker.remove();
      });
      if (activeId && !idSet.has(activeId)) map.closePopup();
    },
    focus(id) {
      const m = markers.get(id);
      if (!m) return;
      map.flyTo(m.marker.getLatLng(), Math.max(map.getZoom(), 14), { duration: 0.6 });
      map.once('moveend', () => open(id));
    },
    centerOn(c, z) { map.flyTo([c.lat, c.lng], z || map.getZoom(), { duration: 0.7 }); },
    fitTo(listings) {
      if (!listings.length) return;
      if (listings.length === 1) return this.centerOn(listings[0].position, 14);
      map.flyToBounds(listings.map((l) => [l.position.lat, l.position.lng]), { padding: [60, 60], duration: 0.7 });
    },
    closeInfo() { map.closePopup(); },
  };
}
