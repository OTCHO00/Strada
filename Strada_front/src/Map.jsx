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

      {/* Marqueurs voyage (pins colorés) */}
      {(tripMarkers || []).map((poi) => (
        <Marker key={`trip-poi-${poi.id}`} longitude={poi.longitude} latitude={poi.latitude} anchor="bottom">
          <div
            onClick={(e) => { e.stopPropagation(); onTripMarkerClick?.(poi); }}
            style={{ cursor: 'pointer', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))' }}
          >
            <svg viewBox="0 0 28 36" width="28" height="36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 0C6.268 0 0 6.268 0 14C0 24.5 14 36 14 36C14 36 28 24.5 28 14C28 6.268 21.732 0 14 0Z" fill={poi.color}/>
              <circle cx="14" cy="14" r="6" fill="white" fillOpacity="0.92"/>
            </svg>
          </div>
        </Marker>
      ))}
    </Map>
  );
});

export default MapComponent;