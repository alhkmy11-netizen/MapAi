/**
 * env.example.js — copy to env.js and fill in your values. env.js is git-ignored.
 * index.html loads env.js before the app, so the key never lives in source modules.
 *
 * In CI/CD you can generate this file from a secret, e.g.:
 *   echo "window.APP_ENV={GOOGLE_MAPS_API_KEY:'$GMAPS_KEY'}" > js/env.js
 */
window.APP_ENV = {
  GOOGLE_MAPS_API_KEY: '',          // e.g. 'AIzaSy...'
  GOOGLE_MAPS_MAP_ID: 'DEMO_MAP_ID', // your Map ID from Cloud Console → Map Management
};
