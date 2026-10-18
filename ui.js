/** ui.js — sidebar controls, results list, stats, toasts, API key dialog. */
import { CONFIG, STATUS_STYLES, resolveApiKey } from './config.js';
import { SLIDER_STEPS, sliderToPrice, priceToSlider } from './filters.js';
import { formatPrice, formatMoney, escapeHtml } from './format.js';
import { typeIcon } from './markers.js';

const $ = (s) => document.querySelector(s);

export function initControls(filters, handlers) {
  /* Location */
  const loc = $('#location');
  loc.innerHTML = CONFIG.locations.map((l) => `<option value="${l.id}">${l.label}</option>`).join('');
  loc.value = filters.location;
  loc.addEventListener('change', () => handlers.onLocation(loc.value));
  $('#near-me').addEventListener('click', handlers.onNearMe);
  $('#fit').addEventListener('click', handlers.onFit);

  /* Price (dual log slider) */
  const minR = $('#price-min'), maxR = $('#price-max');
  [minR, maxR].forEach((r) => { r.min = 0; r.max = SLIDER_STEPS; r.step = 1; });
  minR.value = priceToSlider(filters.minPrice);
  maxR.value = priceToSlider(filters.maxPrice);
  const syncPrice = (src) => {
    let a = +minR.value, b = +maxR.value;
    if (a > b - 20) { if (src === minR) a = b - 20; else b = a + 20; }
    minR.value = a; maxR.value = b;
    filters.minPrice = sliderToPrice(a);
    filters.maxPrice = sliderToPrice(b);
    paintPrice(a, b, filters);
    handlers.onChange();
  };
  minR.addEventListener('input', () => syncPrice(minR));
  maxR.addEventListener('input', () => syncPrice(maxR));
  paintPrice(+minR.value, +maxR.value, filters);

  document.querySelectorAll('[data-preset]').forEach((btn) => btn.addEventListener('click', () => {
    const [lo, hi] = btn.dataset.preset.split('-').map(Number);
    minR.value = priceToSlider(Math.max(lo, CONFIG.price.min));
    maxR.value = priceToSlider(Math.min(hi, CONFIG.price.max));
    syncPrice(null);
  }));

  /* Property type chips */
  const types = $('#types');
  types.innerHTML = CONFIG.propertyTypes.map((t) => `
    <button type="button" class="chip is-on" aria-pressed="true" data-type="${t.id}">
      ${typeIcon(t.id, 14)}<span>${t.label}</span>
    </button>`).join('');
  types.addEventListener('click', (e) => {
    const b = e.target.closest('[data-type]');
    if (!b) return;
    toggleSet(filters.types, b.dataset.type, b);
    handlers.onChange();
  });

  /* Status toggles (doubles as marker legend) */
  const st = $('#statuses');
  st.innerHTML = Object.entries(STATUS_STYLES).map(([id, s]) => `
    <button type="button" class="status is-on" aria-pressed="true" data-status="${id}" style="--dot:${s.fill}">
      <span class="status__dot"></span><span>${s.label}</span><span class="status__n" data-count="${id}">0</span>
    </button>`).join('');
  st.addEventListener('click', (e) => {
    const b = e.target.closest('[data-status]');
    if (!b) return;
    toggleSet(filters.statuses, b.dataset.status, b);
    handlers.onChange();
  });

  $('#reset').addEventListener('click', () => {
    CONFIG.propertyTypes.forEach((t) => filters.types.add(t.id));
    Object.keys(STATUS_STYLES).forEach((s) => filters.statuses.add(s));
    document.querySelectorAll('.chip, .status').forEach((b) => { b.classList.add('is-on'); b.setAttribute('aria-pressed', 'true'); });
    minR.value = 0; maxR.value = SLIDER_STEPS; syncPrice(null);
  });

  initKeyDialog(handlers.onSaveKey);
}

