import { useRef, forwardRef, useImperativeHandle, useState } from 'react';
import Map, { Layer, Source, Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getDayColor } from './constants.js';

// ── Nearby marker categories ──────────────────────────────────
// `icon` = paths only (no <svg> wrapper) — rendered inside a nested viewBox="0 0 24 24"
const NEARBY_CATEGORIES = [
  {
    types: ['restaurant', 'bakery', 'cafe', 'bar', 'coffee_shop'],
    color: '#FF6B35',
    icon: <>
      <path d="M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589 5 5 0 0 0-9.186 0 4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 0 0 1 1Z"/>
      <path d="M6 17h12"/>
    </>,
  },
  {
    types: ['museum', 'art_gallery', 'tourist_attraction'],
    color: '#5856d6',
    icon: <>
      <path d="M10 18v-7"/>
      <path d="M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z"/>
      <path d="M14 18v-7"/><path d="M18 18v-7"/>
      <path d="M3 22h18"/><path d="M6 18v-7"/>
    </>,
  },
  {
    types: ['park', 'amusement_park', 'zoo', 'aquarium'],
    color: '#34c759',
    icon: <>
      <path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/>
      <path d="M7 16v6"/>
      <path d="M13 19v3"/>
      <path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5"/>
    </>,
  },
  {
    types: ['night_club', 'movie_theater', 'bowling_alley'],
    color: '#FF2D55',
    icon: <>
      <path d="m12.296 3.464 3.02 3.956"/>
      <path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3z"/>
      <path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <path d="m6.18 5.276 3.1 3.899"/>
    </>,
  },
  {
    types: ['spa', 'shopping_mall', 'book_store', 'clothing_store'],
    color: '#30b0c7',
    icon: <>
      <path d="M16 10a4 4 0 0 1-8 0"/>
      <path d="M3.103 6.034h17.794"/>
      <path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"/>
    </>,
  },
  {
    types: ['church', 'mosque', 'synagogue', 'hindu_temple', 'library', 'stadium'],
    color: '#8e8e93',
    icon: <>
      <path d="M12 7v14"/>
      <path d="M16 12h2"/><path d="M16 8h2"/>
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>
      <path d="M6 12h2"/><path d="M6 8h2"/>
    </>,
  },
];

const DEFAULT_NEARBY = { color: '#ff9500', icon: <circle cx="14" cy="14" r="4" fill="white"/> };

function getNearbyStyle(types = []) {
  for (const cat of NEARBY_CATEGORIES) {
    if (cat.types.some(t => types.includes(t))) return cat;
  }
  return DEFAULT_NEARBY;
}

