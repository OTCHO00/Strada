import React, { useState, useRef, useEffect } from 'react';
import Map from './Map.jsx';
import Sidebar from './Sidebar.jsx';
import RightPanel from './RightPanel.jsx';
import PoiCard from './PoiCard.jsx';
import SelectItineraryModal from './SelectItineraryModal.jsx';
import PanelsContainer from './PanelsContainer.jsx';
import { getDayColor } from './constants.js';
import './App.css';

function App() {
  // ── UI state ──────────────────────────────────────────────────
  const [activePanel, setActivePanel] = useState(null); // 'search' | 'favorites' | 'trips' | 'organize' | null
  const [toasts, setToasts] = useState([]);

  // ── Data state ────────────────────────────────────────────────
  const [itineraries, setItineraries] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [selectedPoi, setSelectedPoi] = useState(null);
  const [showItineraryModal, setShowItineraryModal] = useState(false);

  // ── Route state ───────────────────────────────────────────────
  const [routeGeojson, setRouteGeojson] = useState(null);
  const [multiDayRoutes, setMultiDayRoutes] = useState({});
  const [routePanelOpen, setRoutePanelOpen] = useState(false);
  const [routePanelItinerary, setRoutePanelItinerary] = useState(null);
  const [routePanelPois, setRoutePanelPois] = useState([]);
  const [routeDurations, setRouteDurations] = useState({});
  const [mapMarkers, setMapMarkers] = useState([]);

  const mapRef = useRef();
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

  // ── Derived panel booleans ────────────────────────────────────
  const searchOpen    = activePanel === 'search';
  const favoritesOpen = activePanel === 'favorites';
  const tripsOpen     = activePanel === 'trips';
  const organizeOpen  = activePanel === 'organize';

  // ── Toast system ──────────────────────────────────────────────
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  // ── Fetch initial data ────────────────────────────────────────
  useEffect(() => {
    fetch('http://localhost:8000/itineraire')
      .then(res => res.ok ? res.json() : [])
      .then(data => setItineraries(data))
      .catch(err => console.error('Erreur itinéraires:', err));
  }, []);

  useEffect(() => {
    fetch('http://localhost:8000/favorites')
      .then(res => res.json())
      .then(data => setFavorites(data))
      .catch(err => console.error('Erreur favoris:', err));
  }, []);

  // ── Map handlers ──────────────────────────────────────────────
  const handlePlaceSelect = (location) => {
    mapRef.current?.flyTo({ center: [location.lng, location.lat], zoom: 15, duration: 2000 });
  };

  const handlePoiClick = (poiData) => setSelectedPoi(poiData);

  // ── POI handlers ──────────────────────────────────────────────
  const handleAddToTrip = () => setShowItineraryModal(true);

  const handleAddToFavorites = async () => {
    try {
      const res = await fetch('http://localhost:8000/favorites', {
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
      if (!res.ok) throw new Error('Erreur API favoris');
      const fav = await res.json();
      setFavorites(prev => [fav, ...prev]);
      setSelectedPoi(null);
      addToast('Ajouté aux favoris', 'success');
    } catch (err) {
      console.error(err);
      addToast('Erreur lors de l\'ajout aux favoris', 'error');
    }
  };

  const handleSelectItinerary = async (itinerary) => {
    try {
      const res = await fetch(`http://localhost:8000/itineraire/${itinerary.id}/poi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: selectedPoi.name,
          category: selectedPoi.category,
          latitude: selectedPoi.coordinates.lat,
          longitude: selectedPoi.coordinates.lng,
          properties: selectedPoi.properties || {},
          day: null, position: null, favorite_id: null, travel_mode: null
        })
      });
      if (!res.ok) throw new Error(await res.text());
      const listRes = await fetch('http://localhost:8000/itineraire');
      if (listRes.ok) setItineraries(await listRes.json());
      setShowItineraryModal(false);
      setSelectedPoi(null);
      addToast('POI ajouté au voyage', 'success');
    } catch (err) {
      console.error('Erreur ajout POI:', err);
      addToast('Erreur lors de l\'ajout du POI', 'error');
    }
  };

  // ── Nav / panel handlers ──────────────────────────────────────
  const handleNavigate = (tab) => setActivePanel(prev => prev === tab ? null : tab);
  const handleClosePanel = () => setActivePanel(null);

  // ── Route handlers ────────────────────────────────────────────
  const handleViewRoutes = (itinerary, allPois) => {
    setRoutePanelItinerary(itinerary);
    setRoutePanelPois(allPois);
    setRoutePanelOpen(true);
    setActivePanel(null);
  };

  const handleDaysChange = async (activeDays, overridePois = null, mode = 'driving') => {
    if (overridePois) reorderedPoisRef.current = overridePois;
    const poisToUse = reorderedPoisRef.current || routePanelPoisRef.current;

    if (activeDays.length === 0) {
      setRouteGeojson(null); setMultiDayRoutes({}); setMapMarkers([]); return;
    }

    const newRoutes = {};

    await Promise.all(activeDays.map(async (day) => {
      const dayPois = poisToUse.filter(p => p.day === day).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      if (dayPois.length < 2) return;
      const coords = dayPois.map(p => `${p.longitude},${p.latitude}`).join(';');

      const totalDistanceKm = dayPois.reduce((acc, poi, i) => {
        if (i === 0) return acc;
        const prev = dayPois[i - 1];
        const R = 6371;
        const dLat = (poi.latitude - prev.latitude) * Math.PI / 180;
        const dLon = (poi.longitude - prev.longitude) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(prev.latitude * Math.PI / 180) * Math.cos(poi.latitude * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        return acc + R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      }, 0);

      const [drivingRes, cyclingRes, walkingRes] = await Promise.all([
        fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?geometries=geojson&overview=full&access_token=${mapboxToken}`),
        fetch(`https://api.mapbox.com/directions/v5/mapbox/cycling/${coords}?geometries=geojson&overview=full&access_token=${mapboxToken}`),
        fetch(`https://api.mapbox.com/directions/v5/mapbox/walking/${coords}?geometries=geojson&overview=full&access_token=${mapboxToken}`),
      ]);
      const [drivingData, cyclingData, walkingData] = await Promise.all([drivingRes.json(), cyclingRes.json(), walkingRes.json()]);
      const driving = drivingData?.routes?.[0];
      const cycling = cyclingData?.routes?.[0];
      const walking = walkingData?.routes?.[0];
      if (!driving?.geometry) return;

      const flightDurationSeconds = Math.round((totalDistanceKm / 800) * 3600 + 1800);
      newRoutes[day] = {
        geojson: { type: 'Feature', properties: { day }, geometry: driving.geometry },
        driving: { duration: driving.duration, distance: driving.distance },
        cycling: { duration: cycling?.duration ?? null, distance: cycling?.distance ?? null },
        walking: { duration: walking?.duration ?? null, distance: walking?.distance ?? null },
        flying: { duration: flightDurationSeconds, distance: Math.round(totalDistanceKm * 1000) },
      };
    }));

    const newDurations = {};
    Object.entries(newRoutes).forEach(([day, data]) => {
      newDurations[day] = { driving: data.driving, cycling: data.cycling, walking: data.walking, flying: data.flying };
    });
    setRouteDurations(newDurations);

    const getGeojsonForMode = (day, dm) => {
      const route = newRoutes[day];
      if (!route) return null;
      const color = getDayColor(day);
      if (dm === 'flying') {
        const dayPois = poisToUse.filter(p => p.day === day).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        return { type: 'Feature', properties: { day, color }, geometry: { type: 'LineString', coordinates: dayPois.map(p => [p.longitude, p.latitude]) } };
      }
      return { ...route.geojson, properties: { day, color } };
    };

    if (activeDays.length === 1) {
      setRouteGeojson(getGeojsonForMode(activeDays[0], mode));
      setMultiDayRoutes({});
    } else {
      setRouteGeojson(null);
      const routesForMode = {};
      activeDays.forEach(day => { const g = getGeojsonForMode(day, mode); if (g) routesForMode[day] = { geojson: g }; });
      setMultiDayRoutes(routesForMode);
    }

    const allActivePois = activeDays.flatMap(day =>
      poisToUse.filter(p => p.day === day).sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    );
    setMapMarkers(allActivePois);

    if (allActivePois.length > 0 && mapRef.current) {
      const lngs = allActivePois.map(p => p.longitude);
      const lats = allActivePois.map(p => p.latitude);
      mapRef.current.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 80, duration: 1200 });
    }
  };

  const routePanelPoisRef = useRef([]);
  const reorderedPoisRef = useRef(null);
  useEffect(() => { routePanelPoisRef.current = routePanelPois; reorderedPoisRef.current = null; }, [routePanelPois]);

  // ── Render ────────────────────────────────────────────────────
  return (
    <>
      <Sidebar activeTab={activePanel} onNavigate={handleNavigate} />

      <Map
        ref={mapRef}
        onPoiClick={handlePoiClick}
        routeGeojson={Object.keys(multiDayRoutes).length === 0 ? routeGeojson : null}
        multiDayRoutes={multiDayRoutes}
        markers={mapMarkers}
      />

      {/* Backdrop subtil quand un panel est ouvert */}
      {activePanel && (
        <div
          className="fixed inset-0 z-[45] bg-black/5 backdrop-blur-[1px]"
          onClick={handleClosePanel}
        />
      )}

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

      <RightPanel
        searchOpen={searchOpen}
        favoritesOpen={favoritesOpen}
        tripsOpen={tripsOpen}
        organizeOpen={organizeOpen}
        onCloseAll={handleClosePanel}
        onCloseSearch={handleClosePanel}
        favorites={favorites}
        setFavorites={setFavorites}
        itineraries={itineraries}
        setItineraries={setItineraries}
        onPlaceSelect={handlePlaceSelect}
        mapboxToken={mapboxToken}
        onViewRoutes={handleViewRoutes}
      />

      <PanelsContainer
        isVisible={routePanelOpen}
        onClose={() => { setRoutePanelOpen(false); setRouteGeojson(null); setMultiDayRoutes({}); setMapMarkers([]); setRouteDurations({}); }}
        itinerary={routePanelItinerary}
        planPois={routePanelPois}
        onDaysChange={handleDaysChange}
        routeDurations={routeDurations}
      />

      {/* Toasts */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-2.5 rounded-xl text-xs font-medium shadow-lg border fade-up ${
              toast.type === 'success'
                ? 'bg-[#1c1c1e] text-white border-transparent'
                : 'bg-red-50 text-red-700 border-red-100'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </>
  );
}

export default App;
