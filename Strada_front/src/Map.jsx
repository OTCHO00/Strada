import { useRef, forwardRef, useImperativeHandle, useState } from 'react';
import Map, { Layer, Source, Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getDayColor } from './constants.js';

const MapComponent = forwardRef(({ onPoiClick, routeGeojson, multiDayRoutes, markers, tripMarkers, onTripMarkerClick, mapStyle, defaultZoom, defaultLng, defaultLat }, ref) => {
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