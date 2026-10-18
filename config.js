/**
 * config.js — الإعدادات المركزية + تحديد مفتاح الخريطة
 * منصة حكيم (الكروكي الذكي)
 */

const ENV = (typeof window !== 'undefined' && window.APP_ENV) || {};
const KEY_STORAGE = 'hakeem_maps_key';

export const CONFIG = Object.freeze({
  dataUrl: './data/properties.geojson',

  // Map ID للخريطة المتقدمة (DEMO_MAP_ID لا يدعم تنسيق السحابة)
  mapId: ENV.GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID',

  language: 'ar',
  region: 'SA',

  defaultLocation: 'jeddah',
  defaultCenter: { lat: 21.59, lng: 39.16 },
  defaultZoom: 11,

  locations: [
    { id: 'all',     label: 'كل المملكة',        labelEn: 'All of Saudi Arabia', center: { lat: 23.8859, lng: 45.0792 }, zoom: 5 },
    { id: 'jeddah',  label: 'جدة',               labelEn: 'Jeddah',              center: { lat: 21.59,   lng: 39.16 },   zoom: 11 },
    { id: 'makkah',  label: 'مكة المكرمة',       labelEn: 'Makkah',              center: { lat: 21.39,   lng: 39.85 },   zoom: 12 },
    { id: 'madinah', label: 'المدينة المنورة',   labelEn: 'Madinah',             center: { lat: 24.4672, lng: 39.6112 }, zoom: 12 },
    { id: 'riyadh',  label: 'الرياض',            labelEn: 'Riyadh',              center: { lat: 24.76,   lng: 46.645 },  zoom: 11 },
    { id: 'eastern', label: 'الدمام والخبر',     labelEn: 'Dammam & Al Khobar',  center: { lat: 26.37,   lng: 50.15 },   zoom: 11 },
  ],

  propertyTypes: [
    { id: 'villa',     label: 'فيلا',     labelEn: 'Villa' },
    { id: 'apartment', label: 'شقة',      labelEn: 'Apartment' },
    { id: 'townhouse', label: 'تاون هاوس', labelEn: 'Townhouse' },
    { id: 'office',    label: 'مكتب',     labelEn: 'Office' },
    { id: 'land',      label: 'أرض',      labelEn: 'Land' },
  ],

  // من 20 ألف إلى 10 مليون ريال
  price: { min: 20_000, max: 10_000_000, step: 10_000, currency: 'SAR' },
});

/** ألوان الدبابيس — الهوية الذهبية */
export const STATUS_STYLES = Object.freeze({
  sale: { label: 'للبيع',   labelEn: 'For sale', fill: '#d4af37', stroke: '#161616', text: '#0c0c0c' },
  rent: { label: 'للإيجار', labelEn: 'For rent', fill: '#c9a227', stroke: '#161616', text: '#0c0c0c' },
  sold: { label: 'مباع',    labelEn: 'Sold',     fill: '#555555', stroke: '#161616', text: '#ffffff', faded: true },
});

/** أدوات مساعدة */
export const getLocation = (id) =>
  CONFIG.locations.find((l) => l.id === id) || CONFIG.locations.find((l) => l.id === CONFIG.defaultLocation);

export const formatPrice = (n) =>
  new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: CONFIG.price.currency,
    maximumFractionDigits: 0,
  }).format(n);

/** صيغة مفاتيح جوجل: تبدأ بـ AIza + 35 حرفاً */
const isValidKey = (k) => typeof k === 'string' && /^AIza[0-9A-Za-z_-]{35}$/.test(k.trim());

const safeStorage = {
  get: () => { try { return sessionStorage.getItem(KEY_STORAGE); } catch { return null; } },
  set: (v) => { try { sessionStorage.setItem(KEY_STORAGE, v); } catch {} },
  del: () => { try { sessionStorage.removeItem(KEY_STORAGE); } catch {} },
};

/**
 * الأولوية: البيئة ← الرابط ← التخزين المؤقت للجلسة.
 * مفتاح الرابط يُحفظ في الجلسة ويُحذف من الشريط فوراً (لا يبقى في السجل أو المشاركة).
 */
export function resolveApiKey() {
  if (isValidKey(ENV.GOOGLE_MAPS_API_KEY)) return { key: ENV.GOOGLE_MAPS_API_KEY.trim(), source: 'env' };

  const url = new URL(location.href);
  const fromUrl = url.searchParams.get('key');
  if (fromUrl) {
    url.searchParams.delete('key');
    history.replaceState(null, '', url.toString());
    if (isValidKey(fromUrl)) {
      safeStorage.set(fromUrl.trim());
      return { key: fromUrl.trim(), source: 'url' };
    }
    return { key: null, source: 'invalid' };
  }

  const stored = safeStorage.get();
  if (isValidKey(stored)) return { key: stored, source: 'session' };

  return { key: null, source: 'none' };
}

/** حفظ/مسح المفتاح ثم إعادة التحميل */
export function applyApiKey(key) {
  if (key && isValidKey(key)) safeStorage.set(key.trim());
  else safeStorage.del();
  location.reload();
}
