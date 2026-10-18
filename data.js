/**
 * data.js — loads and validates the GeoJSON FeatureCollection.
 *
 * Expected shape (RFC 7946, coordinates are [lng, lat]):
 * {
 *   "type": "FeatureCollection",
 *   "features": [{
 *     "type": "Feature",
 *     "id": "SA-1001",
 *     "geometry": { "type": "Point", "coordinates": [39.1095, 21.5905] },
 *     "properties": {
 *       "title": "Sea-view villa", "type": "villa", "status": "sale",
 *       "price": 6850000, "currency": "SAR", "pricePeriod": null | "year",
 *       "bedrooms": 6, "bathrooms": 7, "areaSqm": 620,
 *       "address": "Al Shati, Jeddah", "city": "Jeddah", "photo": "https://..."
 *     }
 *   }]
 * }
 */

const VALID_STATUS = new Set(['sale', 'rent', 'sold']);

export async function loadProperties(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Could not load listings (${res.status})`);
  const geojson = await res.json();
  if (geojson.type !== 'FeatureCollection' || !Array.isArray(geojson.features)) {
    throw new Error('Listings file is not a GeoJSON FeatureCollection');
  }
  return geojson.features.filter(isValidFeature).map(toListing);
}

function isValidFeature(f) {
  const c = f?.geometry?.coordinates;
  return f?.geometry?.type === 'Point' && Array.isArray(c) &&
    Number.isFinite(c[0]) && Number.isFinite(c[1]) &&
    VALID_STATUS.has(f.properties?.status);
}

/** Flatten a Feature into the internal listing object used by every module. */
function toListing(f) {
  const [lng, lat] = f.geometry.coordinates;
  return { id: String(f.id), position: { lat, lng }, ...f.properties };
}