function toggleSet(set, val, btn) {
  if (set.has(val)) set.delete(val); else set.add(val);
  const on = set.has(val);
  btn.classList.toggle('is-on', on);
  btn.setAttribute('aria-pressed', String(on));
}

function paintPrice(a, b, f) {
  const track = $('#price-track');
  track.style.setProperty('--a', `${(a / SLIDER_STEPS) * 100}%`);
  track.style.setProperty('--b', `${(b / SLIDER_STEPS) * 100}%`);
  $('#price-min-label').textContent = a <= 0 ? 'Any' : `SAR ${formatMoney(f.minPrice)}`;
  $('#price-max-label').textContent = b >= SLIDER_STEPS ? 'No max' : `SAR ${formatMoney(f.maxPrice)}`;
}

export function renderList(listings, { onSelect }) {
  const list = $('#list');
  list.innerHTML = listings.map((l) => {
    const s = STATUS_STYLES[l.status];
    return `
    <li>
      <button type="button" class="card ${l.status === 'sold' ? 'is-sold' : ''}" data-id="${l.id}">
        <span class="card__img"><img src="${escapeHtml(l.photo.replace('w=640', 'w=200'))}" alt="" loading="lazy"
          onerror="this.remove()"></span>
        <span class="card__body">
          <span class="card__top">
            <span class="card__price">${escapeHtml(formatPrice(l))}</span>
            <span class="tag" style="--tag:${s.fill}">${s.label}</span>
          </span>
          <span class="card__title">${escapeHtml(l.title)}</span>
          <span class="card__meta">${typeIcon(l.type, 12)} ${escapeHtml(l.address)}</span>
        </span>
      </button>
    </li>`;
  }).join('');
  list.onclick = (e) => {
    const c = e.target.closest('.card');
    if (c) onSelect(c.dataset.id);
  };
  $('#result-count').textContent = `${listings.length} ${listings.length === 1 ? 'result' : 'results'}`;
}

export function setActiveCard(id, { scroll = false } = {}) {
  document.querySelectorAll('.card.is-active').forEach((c) => c.classList.remove('is-active'));
  const card = document.querySelector(`.card[data-id="${CSS.escape(id)}"]`);
  if (card) {
    card.classList.add('is-active');
    if (scroll) card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

export function renderStats(filtered, total) {
  const by = { sale: [], rent: [], sold: [] };
  filtered.forEach((l) => by[l.status].push(l.price));
  $('#stat-shown').textContent = filtered.length;
  $('#stat-total').textContent = `of ${total}`;
  $('#stat-sale').textContent = by.sale.length ? `SAR ${formatMoney(median(by.sale))}` : '—';
  $('#stat-rent').textContent = by.rent.length ? `SAR ${formatMoney(median(by.rent))}` : '—';
  Object.keys(by).forEach((k) => {
    const n = document.querySelector(`[data-count="${k}"]`);
    if (n) n.textContent = by[k].length;
  });
}

function median(arr) {
  const a = [...arr].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

export function setProviderBadge(kind) {
  const b = $('#provider');
  b.dataset.kind = kind;
  b.querySelector('span').textContent = kind === 'google' ? 'Google Maps' : 'Demo mode';
}

let toastTimer;
export function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 4200);
}

function initKeyDialog(onSave) {
  const dlg = $('#key-dialog');
  const input = $('#key-input');
  const { key, source } = resolveApiKey();
  $('#key-btn').addEventListener('click', () => {
    input.value = source === 'url' ? key : '';
    $('#key-source').textContent = {
      env: 'A key is set in js/env.js. It takes priority over a saved key.',
      url: 'A key is being read from the ?key= URL parameter.',
      none: 'No key set. The map is running in Demo mode.',
    }[source];
    dlg.showModal();
  });
  $('#key-form').addEventListener('submit', (e) => {
    e.preventDefault();
    onSave(input.value.trim());
  });
  $('#key-clear').addEventListener('click', () => onSave(''));
  $('#key-cancel').addEventListener('click', () => dlg.close());
}
