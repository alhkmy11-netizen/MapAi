# Manzil Map — Real Estate Listings Dashboard

A modular, dependency-free (vanilla ES modules) dashboard that plots property listings from a
GeoJSON file on Google Maps, with price/type/status filters, info windows, and location centering.
Runs in **Demo mode** (Leaflet + OpenStreetMap) when no Google key is configured, using the same modules.

## Structure

```
index.html                 Layout + dialog markup; loads env.js then app.js
css/styles.css             Design tokens, panel, marker (.pin) and info-window styles
data/properties.geojson    Listing data (FeatureCollection of Points, [lng, lat])
js/
  env.example.js           Template for API key injection → copy to env.js (git-ignore it)
  config.js                CONFIG (locations, types, price bounds), STATUS_STYLES, key resolution
  data.js                  Fetch + validate GeoJSON → flat listing objects
  filters.js               Filter state, pure predicate, log-scale price slider math
  markers.js               Custom DOM pin per listing (status colors, type icon, compact price)
  infoWindow.js            Info window HTML (photo, price, address, facts)
  ui.js                    Sidebar controls, results list, stats, toast, key dialog
  app.js                   Orchestration: data → filters → map adapter → UI
  providers/
    googleMaps.js          Google Maps JS API adapter (async bootstrap, AdvancedMarkerElement)
    leaflet.js             Demo adapter implementing the same contract
```

### Map adapter contract
Both providers return `{ setListings, setVisible, focus, centerOn, fitTo, closeInfo }`, so you can add
another provider (Mapbox, MapLibre) without touching filters or UI.

## API key handling

Resolution order in `config.js → resolveApiKey()`:
1. `window.APP_ENV.GOOGLE_MAPS_API_KEY` from `js/env.js` (recommended for deployments)
2. `?key=...` URL parameter (quick testing)
The in-app **Map key** dialog applies a key by reloading with `?key=` (no browser storage).

If Google rejects the key (`gm_authFailure`), the app switches to Demo mode automatically.

Browser keys are always public. In Google Cloud Console → Credentials, restrict the key to
**HTTP referrers** (your domains) and to the **Maps JavaScript API**. For production styling,
create a Map ID (Map Management) and set `GOOGLE_MAPS_MAP_ID`; `DEMO_MAP_ID` works for development.

CI example:
```bash
echo "window.APP_ENV={GOOGLE_MAPS_API_KEY:'$GMAPS_KEY',GOOGLE_MAPS_MAP_ID:'$GMAPS_MAP_ID'}" > js/env.js
```

## GeoJSON schema

```json
{
  "type": "Feature",
  "id": "SA-1001",
  "geometry": { "type": "Point", "coordinates": [39.1095, 21.5905] },
  "properties": {
    "title": "Sea-view villa with private pool",
    "type": "villa",            // villa | apartment | townhouse | office | land
    "status": "sale",           // sale | rent | sold  → drives marker style
    "price": 6850000, "currency": "SAR", "pricePeriod": null,   // "year" for rentals
    "bedrooms": 6, "bathrooms": 7, "areaSqm": 620,
    "address": "Al Shati, Jeddah", "city": "Jeddah",
    "photo": "https://..."
  }
}
```
Features with missing coordinates or unknown status are dropped during validation.

## Customising marker styles
Edit `STATUS_STYLES` in `config.js` (fill / stroke / text colors, label). Shape and states
(`.pin`, `.pin--sold`, `.pin.is-active`) live in `css/styles.css`. Sold pins show a struck-through price.

## Run locally
ES modules and `fetch` need an HTTP server:
```bash
npx serve .        # or: python3 -m http.server 8080
```
