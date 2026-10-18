/** format.js — small formatting helpers shared by UI modules. */

const nf = new Intl.NumberFormat('en-US');

export function formatPrice(listing, { compact = false } = {}) {
  const p = listing.price;
  let v;
  if (compact) {
    if (p >= 1e6) v = (p / 1e6).toFixed(p >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M';
    else if (p >= 1e3) v = Math.round(p / 1e3) + 'K';
    else v = String(p);
  } else {
    v = nf.format(p);
  }
  const period = listing.pricePeriod === 'year' ? (compact ? '/yr' : ' / year') : '';
  return `${compact ? '' : (listing.currency || 'SAR') + ' '}${v}${period}`;
}

export function formatMoney(value) {
  if (value >= 1e6) return (value / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (value >= 1e3) return Math.round(value / 1e3) + 'K';
  return String(Math.round(value));
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
