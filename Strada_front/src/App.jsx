import React, { useState, useRef, useEffect, useCallback } from 'react';
import Map from './Map.jsx';
import Sidebar from './Sidebar.jsx';
import RightPanel from './RightPanel.jsx';
import PoiCard from './PoiCard.jsx';
import SelectItineraryModal from './SelectItineraryModal.jsx';
import PanelsContainer from './PanelsContainer.jsx';
import BottomPlanner from './BottomPlanner.jsx';
import { getDayColor } from './constants.js';
import './App.css';

const PALETTE = ['#5856d6','#34aadc','#30b0c7','#34c759','#ff9500','#af52de','#ff2d55','#5ac8fa','#ff6b35','#32ade6'];
const getSavedTripColors = () => { try { return JSON.parse(localStorage.getItem('strada_trip_colors') || '{}'); } catch { return {}; } };
const getTripColor = (itineraries, id) => {
  const saved = getSavedTripColors();
  if (saved[id]) return saved[id];
  return PALETTE[itineraries.findIndex(i => i.id === id) % PALETTE.length] || PALETTE[0];
};

// Cache en mémoire pour les routes Mapbox Directions (session uniquement)
const routeCache = new globalThis.Map();

const DEFAULT_SETTINGS = {
  mapStyle: 'streets-v12',
  language: 'fr',
  units: 'km',
  defaultTransport: 'driving',
  defaultZoom: 10,
  sidebarColor: '#dfe2ef',
  sidebarGrain: 0.06,
  defaultCity: 'Paris',
  defaultLng: 2.3522,
  defaultLat: 48.8566,
};

