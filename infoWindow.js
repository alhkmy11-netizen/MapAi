/** infoWindow.js — HTML template for the marker popup (used by both providers). */
import { STATUS_STYLES } from './config.js';
import { formatPrice, escapeHtml } from './format.js';

export function renderInfoContent(l) {
  const s = STATUS_STYLES[l.status];
  const facts = [
    l.bedrooms ? `${l.bedrooms} bd` : null,
    l.bathrooms ? `${l.bathrooms} ba` : null,
    l.areaSqm ? `${l.areaSqm.toLocaleString('en-US')} m²` : null,
  ].filter(Boolean).join(' · ');

  const node = document.createElement('article');
  node.className = 'iw';
  node.innerHTML = `
    <div class="iw__media">
      <img src="${escapeHtml(l.photo)}" alt="${escapeHtml(l.title)}" loading="lazy"
           onerror="this.closest('.iw__media').classList.add('is-broken'); this.remove();">
      <span class="iw__badge" style="--badge:${s.fill}">${s.label}</span>
    </div>
    <div class="iw__body">
      <p class="iw__price">${escapeHtml(formatPrice(l))}</p>
      <h3 class="iw__title">${escapeHtml(l.title)}</h3>
      <p class="iw__addr">${escapeHtml(l.address)}</p>
      ${facts ? `<p class="iw__facts">${facts}</p>` : ''}
      <p class="iw__id">Listing ${escapeHtml(l.id)} · ${escapeHtml(l.type)}</p>
    </div>`;
  return node;
}
