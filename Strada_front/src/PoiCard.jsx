import { useState, useEffect } from 'react';
import { X, MapPin, Plus, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { makeGlassStyle, getTheme, GRAIN_SVG } from './theme.js';

const formatCategory = (cat) => !cat ? '' : cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const findFavorite = (poi, favorites) => {
  return favorites.find(f =>
    Math.abs(f.latitude  - poi.coordinates.lat) < 0.0001 &&
    Math.abs(f.longitude - poi.coordinates.lng) < 0.0001
  );
};

const NO_PHOTO_CATEGORIES = ['address', 'street', 'road', 'postcode', 'place', 'region', 'country', 'district'];

// Cache sessionStorage
const CACHE_KEY = 'strada_photo_cache';
const memCache = new Map(
  Object.entries(JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}'))
);
const saveCache = () => {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(memCache))); } catch { /* quota */ }
};

const PRICE_MAP = {
  PRICE_LEVEL_FREE: 'Gratuit',
  PRICE_LEVEL_INEXPENSIVE: '€',
  PRICE_LEVEL_MODERATE: '€€',
  PRICE_LEVEL_EXPENSIVE: '€€€',
  PRICE_LEVEL_VERY_EXPENSIVE: '€€€€',
};

// Retourne les horaires du jour courant (ex: "9:00 – 18:00") ou null
function getTodayHours(openingHours) {
  if (!openingHours?.weekdayDescriptions?.length) return null;
  // Google: lundi=0 … dimanche=6, JS: dimanche=0 … samedi=6
  const jsDay = new Date().getDay();
  const googleDay = jsDay === 0 ? 6 : jsDay - 1;
  const line = openingHours.weekdayDescriptions[googleDay] || '';
  // "Lundi: 9:00 – 18:00" → "9:00 – 18:00"
  const parts = line.split(': ');
  return parts.length > 1 ? parts.slice(1).join(': ') : null;
}

// 1 seul appel → photos + infos pratiques
async function fetchPlaceData(name, lat, lng) {
  const key = import.meta.env.VITE_GOOGLE_PLACES_KEY;
  if (!key) return { photos: [], info: null };

  const cacheKey = `${name}|${lat.toFixed(4)}|${lng.toFixed(4)}`;
  if (memCache.has(cacheKey)) return memCache.get(cacheKey) || { photos: [], info: null };

  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'places.photos,places.rating,places.userRatingCount,places.priceLevel,places.regularOpeningHours,places.formattedAddress',
      },
      body: JSON.stringify({
        textQuery: name,
        maxResultCount: 1,
        locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: 500 } },
      }),
    });
    if (!res.ok) { memCache.set(cacheKey, { photos: [], info: null }); saveCache(); return { photos: [], info: null }; }
    const data = await res.json();
    const place = data?.places?.[0];
    if (!place) { memCache.set(cacheKey, { photos: [], info: null }); saveCache(); return { photos: [], info: null }; }

    // Infos pratiques
    const info = {
      address:   place.formattedAddress ?? null,
      rating:    place.rating ?? null,
      ratingCount: place.userRatingCount ?? null,
      price:     PRICE_MAP[place.priceLevel] ?? null,
      openNow:   place.regularOpeningHours?.openNow ?? null,
      todayHours: getTodayHours(place.regularOpeningHours),
    };

    // Résoudre les URLs photos en parallèle (max 4 requêtes)
    const photoRefs = (place.photos || []).slice(0, 4);
    const urls = await Promise.all(
      photoRefs.map(async (photo) => {
        try {
          const r = await fetch(`https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=560&skipHttpRedirect=true&key=${key}`);
          if (!r.ok) return null;
          const d = await r.json();
          return d?.photoUri ?? null;
        } catch { return null; }
      })
    );

    const result = { photos: urls.filter(Boolean), info };
    memCache.set(cacheKey, result);
    saveCache();
    return result;
  } catch {
    const empty = { photos: [], info: null };
    memCache.set(cacheKey, empty);
    saveCache();
    return empty;
  }
}

