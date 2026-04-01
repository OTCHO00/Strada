import React, { useState, useRef, useEffect } from 'react';
import Map from './Map.jsx';
import Sidebar from './Sidebar.jsx';
import RightPanel from './RightPanel.jsx';
import PoiCard from './PoiCard.jsx';
import SelectItineraryModal from './SelectItineraryModal.jsx';
import RouteControlPanel from './RouteControlPanel.jsx';
import './App.css';

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false); // État pour sidebar collapsed
  const [activeMode, setActiveMode] = useState(null);
  const [selectedPoi, setSelectedPoi] = useState(null);
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const [itineraries, setItineraries] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [routeGeojson, setRouteGeojson] = useState(null);
  const [routeInfo, setRouteInfo] = useState({});
  const mapRef = useRef();
  
  // États pour les divs droites
  const [searchOpen, setSearchOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [tripsOpen, setTripsOpen] = useState(false);
  const [organizeOpen, setOrganizeOpen] = useState(false);
  
  // Mode visualisation trajet
  const [isRouteViewMode, setIsRouteViewMode] = useState(false);
  const [selectedRouteDay, setSelectedRouteDay] = useState(1);
  const [isMultiDayMode, setIsMultiDayMode] = useState(false);
  const [multiDayRoutes, setMultiDayRoutes] = useState({});
  const [routeViewItineraryId, setRouteViewItineraryId] = useState(null);
  const [routeViewPlanPois, setRouteViewPlanPois] = useState([]);
  const [mapStyle, setMapStyle] = useState('day');
  const [currentItinerary, setCurrentItinerary] = useState(null);
  
  // Sauvegarder l'état de la sidebar avant ouverture de la recherche
  const [previousSidebarState, setPreviousSidebarState] = useState({ isOpen: false, isCollapsed: false });
  
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

  useEffect(() => {
    const fetchItineraries = async () => {
      try {
        const response = await fetch('http://localhost:8000/itineraire');
        if (response.ok) {
          const data = await response.json();
          console.log('🗂 Itinéraires chargés:', data);
          data.forEach((itin, index) => {
            console.log(`📍 Itinéraire ${index + 1} (${itin.nom}):`, {
              id: itin.id,
              nb_jours: itin.nb_jours,
              pois_count: itin.pois?.length || 0,
              pois: itin.pois
            });
          });
          setItineraries(data);
        }
      } catch (err) {
        console.error('Erreur chargement itinéraires:', err);
      }
    };

    fetchItineraries();
  }, []);

  useEffect(() => {
    fetch('http://localhost:8000/favorites')
      .then(res => res.json())
      .then(data => setFavorites(data))
      .catch(err => console.error('Erreur chargement favoris:', err));
  }, []);

  const handlePlaceSelect = (location) => {
    console.log('Zoom vers:', location);
    mapRef.current?.flyTo({
      center: [location.lng, location.lat],
      zoom: 15,
      duration: 2000
    });
  };

  const handlePoiClick = (poiData) => {
    console.log('POI cliqué:', poiData);
    setSelectedPoi(poiData);
  };

  const handleAddToTrip = () => {
    setShowItineraryModal(true);
  };

  const handleAddToFavorites = async () => {
    try {
      const response = await fetch('http://localhost:8000/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: selectedPoi.name,
          category: selectedPoi.category,
          latitude: selectedPoi.coordinates.lat,
          longitude: selectedPoi.coordinates.lng,
          continent: null,
          source_url: null,
          properties: selectedPoi.properties || {}
        })
      });
      if (!response.ok) throw new Error('Erreur API favoris');
      const fav = await response.json();
      setFavorites(prev => [fav, ...prev]);
      setSelectedPoi(null);
      alert('✅ Ajouté aux favoris');
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'ajout aux favoris");
    }
  };

  const handleSelectItinerary = async (itinerary) => {
    console.log('🎯 Ajout POI au voyage:', { selectedPoi, itinerary });
    
    try {
      const payload = {
        nom: selectedPoi.name,
        category: selectedPoi.category,
        latitude: selectedPoi.coordinates.lat,
        longitude: selectedPoi.coordinates.lng,
        properties: selectedPoi.properties || {},
        day: null,
        position: null,
        favorite_id: null,
        travel_mode: null
      };
      
      console.log('📤 Payload envoyé:', payload);
      
      const response = await fetch(`http://localhost:8000/itineraire/${itinerary.id}/poi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      console.log('📥 Response status:', response.status, response.statusText);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ POI ajouté:', result);
        
        // Recharger les itinéraires pour avoir le bon comptage
        const listRes = await fetch('http://localhost:8000/itineraire');
        if (listRes.ok) {
          const updatedItineraries = await listRes.json();
          setItineraries(updatedItineraries);
          
          // Mettre à jour l'itinéraire courant avec les POI fraîchement chargés
          const updatedItinerary = updatedItineraries.find(i => i.id === itinerary.id);
          if (updatedItinerary) {
            console.log('📊 POI count after update:', updatedItinerary.pois?.length || 0);
            console.log('📋 POI structure:', updatedItinerary.pois);
          }
        }
        setShowItineraryModal(false);
        setSelectedPoi(null);
        alert(`✅ "${selectedPoi.name}" ajouté au dossier « ${itinerary.nom} » (organise-le dans l'onglet Organisation).`);
      } else {
        const errorText = await response.text();
        console.error('❌ Erreur réponse:', errorText);
        alert(`Erreur: ${response.status} - ${errorText}`);
      }
    } catch (err) {
      console.error('💥 Erreur ajout POI:', err);
      alert('Erreur lors de l\'ajout du POI: ' + err.message);
    }
  };

  // Fonctions pour les divs droites
  const handleOpenSearch = () => {
    // Sauvegarder l'état actuel de la sidebar avant de la masquer
    setPreviousSidebarState({ isOpen, isCollapsed });
    
    // Masquer complètement la sidebar et ouvrir la recherche
    setIsOpen(false);
    setActiveMode(null);
    setSearchOpen(true);
    setFavoritesOpen(false);
    setTripsOpen(false);
    setOrganizeOpen(false);
  };

  const handleCloseSearch = () => {
    // Fermer la recherche et restaurer l'état précédent de la sidebar
    setSearchOpen(false);
    setIsOpen(previousSidebarState.isOpen);
    setIsCollapsed(previousSidebarState.isCollapsed);
    setActiveMode(null);
  };

  const handleOpenFavorites = () => {
    setIsOpen(true);
    setActiveMode('favorites');
    setSearchOpen(false);
    setFavoritesOpen(true);
    setTripsOpen(false);
    setOrganizeOpen(false);
  };

  const handleOpenTrips = () => {
    setIsOpen(true);
    setActiveMode('trips');
    setSearchOpen(false);
    setFavoritesOpen(false);
    setTripsOpen(true);
    setOrganizeOpen(false);
  };

  const handleOpenOrganize = () => {
    setIsOpen(true);
    setActiveMode('organize');
    setSearchOpen(false);
    setFavoritesOpen(false);
    setTripsOpen(false);
    setOrganizeOpen(true);
  };

  const handleCloseAllRight = () => {
    setSearchOpen(false);
    setFavoritesOpen(false);
    setTripsOpen(false);
    setOrganizeOpen(false);
    setIsOpen(false);
  };

  // Fonctions pour le mode visualisation
  const handleEnterRouteView = (itineraryId, planPois, firstPoi) => {
    setIsRouteViewMode(true);
    setIsOpen(false);
    setActiveMode(null);
    setRouteViewItineraryId(itineraryId);
    setRouteViewPlanPois(planPois);
    
    // Trouver l'itinéraire correspondant
    const itinerary = itineraries.find(i => i.id === itineraryId);
    setCurrentItinerary(itinerary);
    
    // Zoom automatique sur le premier POI
    if (firstPoi && mapRef.current) {
      mapRef.current.flyTo({
        center: [firstPoi.longitude, firstPoi.latitude],
        zoom: 15,
        duration: 2000,
        essential: true
      });
    }
    
    console.log('Route view mode activated', { itineraryId, planPois: planPois.length, firstPoi });
  };

  const handleExitRouteView = () => {
    setIsRouteViewMode(false);
    setRouteGeojson(null);
    setMultiDayRoutes({});
    setIsMultiDayMode(false);
    setRouteViewItineraryId(null);
    setRouteViewPlanPois([]);
  };

  const handleDaySelect = (day) => {
    console.log('Day selected:', day);
    setSelectedRouteDay(day);
    setIsMultiDayMode(false);
    
    // Calculer la route pour ce jour spécifique
    if (routeViewPlanPois.length > 0) {
      const dayPois = routeViewPlanPois
        .filter(p => p.day === day)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      
      console.log('Day POIs:', dayPois);
      
      if (dayPois.length >= 2) {
        // Utiliser la fonction de calcul de route du Sidebar
        const coords = dayPois.map(p => `${p.longitude},${p.latitude}`).join(';');
        const mode = dayPois[0]?.travel_mode || 'driving';
        const token = mapboxToken;
        
        console.log('Calculating route with coords:', coords, 'mode:', mode);
        
        fetch(`https://api.mapbox.com/directions/v5/mapbox/${mode}/${coords}?geometries=geojson&overview=full&access_token=${token}`)
          .then(res => res.json())
          .then(data => {
            console.log('Mapbox response:', data);
            const route = data?.routes?.[0];
            if (route?.geometry) {
              const geojson = {
                type: 'Feature',
                properties: { day, color: '#4f46e5' },
                geometry: route.geometry
              };
              console.log('Setting route geojson:', geojson);
              setRouteGeojson(geojson);
              setRouteInfo(prev => ({
                ...prev,
                [day]: {
                  duration: route.duration,
                  distance: route.distance,
                  mode
                }
              }));
            } else {
              console.log('No route found in response');
              setRouteGeojson(null);
            }
          })
          .catch(err => {
            console.error('Error calculating route:', err);
            setRouteGeojson(null);
          });
      } else {
        console.log('Not enough POIs for route:', dayPois.length);
        setRouteGeojson(null);
      }
    } else {
      console.log('No plan POIs available');
      setRouteGeojson(null);
    }
  };

  const handleMultiDayToggle = (enabled) => {
    setIsMultiDayMode(enabled);
    if (enabled) {
      setRouteGeojson(null); // Utiliser multiDayRoutes à la place
    }
  };

  const handleTransportChange = async (day, mode) => {
    // TODO: Implémenter le changement de mode de transport
    console.log(`Change transport for day ${day} to ${mode}`);
  };

  const handleMapStyleChange = (style) => {
    setMapStyle(style);
  };

  const handleRouteChange = (geojson, info, day = null) => {
    console.log('Route change received:', { geojson, info, day, isMultiDayMode });
    
    if (isMultiDayMode && day) {
      // Mode multi-jours : stocker dans multiDayRoutes
      setMultiDayRoutes(prev => ({
        ...prev,
        [day]: { geojson, info }
      }));
      console.log('Multi-day route updated for day', day);
    } else {
      // Mode jour unique : utiliser routeGeojson
      setRouteGeojson(geojson);
      if (info) {
        setRouteInfo(prev => ({
          ...prev,
          [day || selectedRouteDay]: info
        }));
      }
      console.log('Single route updated');
    }
  };

  return (
    <>
      <Sidebar
        isOpen={isOpen && !isRouteViewMode}
        setIsOpen={setIsOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        onOpenSearch={handleOpenSearch}
        onOpenFavorites={handleOpenFavorites}
        onOpenTrips={handleOpenTrips}
        onOpenOrganize={handleOpenOrganize}
        searchOpen={searchOpen} 
      />
      
      <Map 
        ref={mapRef} 
        onPoiClick={handlePoiClick}
        routeGeojson={isMultiDayMode ? null : routeGeojson}
        multiDayRoutes={isMultiDayMode ? multiDayRoutes : {}}
        mapStyle={mapStyle}
      />

      {selectedPoi && !showItineraryModal && (
        <PoiCard
          poi={selectedPoi}
          onClose={() => setSelectedPoi(null)}
          onAddToTrip={handleAddToTrip}
          onAddToFavorites={handleAddToFavorites}
          searchOpen={searchOpen}
        />
      )}

      {showItineraryModal && (
        <SelectItineraryModal
          poi={selectedPoi}
          itineraries={itineraries}
          onSelect={handleSelectItinerary}
          onClose={() => setShowItineraryModal(false)}
        />
      )}

      {isRouteViewMode && (
        <RouteControlPanel
          isVisible={isRouteViewMode}
          onClose={handleExitRouteView}
          itinerary={currentItinerary}
          planPois={routeViewPlanPois}
          selectedDay={selectedRouteDay}
          onDaySelect={handleDaySelect}
          onMultiDayToggle={handleMultiDayToggle}
          isMultiDayMode={isMultiDayMode}
          onTransportChange={handleTransportChange}
          routeInfo={routeInfo}
          onMapStyleChange={handleMapStyleChange}
          mapStyle={mapStyle}
        />
      )}

      {/* Right Panels */}
      <RightPanel
        searchOpen={searchOpen}
        favoritesOpen={favoritesOpen}
        tripsOpen={tripsOpen}
        organizeOpen={organizeOpen}
        onCloseAll={handleCloseAllRight}
        onCloseSearch={handleCloseSearch}
        favorites={favorites}
        setFavorites={setFavorites}
        itineraries={itineraries}
        setItineraries={setItineraries}
        onPlaceSelect={handlePlaceSelect}
        mapboxToken={mapboxToken}
      />
    </>
  );
}

export default App;