function App() {
  // ── UI state ──────────────────────────────────────────────────
  const [activePanel, setActivePanel] = useState(null); // 'search' | 'favorites' | 'trips' | 'organize' | 'settings' | null
  const [closingPanel, setClosingPanel] = useState(null);
  const [toasts, setToasts] = useState([]);

  // ── Settings state ────────────────────────────────────────────
  const [settings, setSettings] = useState(() => {
    try {
      const s = localStorage.getItem('strada_settings');
      return s ? { ...DEFAULT_SETTINGS, ...JSON.parse(s) } : DEFAULT_SETTINGS;
    } catch { return DEFAULT_SETTINGS; }
  });

  const updateSettings = (changes) => {
    setSettings(prev => {
      const next = { ...prev, ...changes };
      localStorage.setItem('strada_settings', JSON.stringify(next));
      return next;
    });
  };

  // ── Data state ────────────────────────────────────────────────
  const [itineraries, setItineraries] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [selectedPoi, setSelectedPoi] = useState(null);
  const [showItineraryModal, setShowItineraryModal] = useState(false);

  // ── Planner state ─────────────────────────────────────────────
  const [plannerOpen, setPlannerOpen]       = useState(false);
  const [plannerClosing, setPlannerClosing] = useState(false);
  const [plannerTrip, setPlannerTrip]       = useState(null);
  const [plannerHeight, setPlannerHeight]   = useState(360);
  const plannerTripRef = useRef(null);
  useEffect(() => { plannerTripRef.current = plannerTrip; }, [plannerTrip]);

  const handleOpenPlanner = async (itinerary) => {
    setPlannerTrip(itinerary);
    setPlannerOpen(true);
    // Ouvre aussi le PanelsContainer avec les POIs du voyage
    try {
      const res = await fetch(`http://localhost:8000/itineraire/${itinerary.id}/plan`);
      const pois = res.ok ? await res.json() : [];
      setRoutePanelItinerary(itinerary);
      setRoutePanelPois(pois);
      setRoutePanelOpen(true);
    } catch (e) { console.error(e); }
  };

  const handleClosePlanner = () => {
    setPlannerClosing(true);
    setTimeout(() => {
      setPlannerOpen(false);
      setPlannerClosing(false);
      setPlannerTrip(null);
      setRoutePanelOpen(false);
      setRouteGeojson(null);
      setMultiDayRoutes({});
      setMapMarkers([]);
      setRouteDurations({});
    }, 600);
  };

  // ── Route state ───────────────────────────────────────────────
  const [routeGeojson, setRouteGeojson] = useState(null);
  const [multiDayRoutes, setMultiDayRoutes] = useState({});
  const [routePanelOpen, setRoutePanelOpen] = useState(false);
  const [routePanelItinerary, setRoutePanelItinerary] = useState(null);
  const [routePanelPois, setRoutePanelPois] = useState([]);
  const [routeDurations, setRouteDurations] = useState({});
  const [mapMarkers, setMapMarkers] = useState([]);

  // ── Trip markers (tous les voyages, toujours visibles) ───────
  const [tripMarkers, setTripMarkers] = useState([]);

  const mapRef = useRef();
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

  // ── Derived panel booleans ────────────────────────────────────
  const searchOpen    = activePanel === 'search';
  const favoritesOpen = activePanel === 'favorites';
  const tripsOpen     = activePanel === 'trips';
  const organizeOpen  = activePanel === 'organize';
  const settingsOpen  = activePanel === 'settings';

  // ── Toast system ──────────────────────────────────────────────
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  // ── Load all trip markers ─────────────────────────────────────
  const loadAllTripMarkers = useCallback(async (itin) => {
    const list = itin || itineraries;
    if (!list.length) { setTripMarkers([]); return; }
    try {
      const results = await Promise.all(
        list.map(async (trip) => {
          const res = await fetch(`http://localhost:8000/itineraire/${trip.id}/plan`);
          if (!res.ok) return [];
          const pois = await res.json();
          const color = getTripColor(list, trip.id);
          return pois.map(p => ({ ...p, color }));
        })
      );
      setTripMarkers(results.flat());
    } catch (err) {
      console.error('Erreur chargement markers:', err);
    }
  }, [itineraries]);

  // ── Fetch initial data ────────────────────────────────────────
  useEffect(() => {
    fetch('http://localhost:8000/itineraire')
      .then(res => res.ok ? res.json() : [])
      .then(data => { setItineraries(data); loadAllTripMarkers(data); })
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

  // ── Trip markers handlers ─────────────────────────────────────
  // Called by OrganizePanel when POIs are mutated (add/remove/reorder)
  const handleTripPoisChange = () => loadAllTripMarkers();

  // Rafraîchit markers + POIs du PanelsContainer quand le planner mute un POI
  const handlePlannerPoisChange = useCallback(async () => {
    loadAllTripMarkers();
    const trip = plannerTripRef.current;
    if (!trip) return;
    try {
      const res = await fetch(`http://localhost:8000/itineraire/${trip.id}/plan`);
      if (res.ok) setRoutePanelPois(await res.json());
    } catch (e) {}
  }, [loadAllTripMarkers]);

  const handleTripMarkerClick = (poi) => {
    setSelectedPoi({
      name: poi.nom,
      category: poi.category || 'Lieu',
      coordinates: { lat: poi.latitude, lng: poi.longitude },
    });
  };

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
      addToast('Ajouté aux favoris', 'success');
    } catch (err) {
      console.error(err);
      addToast('Erreur lors de l\'ajout aux favoris', 'error');
    }
  };

  const handleRemoveFromFavorites = async (favoriteId) => {
    try {
      const res = await fetch(`http://localhost:8000/favorites/${favoriteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur suppression favori');
      setFavorites(prev => prev.filter(f => f.id !== favoriteId));
      addToast('Retiré des favoris', 'success');
    } catch (err) {
      console.error(err);
      addToast('Erreur lors de la suppression', 'error');
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
      loadAllTripMarkers();
      setShowItineraryModal(false);
      setSelectedPoi(null);
      addToast('POI ajouté au voyage', 'success');
    } catch (err) {
      console.error('Erreur ajout POI:', err);
      addToast('Erreur lors de l\'ajout du POI', 'error');
    }
  };

  // ── Nav / panel handlers ──────────────────────────────────────
  const closeWithAnimation = (panel) => {
    setClosingPanel(panel);
    setTimeout(() => { setActivePanel(null); setClosingPanel(null); }, 520);
  };
  const handleNavigate = (tab) => {
    if (activePanel === tab) closeWithAnimation(tab);
    else setActivePanel(tab);
  };
  const handleClosePanel = () => {
    if (activePanel) closeWithAnimation(activePanel);
  };

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

      // Cache par coordonnées — évite de refaire les appels si le trajet n'a pas changé
      let routeResult = routeCache.get(coords);
      if (!routeResult) {
        try {
          const [drivingRes, cyclingRes, walkingRes] = await Promise.all([
            fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?geometries=geojson&overview=full&access_token=${mapboxToken}`),
            fetch(`https://api.mapbox.com/directions/v5/mapbox/cycling/${coords}?geometries=geojson&overview=full&access_token=${mapboxToken}`),
            fetch(`https://api.mapbox.com/directions/v5/mapbox/walking/${coords}?geometries=geojson&overview=full&access_token=${mapboxToken}`),
          ]);
          if (!drivingRes.ok || !cyclingRes.ok || !walkingRes.ok) return;
          const [drivingData, cyclingData, walkingData] = await Promise.all([drivingRes.json(), cyclingRes.json(), walkingRes.json()]);
          routeResult = {
            driving: drivingData?.routes?.[0],
            cycling: cyclingData?.routes?.[0],
            walking: walkingData?.routes?.[0],
          };
          routeCache.set(coords, routeResult);
        } catch (e) {
          console.error('Erreur Directions API:', e);
          return;
        }
      }
      const { driving, cycling, walking } = routeResult;
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
      <Sidebar activeTab={activePanel} onNavigate={handleNavigate} settings={settings} plannerOpen={plannerOpen || plannerClosing} />

      <Map
        ref={mapRef}
        onPoiClick={handlePoiClick}
        routeGeojson={Object.keys(multiDayRoutes).length === 0 ? routeGeojson : null}
        multiDayRoutes={multiDayRoutes}
        markers={mapMarkers}
        tripMarkers={routePanelOpen ? [] : tripMarkers}
        onTripMarkerClick={handleTripMarkerClick}
        mapStyle={settings.mapStyle}
        defaultZoom={settings.defaultZoom}
        defaultLng={settings.defaultLng}
        defaultLat={settings.defaultLat}
      />

      {/* Backdrop subtil quand un panel est ouvert */}
      {activePanel && (
        <div
          className="fixed inset-0 z-[45] bg-black/5"
          onClick={handleClosePanel}
        />
      )}

      {selectedPoi && !showItineraryModal && (
        <PoiCard
          poi={selectedPoi}
          onClose={() => setSelectedPoi(null)}
          onAddToTrip={handleAddToTrip}
          onAddToFavorites={handleAddToFavorites}
          onRemoveFromFavorites={handleRemoveFromFavorites}
          favorites={favorites}
          searchOpen={searchOpen}
          settings={settings}
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
        searchOpen={searchOpen && !plannerOpen}
        favoritesOpen={favoritesOpen && !plannerOpen}
        tripsOpen={tripsOpen && !plannerOpen}
        organizeOpen={organizeOpen && !plannerOpen}
        settingsOpen={settingsOpen && !plannerOpen}
        onCloseAll={handleClosePanel}
        onCloseSearch={handleClosePanel}
        favorites={favorites}
        setFavorites={setFavorites}
        itineraries={itineraries}
        setItineraries={setItineraries}
        onPlaceSelect={handlePlaceSelect}
        mapboxToken={mapboxToken}
        onViewRoutes={handleViewRoutes}
        onTripPoisChange={handleTripPoisChange}
        onOpenPlanner={handleOpenPlanner}
        settings={settings}
        onSettingsChange={updateSettings}
        closingPanel={closingPanel}
      />

      <BottomPlanner
        isVisible={plannerOpen}
        isClosing={plannerClosing}
        onClose={handleClosePlanner}
        itinerary={plannerTrip}
        itineraries={itineraries}
        onTripPoisChange={handlePlannerPoisChange}
        height={plannerHeight}
        settings={settings}
      />

      <PanelsContainer
        isVisible={routePanelOpen}
        isClosing={plannerClosing}
        onClose={() => {}}
        onHeightChange={setPlannerHeight}
        itinerary={routePanelItinerary}
        planPois={routePanelPois}
        onDaysChange={handleDaysChange}
        routeDurations={routeDurations}
        defaultTransport={settings.defaultTransport}
        units={settings.units}
        settings={settings}
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