function PoiCard({ poi, onClose, onAddToTrip, onAddToFavorites, onRemoveFromFavorites, favorites = [], searchOpen, settings = {} }) {
  const [starKey, setStarKey]       = useState(0);
  const [photos, setPhotos]         = useState([]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [placeInfo, setPlaceInfo]   = useState(null);

  const glassStyle = makeGlassStyle(settings.sidebarColor);
  const t          = getTheme(settings.sidebarColor);
  const grain      = settings.sidebarGrain ?? 0.06;

  useEffect(() => {
    if (!poi) return;
    const cat = poi.category || '';
    const skip = NO_PHOTO_CATEGORIES.some(c => cat.toLowerCase().includes(c));
    if (skip || !poi.name) { setPhotos([]); setPhotoIndex(0); return; }

    setPhotos([]);
    setPhotoIndex(0);
    setPlaceInfo(null);
    setPhotoLoading(true);
    fetchPlaceData(poi.name, poi.coordinates.lat, poi.coordinates.lng)
      .then(({ photos: urls, info }) => { setPhotos(urls); setPlaceInfo(info); })
      .finally(() => setPhotoLoading(false));
  }, [poi?.name, poi?.coordinates?.lat, poi?.coordinates?.lng]);

  if (!poi) return null;

  const existingFav = findFavorite(poi, favorites);
  const isFavorited = !!existingFav;

  const handleFavoriteClick = async () => {
    setStarKey(k => k + 1);
    if (isFavorited) await onRemoveFromFavorites?.(existingFav.id);
    else await onAddToFavorites?.(poi);
  };

  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
  const satelliteUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${poi.coordinates.lng},${poi.coordinates.lat},15,0/560x240?access_token=${mapboxToken}`;

  const currentPhoto = photos[photoIndex] || null;
  const showPhoto = photoLoading || currentPhoto;
  const hasMultiple = photos.length > 1;

  const prev = (e) => { e.stopPropagation(); setPhotoIndex(i => (i - 1 + photos.length) % photos.length); };
  const next = (e) => { e.stopPropagation(); setPhotoIndex(i => (i + 1) % photos.length); };

  return (
    <div
      className={`fixed top-4 w-72 z-[48] rounded-2xl overflow-hidden fade-up ${
        searchOpen ? 'left-[232px]' : 'right-4'
      }`}
      style={{ ...glassStyle, transition: 'left 200ms cubic-bezier(0.16,1,0.3,1), right 200ms cubic-bezier(0.16,1,0.3,1)' }}
    >
      {/* Grain */}
      {grain > 0 && (
        <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{
          backgroundImage: GRAIN_SVG, backgroundRepeat: 'repeat', backgroundSize: '256px 256px',
          opacity: grain, mixBlendMode: t.dark ? 'screen' : 'multiply', zIndex: 0,
        }} />
      )}

      <div className="relative z-10">

        {/* ── Photo ── */}
        {showPhoto && (
          <div className="relative w-full overflow-hidden" style={{ height: 140 }}>
            {photoLoading && (
              <div className="absolute inset-0 animate-pulse" style={{ background: t.inputBg }} />
            )}
            {currentPhoto && (
              <img
                key={currentPhoto}
                src={currentPhoto}
                alt={poi.name}
                className="w-full h-full object-cover"
                style={{ opacity: photoLoading ? 0 : 1, transition: 'opacity 250ms ease-out' }}
                onLoad={() => setPhotoLoading(false)}
                onError={(e) => { e.currentTarget.src = satelliteUrl; }}
              />
            )}

            {/* Gradient bas */}
            <div className="absolute bottom-0 left-0 right-0 h-12"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.40), transparent)' }} />

            {/* Flèches navigation */}
            {hasMultiple && (
              <>
                <button
                  onClick={prev}
                  className="btn-press absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center cursor-default focus:outline-none"
                  style={{ background: 'rgba(0,0,0,0.45)', color: 'white', backdropFilter: 'blur(6px)', transition: 'background 150ms ease-out, transform 160ms cubic-bezier(0.16,1,0.3,1), opacity 160ms ease-out' }}
                  onMouseEnter={e => { if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) e.currentTarget.style.background = 'rgba(0,0,0,0.65)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.45)'; }}
                >
                  <ChevronLeft style={{ width: 13, height: 13 }} />
                </button>
                <button
                  onClick={next}
                  className="btn-press absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center cursor-default focus:outline-none"
                  style={{ background: 'rgba(0,0,0,0.45)', color: 'white', backdropFilter: 'blur(6px)', transition: 'background 150ms ease-out, transform 160ms cubic-bezier(0.16,1,0.3,1), opacity 160ms ease-out' }}
                  onMouseEnter={e => { if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) e.currentTarget.style.background = 'rgba(0,0,0,0.65)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.45)'; }}
                >
                  <ChevronRight style={{ width: 13, height: 13 }} />
                </button>

                {/* Dots */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {photos.map((_, i) => (
                    <div key={i} style={{
                      width: i === photoIndex ? 14 : 5, height: 5,
                      borderRadius: 3,
                      background: 'white',
                      opacity: i === photoIndex ? 1 : 0.45,
                      transition: 'width 200ms cubic-bezier(0.16,1,0.3,1), opacity 200ms ease-out',
                    }} />
                  ))}
                </div>
              </>
            )}

            {/* Bouton close */}
            <button
              onClick={onClose}
              className="btn-press absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center cursor-default focus:outline-none"
              style={{ background: 'rgba(0,0,0,0.40)', color: 'white', backdropFilter: 'blur(8px)', transition: 'background 150ms ease-out, transform 160ms cubic-bezier(0.16,1,0.3,1), opacity 160ms ease-out' }}
              onMouseEnter={e => { if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) e.currentTarget.style.background = 'rgba(0,0,0,0.60)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.40)'; }}
            >
              <X style={{ width: 13, height: 13 }} />
            </button>
          </div>
        )}

        {/* ── Header ── */}
        <div className="flex items-start justify-between px-4 pt-3 pb-2">
          <div className="min-w-0 flex-1 pr-2">
            <h2 className="text-sm font-semibold leading-tight" style={{ color: t.textPrimary }}>{poi.name}</h2>
            {poi.category && (
              <span className="inline-block mt-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full"
                style={{ color: t.textSecondary, background: t.inputBg }}>
                {formatCategory(poi.category)}
              </span>
            )}
          </div>
          {!showPhoto && (
            <button onClick={onClose}
              className="btn-press w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 cursor-default focus:outline-none"
              style={{ color: t.closeBtnColor, background: t.closeBtnBg, transition: 'background 150ms ease-out, transform 160ms cubic-bezier(0.16,1,0.3,1), opacity 160ms ease-out' }}
              onMouseEnter={e => { if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) e.currentTarget.style.background = 'rgba(0,0,0,0.09)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = t.closeBtnBg; }}
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>

        <div style={{ height: 1, background: t.divider, margin: '0 16px' }} />

        {/* ── Info pratiques ── */}
        <div className="px-4 py-2.5 flex flex-col gap-1.5">

          {/* Adresse */}
          {placeInfo?.address ? (
            <div className="flex items-start gap-2">
              <MapPin style={{ width: 11, height: 11, flexShrink: 0, marginTop: 1, color: t.textTertiary }} />
              <span className="text-[11px] leading-snug" style={{ color: t.textSecondary }}>{placeInfo.address}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <MapPin style={{ width: 11, height: 11, flexShrink: 0, color: t.textTertiary }} />
              <span className="text-[11px] tabular-nums" style={{ color: t.textSecondary }}>
                {poi.coordinates.lat.toFixed(5)}, {poi.coordinates.lng.toFixed(5)}
              </span>
            </div>
          )}

          {/* Note + Prix */}
          {(placeInfo?.rating || placeInfo?.price) && (
            <div className="flex items-center gap-3">
              {placeInfo.rating && (
                <div className="flex items-center gap-1">
                  <Star style={{ width: 10, height: 10, fill: '#ff9500', color: '#ff9500' }} />
                  <span className="text-[11px] font-medium tabular-nums" style={{ color: t.textPrimary }}>{placeInfo.rating.toFixed(1)}</span>
                  {placeInfo.ratingCount && (
                    <span className="text-[10px]" style={{ color: t.textTertiary }}>({placeInfo.ratingCount.toLocaleString()})</span>
                  )}
                </div>
              )}
              {placeInfo.price && (
                <span className="text-[11px] font-medium" style={{ color: t.textSecondary }}>{placeInfo.price}</span>
              )}
            </div>
          )}

          {/* Horaires */}
          {placeInfo?.todayHours && (
            <div className="flex items-center gap-2">
              <div style={{
                width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                background: placeInfo.openNow === true ? '#34c759' : placeInfo.openNow === false ? '#ff3b30' : t.textTertiary,
              }} />
              <span className="text-[11px]" style={{ color: t.textSecondary }}>{placeInfo.todayHours}</span>
            </div>
          )}

        </div>

        <div style={{ height: 1, background: t.divider, margin: '0 16px' }} />

        {/* ── Actions ── */}
        <div className="flex gap-2 px-4 py-3">
          <button onClick={handleFavoriteClick}
            className="btn-press flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-xl cursor-default focus:outline-none"
            style={{
              color: isFavorited ? '#ff9500' : t.textSecondary,
              background: isFavorited ? 'rgba(255,149,0,0.12)' : t.inputBg,
              border: `1px solid ${isFavorited ? 'rgba(255,149,0,0.30)' : t.divider}`,
              transition: 'background 200ms ease-out, color 200ms ease-out, border-color 200ms ease-out, transform 160ms cubic-bezier(0.16,1,0.3,1), opacity 160ms ease-out',
            }}
          >
            <Star key={starKey}
              className={starKey > 0 ? (isFavorited ? 'star-pop' : 'star-burst') : ''}
              style={{ width: 12, height: 12, fill: isFavorited ? '#ff9500' : 'none', color: isFavorited ? '#ff9500' : 'currentColor', transition: 'fill 200ms ease-out, color 200ms ease-out' }}
            />
            {isFavorited ? 'Sauvegardé' : 'Favori'}
          </button>

          <button onClick={() => onAddToTrip(poi)}
            className="btn-press flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-white rounded-xl cursor-default focus:outline-none"
            style={{ background: '#1c1c1e', border: '1px solid #1c1c1e', transition: 'background 150ms ease-out, transform 160ms cubic-bezier(0.16,1,0.3,1), opacity 160ms ease-out' }}
            onMouseEnter={e => { if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) e.currentTarget.style.background = '#3a3a3c'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#1c1c1e'; }}
          >
            <Plus style={{ width: 12, height: 12 }} />
            Voyage
          </button>
        </div>

      </div>
    </div>
  );
}

export default PoiCard;