const MapComponent = forwardRef(({ onPoiClick, routeGeojson, multiDayRoutes, markers, tripMarkers, onTripMarkerClick, nearbyMarkers, nearbyExiting, onNearbyMarkerClick, mapStyle, defaultZoom, defaultLng, defaultLat }, ref) => {
  const mapRef = useRef();
  const [isLoaded, setIsLoaded] = useState(false);

  useImperativeHandle(ref, () => ({
    flyTo: (options) => mapRef.current?.flyTo(options),
    fitBounds: (bounds, options) => mapRef.current?.fitBounds(bounds, options),
  }));

  const handleMapLoad = () => setIsLoaded(true);

  const handleMapClick = (event) => {
    if (!isLoaded) return;
    const map = mapRef.current?.getMap();
    if (!map) return;
    const features = map.queryRenderedFeatures(event.point);
    if (!features.length) return;
    const namedFeature = features.find(f =>
      f.properties && (f.properties.name || f.properties.name_en)
    );
    if (!namedFeature) return;
    const name = namedFeature.properties.name || namedFeature.properties.name_en;
    if (!name?.trim()) return;
    onPoiClick?.({
      name,
      category: namedFeature.properties.class || namedFeature.properties.type || namedFeature.properties.maki || 'Lieu',
      coordinates: { lng: event.lngLat.lng, lat: event.lngLat.lat },
      properties: namedFeature.properties,
    });
  };

  const hasMultiRoutes = Object.keys(multiDayRoutes || {}).length > 0;

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
      style={{ position: 'absolute', inset: 0 }}
      mapStyle={`mapbox://styles/mapbox/${mapStyle || 'streets-v12'}`}
      initialViewState={{ longitude: defaultLng || 2.3522, latitude: defaultLat || 48.8566, zoom: defaultZoom || 10 }}
      onLoad={handleMapLoad}
      onClick={handleMapClick}
      cursor="pointer"
    >
      {/* Route jour unique */}
      {routeGeojson && !hasMultiRoutes && (
        <Source id="route-single" type="geojson" data={routeGeojson}>
          <Layer
            id="route-single-line"
            type="line"
            paint={{'line-color': routeGeojson.properties?.color || '#111111','line-width': 4,'line-opacity': 0.9}}
          />
        </Source>
      )}

      {/* Routes multi-jours */}
      {hasMultiRoutes && Object.entries(multiDayRoutes).map(([day, routeData]) => {
        if (!routeData?.geojson) return null;
        const color = getDayColor(parseInt(day));
        return (
          <Source key={`route-day-${day}`} id={`route-day-${day}`} type="geojson" data={routeData.geojson}>
            <Layer
              id={`route-day-line-${day}`}
              type="line"
              paint={{ 'line-color': color, 'line-width': 4, 'line-opacity': 0.85 }}
            />
          </Source>
        );
      })}

      {/* Marqueurs numérotés (trajets) */}
      {(markers || []).map((marker, idx) => {
        const color = getDayColor(marker.day);
        return (
          <Marker key={`marker-${marker.id}`} longitude={marker.longitude} latitude={marker.latitude} anchor="bottom">
            <div
              style={{ backgroundColor: color }}
              className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold shadow-md cursor-default"
            >
              {idx + 1}
            </div>
          </Marker>
        );
      })}

      {/* Marqueurs de proximité */}
      {(nearbyMarkers || []).map((place, idx) => {
        const { color, icon } = getNearbyStyle(place.types || []);
        return (
          <Marker key={`nearby-${idx}`} longitude={place.lng} latitude={place.lat} anchor="bottom">
            <div
              className={nearbyExiting ? 'nearby-marker-exit' : 'nearby-marker'}
              style={{
                animationDelay: nearbyExiting
                  ? `${(nearbyMarkers.length - 1 - idx) * 25}ms`
                  : `${idx * 50}ms`,
                filter: `drop-shadow(0 2px 6px ${color}66)`,
                cursor: 'pointer',
              }}
              onClick={(e) => { e.stopPropagation(); onNearbyMarkerClick?.(place); }}
            >
              <svg viewBox="0 0 28 34" width="26" height="31" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 0C6.268 0 0 6.268 0 14C0 23.625 14 34 14 34C14 34 28 23.625 28 14C28 6.268 21.732 0 14 0Z" fill={color}/>
                {/* Icône Lucide centrée dans le pin (viewBox 24x24 → 16x16 px, centré en 14,11) */}
                <svg x="6" y="3" width="16" height="16" viewBox="0 0 24 24"
                  fill="none" stroke="white" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"
                >
                  {icon}
                </svg>
              </svg>
            </div>
          </Marker>
        );
      })}

      {/* Marqueurs favoris (étoile dorée) */}
      {(tripMarkers || []).map((fav) => (
        <Marker key={`fav-${fav.id}`} longitude={fav.longitude} latitude={fav.latitude} anchor="bottom">
          <div
            onClick={(e) => { e.stopPropagation(); onTripMarkerClick?.(fav); }}
            style={{ cursor: 'pointer', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.30))' }}
          >
            <svg viewBox="0 0 32 38" width="28" height="34" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 0C7.163 0 0 7.163 0 16C0 27 16 38 16 38C16 38 32 27 32 16C32 7.163 24.837 0 16 0Z" fill="#ff9500"/>
              <polygon points="16,8 17.8,13.5 23.5,13.5 19,17 20.8,22.5 16,19 11.2,22.5 13,17 8.5,13.5 14.2,13.5" fill="white" fillOpacity="0.95"/>
            </svg>
          </div>
        </Marker>
      ))}
    </Map>
  );
});

export default MapComponent;