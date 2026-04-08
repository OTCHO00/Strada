import { useRef, forwardRef, useImperativeHandle, useState } from 'react';
import Map, { Layer, Source, Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getDayColor } from './constants.js';

const MapComponent = forwardRef(({ onPoiClick, routeGeojson, multiDayRoutes, markers }, ref) => {
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
      mapStyle="mapbox://styles/mapbox/dark-v11"
      initialViewState={{ longitude: 2.3522, latitude: 48.8566, zoom: 14 }}
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

      {/* Marqueurs numérotés */}
      {(markers || []).map((marker, idx) => {
        const color = getDayColor(marker.day);
        return (
          <Marker
            key={`marker-${marker.id}`}
            longitude={marker.longitude}
            latitude={marker.latitude}
            anchor="bottom"
          >
            <div
              style={{ backgroundColor: color }}
              className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold shadow-md cursor-default"
            >
              {idx + 1}
            </div>
          </Marker>
        );
      })}
    </Map>
  );
});

export default MapComponent;