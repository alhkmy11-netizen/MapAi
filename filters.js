/**
 * filters.js — filter state + pure predicate. No DOM or map code here,
 * so it is easy to unit test or move server-side.
 */
import { CONFIG } from './config.js';

export function createFilterState() {
  return {
    minPrice: CONFIG.price.min,
    maxPrice: CONFIG.price.max,
    types: new Set(CONFIG.propertyTypes.map((t) => t.id)),
    statuses: new Set(['sale', 'rent', 'sold']),
    location: CONFIG.defaultLocation || 'all',
  };
}

export function matches(listing, f) {
  if (!f.types.has(listing.type)) return false;
  if (!f.statuses.has(listing.status)) return false;
  // Edge handles: min at floor / max at ceiling mean "no limit".
  if (f.minPrice > CONFIG.price.min && listing.price < f.minPrice) return false;
  if (f.maxPrice < CONFIG.price.max && listing.price > f.maxPrice) return false;
  return true;
}

export function applyFilters(listings, f) {
  return listings.filter((l) => matches(l, f));
}

/* Logarithmic slider mapping: slider 0..1000 ⇄ price min..max */
const STEPS = 1000;
export const SLIDER_STEPS = STEPS;

export function sliderToPrice(v) {
  const { min, max } = CONFIG.price;
  const p = Math.exp(Math.log(min) + (Math.log(max) - Math.log(min)) * (v / STEPS));
  return niceRound(p);
}

export function priceToSlider(p) {
  const { min, max } = CONFIG.price;
  return Math.round(((Math.log(p) - Math.log(min)) / (Math.log(max) - Math.log(min))) * STEPS);
}

function niceRound(p) {
  const mag = Math.pow(10, Math.floor(Math.log10(p)) - 1);
  return Math.round(p / mag) * mag;
}
