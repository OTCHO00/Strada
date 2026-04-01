import { useRef, forwardRef, useImperativeHandle, useState } from 'react';
import Map, { Layer, Source } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const DAY_COLORS = [
  '#3B82F6', // Bleu
  '#10B981', // Vert  
  '#F59E0B', // Orange
  '#EF4444', // Rouge
  '#8B5CF6', // Violet
  '#EC4899', // Rose
  '#14B8A6', // Cyan
  '#F97316', // Orange foncé
  '#6366F1', // Indigo
];

const routeLayer = {
  id: 'route-line',
  type: 'line',
  paint: {
    'line-color': '#4f46e5',
    'line-width': 5,
    'line-opacity': 0.85
  }
};

const MapComponent = forwardRef(({ onPoiClick, routeGeojson, multiDayRoutes, mapStyle }, ref) => {
  const mapRef = useRef();
  const [isLoaded, setIsLoaded] = useState(false);

  const getMapStyle = () => {
    return mapStyle === 'night' 
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/streets-v12';
  };

  useImperativeHandle(ref, () => ({
    flyTo: (options) => {
      mapRef.current?.flyTo(options);
    }
  }));

  const handleMapLoad = () => {
    console.log('Carte chargée !');
    setIsLoaded(true);
  };

  const handleMapClick = (event) => {
    if (!isLoaded) {
      console.log('Carte pas encore chargée, attends un peu...');
      return;
    }

    console.log('Click sur la carte!');
    
    const map = mapRef.current?.getMap();
    if (!map) return;

    const features = map.queryRenderedFeatures(event.point);
    
    console.log('Features trouvés:', features.length);
    
    if (features.length > 0) {
      // Log toutes les propriétés du premier feature
      console.log('Properties du premier feature:', features[0].properties);
      
      // Chercher un feature avec un nom
      const namedFeature = features.find(f => 
        f.properties && (f.properties.name || f.properties.name_en)
      );
      
      if (namedFeature) {
        console.log('✅ Feature avec nom trouvé!', namedFeature.properties);
        
        const poiData = {
          name: namedFeature.properties.name || namedFeature.properties.name_en,
          category: namedFeature.properties.class || namedFeature.properties.type || namedFeature.properties.maki || 'Lieu',
          coordinates: {
            lng: event.lngLat.lng,
            lat: event.lngLat.lat
          },
          properties: namedFeature.properties
        };

        console.log('Données POI complètes:', poiData);
        
        // Vérifier que le POI a un nom avant de l'ajouter aux favoris
        if (poiData.name && poiData.name.trim() !== '') {
          if (onPoiClick) {
            onPoiClick(poiData);
          }
        } else {
          console.log('❌ POI ignoré: pas de nom valide');
        }
      } else {
        console.log('❌ Aucun lieu avec nom trouvé');
        console.log('Propriétés disponibles:', features[0].properties);
      }
    }
  };

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
      style={{position: "absolute", inset: 0}}
      mapStyle={getMapStyle()}
      initialViewState={{
        longitude: 2.3522,
        latitude: 48.8566,
        zoom: 14
      }}
      onLoad={handleMapLoad}
      onClick={handleMapClick}
      cursor="pointer"
    >
      {/* Route unique */}
      {routeGeojson && !multiDayRoutes && (
        <Source id="route" type="geojson" data={routeGeojson}>
          <Layer 
            id="route-line"
            type="line"
            paint={{
              'line-color': '#746D69',
              'line-width': 6,
              'line-opacity': 0.9
            }}
          />
        </Source>
      )}
      
      {/* Multi-jours */}
      {multiDayRoutes && Object.entries(multiDayRoutes).map(([day, routeData]) => {
        const color = DAY_COLORS[(parseInt(day) - 1) % DAY_COLORS.length];
        return routeData?.geojson && (
          <Source key={day} id={`route-${day}`} type="geojson" data={routeData.geojson}>
            <Layer 
              id={`route-line-${day}`}
              type="line"
              paint={{
                'line-color': color,
                'line-width': 4,
                'line-opacity': 0.8
              }}
            />
          </Source>
        );
      })}
      
      {/* Debug overlay - RETIRÉ */}
    </Map>
  );
});

export default MapComponent;