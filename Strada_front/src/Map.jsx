import { useRef, forwardRef, useImperativeHandle, useState } from 'react';
import Map from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const MapComponent = forwardRef(({ onPoiClick }, ref) => {
  const mapRef = useRef();
  const [isLoaded, setIsLoaded] = useState(false);

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
        
        if (onPoiClick) {
          onPoiClick(poiData);
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
      mapboxAccessToken="pk.eyJ1Ijoib3RjaG8iLCJhIjoiY21rbHgyczY3MGJmaTNkc2JscXE5NG1wMyJ9.z77Uh_KJ_BJ3WsKKmkrgMQ"
      style={{position: "absolute", inset: 0}}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      initialViewState={{
        longitude: 2.3522,
        latitude: 48.8566,
        zoom: 14
      }}
      onLoad={handleMapLoad}
      onClick={handleMapClick}
      cursor="pointer"
    />
  );
});

export default MapComponent;