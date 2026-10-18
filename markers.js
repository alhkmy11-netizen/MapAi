/**
 * markers.js — provider-agnostic custom marker element.
 * Both Google AdvancedMarkerElement and Leaflet divIcon render this same DOM node,
 * so status styling is defined once (STATUS_STYLES in config.js + .pin CSS).
 */
import { STATUS_STYLES } from './config.js';
import { formatPrice } from './format.js';

const TYPE_ICONS = {
  villa:     '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
  apartment: '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>',
  townhouse: '<path d="M2 20V10l5-4 5 4v10"/><path d="M12 20V10l5-4 5 4v10"/><path d="M2 20h20"/>',
  office:    '<rect x="3" y="7" width="18" height="13" rx="1"/><path d="M8 7V4h8v3"/><path d="M3 12h18"/>',
  land:      '<path d="M3 20h18"/><path d="M5 20l4-8 3 4 3-6 4 10"/>',
};

export function typeIcon(type, size = 14) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TYPE_ICONS[type] || TYPE_ICONS.villa}</svg>`;
}

/** Build the pin DOM node for a listing. */
export function createPinElement(listing) {
  const style = STATUS_STYLES[listing.status];
  const el = document.createElement('div');
  el.className = `pin pin--${listing.status}`;
  el.style.setProperty('--pin-fill', style.fill);
  el.style.setProperty('--pin-stroke', style.stroke);
  el.style.setProperty('--pin-text', style.text);
  el.dataset.id = listing.id;
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', `${listing.title}, ${style.label}, ${formatPrice(listing)}`);
  el.innerHTML = `
    <span class="pin__body">
      ${typeIcon(listing.type, 13)}
      <span class="pin__price">${formatPrice(listing, { compact: true })}</span>
    </span>
    <span class="pin__tail"></span>`;
  return el;
}

export function setPinActive(el, active) {
  el.classList.toggle('is-active', active);
}
