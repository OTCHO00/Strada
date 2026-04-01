import { useState, useEffect } from 'react';
import { X, Star, MapPin, Plus, Trash2, ChevronDown, GripVertical, Navigation, Search, Calendar, Clock } from 'lucide-react';
import { useDragDrop } from './hooks/useDragDrop.js';

// ── Icône search inline ───────────────────────────────────────────────
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 16, height: 16 }}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

// ── Styles partagés ───────────────────────────────────────────────────
const searchPanel =
  'fixed top-4 right-4 bottom-4 w-80 z-50 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden';

const otherPanels =
  'fixed top-4 right-4 bottom-4 left-65 z-50 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden';

const panelHeader = 'flex items-center justify-between px-4 py-4 border-b border-gray-100 flex-shrink-0';

const closeBtn =
  'w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors';

const cardBase =
  'bg-gray-50 border border-gray-200 rounded-xl p-4 transition-colors hover:bg-gray-100';

const inputBase =
  'w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all';

const btnPrimary =
  'w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition-colors';

const btnSecondary =
  'px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors';

const emptyState = 'flex flex-col items-center justify-center py-16 text-center gap-3';

// ── SearchPanel ───────────────────────────────────────────────────────
function SearchPanel({ isVisible, onClose, onPlaceSelect, mapboxToken }) {
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (value) => {
    setSearchValue(value);
    if (value.length > 2) {
      setIsLoading(true);
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${mapboxToken}&autocomplete=true&limit=5`
        );
        const data = await res.json();
        setSuggestions(data.features || []);
      } catch (e) {
        console.error(e);
      }
      setIsLoading(false);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelect = (place) => {
    onPlaceSelect({ lng: place.center[0], lat: place.center[1], name: place.text, address: place.place_name });
    setSearchValue('');
    setSuggestions([]);
  };

  if (!isVisible) return null;

  return (
    <div className={searchPanel}>
      <div className={panelHeader}>
        <span className="text-sm font-medium text-gray-900">Recherche</span>
        <button onClick={onClose} className={closeBtn}>
          <X style={{ width: 15, height: 15 }} />
        </button>
      </div>

      <div className="p-4 border-b border-gray-100 flex-shrink-0">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && suggestions[0] && handleSelect(suggestions[0])}
            placeholder="Rechercher un lieu..."
            className="w-full pl-9 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
            autoFocus
          />
          {isLoading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {suggestions.length === 0 && !isLoading && searchValue.length > 2 && (
          <div className={emptyState}>
            <span className="text-gray-400 text-sm">Aucun résultat</span>
          </div>
        )}
        {suggestions.map((s) => (
          <button
            key={s.id}
            onClick={() => handleSelect(s)}
            className="w-full text-left flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all group"
          >
            <MapPin className="flex-shrink-0 mt-0.5 text-gray-400 group-hover:text-gray-600 transition-colors" style={{ width: 15, height: 15 }} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{s.text}</p>
              <p className="text-xs text-gray-400 truncate mt-0.5">{s.place_name}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── FavoritesPanel ────────────────────────────────────────────────────
function FavoritesPanel({ isVisible, onClose, favorites, setFavorites, onPlaceSelect }) {
  if (!isVisible) return null;

  return (
    <div className={otherPanels}>
      <div className={panelHeader}>
        <span className="text-sm font-medium text-gray-900">Favoris</span>
        <button onClick={onClose} className={closeBtn}>
          <X style={{ width: 15, height: 15 }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {favorites.length === 0 ? (
          <div className={emptyState}>
            <Star className="text-gray-300" style={{ width: 32, height: 32 }} />
            <p className="text-sm font-medium text-gray-600">Aucun favori</p>
            <p className="text-xs text-gray-400">Ajoutez des lieux depuis la carte</p>
          </div>
        ) : (
          <div className="space-y-2">
            {favorites.map((fav) => (
              <div key={fav.id} className={cardBase}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{fav.name}</p>
                    <p className="text-xs text-black mt-0.5 flex items-center gap-1">
                      <MapPin style={{ width: 11, height: 11 }} />
                      {fav.nom}
                    </p>
                  </div>
                  <button
                    onClick={() => setFavorites((p) => p.filter((f) => f.id !== fav.id))}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                  >
                    <Trash2 style={{ width: 13, height: 13 }} />
                  </button>
                </div>
                <button
                  onClick={() => {
                    if (fav.latitude && fav.longitude) {
                      onPlaceSelect({ lng: fav.longitude, lat: fav.latitude, name: fav.name, address: fav.address || fav.name });
                      onClose();
                    }
                  }}
                  disabled={!fav.latitude || !fav.longitude}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MapPin style={{ width: 12, height: 12 }} />
                  Voir sur la carte
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── TripsPanel ────────────────────────────────────────────────────────
function TripsPanel({ isVisible, onClose, itineraries, setItineraries }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', nb_jours: '', description: '' });
  const [expandedId, setExpandedId] = useState(null);
  const [plans, setPlans] = useState({}); // Stocker les plans de chaque voyage

  // Charger le plan pour chaque voyage au montage
  useEffect(() => {
    const loadPlans = async () => {
      const newPlans = {};
      for (const itin of itineraries) {
        try {
          const res = await fetch(`http://localhost:8000/itineraire/${itin.id}/plan`);
          if (res.ok) {
            const planData = await res.json();
            newPlans[itin.id] = Array.isArray(planData) ? planData : [];
          }
        } catch (e) {
          console.error('Erreur chargement plan:', e);
          newPlans[itin.id] = [];
        }
      }
      setPlans(newPlans);
    };
    
    if (itineraries.length > 0) {
      loadPlans();
    }
  }, [itineraries]);

  const handleCreate = async () => {
    if (!form.name || !form.nb_jours) return;
    try {
      const res = await fetch('http://localhost:8000/itineraire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const created = await res.json();
      setItineraries((p) => [...p, created]);
      setForm({ name: '', nb_jours: '', description: '' });
      setShowForm(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:8000/itineraire/${id}`, { method: 'DELETE' });
      setItineraries((p) => p.filter((i) => i.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePoi = async (itinId, poiId) => {
    try {
      await fetch(`http://localhost:8000/itineraire/${itinId}/poi/${poiId}`, { method: 'DELETE' });
      // Recharger le plan du voyage pour mettre à jour
      const res = await fetch(`http://localhost:8000/itineraire/${itinId}/plan`);
      if (res.ok) {
        const updatedPlan = await res.json();
        setPlans(prev => ({
          ...prev,
          [itinId]: Array.isArray(updatedPlan) ? updatedPlan : []
        }));
      }
    } catch (e) {
      console.error('Erreur suppression POI:', e);
    }
  };

  if (!isVisible) return null;

  return (
    <div className={otherPanels}>
      {/* HEADER */}
      <div className={panelHeader}>
        <span className="text-sm font-medium text-gray-900">Voyages</span>
        <button onClick={onClose} className={closeBtn}>
          <X style={{ width: 15, height: 15 }} />
        </button>
      </div>

      {/* FORM */}
      <div className="p-4 border-b border-gray-100 flex-shrink-0">
        {!showForm ? (
          <button onClick={() => setShowForm(true)} className={btnPrimary}>
            <Plus style={{ width: 14, height: 14 }} />
            Nouveau voyage
          </button>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nom du voyage"
              className={inputBase}
            />
            <input
              type="number"
              value={form.nb_jours}
              onChange={(e) => setForm({ ...form, nb_jours: e.target.value })}
              placeholder="Nombre de jours"
              min="1"
              className={inputBase}
            />
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description (optionnel)"
              className={inputBase}
            />
            <div className="flex gap-2">
              <button onClick={handleCreate} className="flex-1 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition-colors">
                Créer
              </button>
              <button onClick={() => setShowForm(false)} className={btnSecondary}>
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto p-4">
        {itineraries.length === 0 ? (
          <div className={emptyState}>
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <MapPin className="text-gray-400" style={{ width: 16, height: 16 }} />
            </div>
            <p className="text-sm font-medium text-gray-600">Aucun voyage</p>
            <p className="text-xs text-gray-400">Créez votre premier voyage</p>
          </div>
        ) : (
          <div className="space-y-2">
            {itineraries.map((itin) => {
              const totalPois = plans[itin.id]?.length || 0;
              const isOpen = expandedId === itin.id;
              
              return (
                <div key={itin.id} className={cardBase}>
                  
                  {/* ROW CLICKABLE */}
                  <div
                    onClick={() => setExpandedId(isOpen ? null : itin.id)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    {/* INFOS */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {itin.nom}
                      </p>
                    </div>
                    
                    {/* ACTIONS */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      
                      {/* DELETE */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(itin.id);
                        }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 style={{ width: 13, height: 13 }} />
                      </button>

                      {/* CHEVRON */}
                      <ChevronDown
                        className={`text-gray-400 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                        style={{ width: 15, height: 15 }}
                      />
                    </div>
                  </div>

                  {/* EXPANDED */}
                  {isOpen && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-500 mb-2">
                        Lieux à visiter ({totalPois} lieu{totalPois > 1 ? 'x' : ''})
                      </div>
                      
                      {/* Afficher les POI du plan */}
                      {plans[itin.id]?.map((poi, index) => (
                        <div key={poi.id} className="bg-gray-50 rounded-lg p-3 mb-2 border border-gray-100">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {poi.name || poi.properties?.name || poi.properties?.name_en || `POI ${index + 1}`}
                              </p>
                              <div className="text-xs text-gray-400 space-y-1"> </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePoi(poi.id);
                                }}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors"
                              >
                                <Trash2 style={{ width: 13, height: 13 }} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {isOpen && itin.description && (
                    <p className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                      {itin.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
function OrganizePanel({ isVisible, onClose, itineraries, setItineraries }) {
  const [selectedId, setSelectedId] = useState(null);
  const [planPois, setPlanPois] = useState([]);
  const [calendar, setCalendar] = useState({});
  const [draggedPoi, setDraggedPoi] = useState(null);
  const [dragSource, setDragSource] = useState(null);
  const [dragOverDay, setDragOverDay] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchPlan = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/itineraire/${id}/plan`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      const pool = list.filter(p => !p.day || p.day === 0);
      const itin = itineraries.find(i => i.id === id);
      const cal = {};
      for (let d = 1; d <= (itin?.nb_jours || 0); d++) {
        cal[d] = list.filter(p => p.day === d).sort((a, b) => (a.position || 0) - (b.position || 0));
      }
      setPlanPois(pool);
      setCalendar(cal);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTrip = (id) => {
    setSelectedId(id);
    setCalendar({});
    setPlanPois([]);
    fetchPlan(id);
  };

  const handleDragStart = (poi, source) => {
    setDraggedPoi(poi);
    setDragSource(source);
  };

  const handleDropOnDay = async (day) => {
    setDragOverDay(null);
    if (!draggedPoi) return;
    const poi = draggedPoi;
    const source = dragSource;

    if (source === 'pool') {
      setPlanPois(prev => prev.filter(p => p.id !== poi.id));
      setCalendar(prev => ({
        ...prev,
        [day]: [...(prev[day] || []), { ...poi, day, position: prev[day]?.length || 0 }],
      }));
    } else if (source?.startsWith('day-')) {
      const fromDay = parseInt(source.replace('day-', ''));
      if (fromDay === day) return;
      setCalendar(prev => ({
        ...prev,
        [fromDay]: prev[fromDay].filter(p => p.id !== poi.id),
        [day]: [...(prev[day] || []), { ...poi, day, position: prev[day]?.length || 0 }],
      }));
    }

    try {
      await fetch(`http://localhost:8000/itineraire/${selectedId}/poi/${poi.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day, position: 0 }),
      });
    } catch (e) { console.error(e); }

    setDraggedPoi(null);
    setDragSource(null);
  };

  const handleDropOnPool = async () => {
    if (!draggedPoi || dragSource === 'pool') return;
    const poi = draggedPoi;
    const fromDay = parseInt(dragSource.replace('day-', ''));
    setCalendar(prev => ({ ...prev, [fromDay]: prev[fromDay].filter(p => p.id !== poi.id) }));
    setPlanPois(prev => [...prev, { ...poi, day: 0 }]);
    try {
      await fetch(`http://localhost:8000/itineraire/${selectedId}/poi/${poi.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day: 0, position: 0 }),
      });
    } catch (e) { console.error(e); }
    setDraggedPoi(null);
    setDragSource(null);
  };

  const handleDeletePoi = async (poiId, day) => {
    try {
      await fetch(`http://localhost:8000/itineraire/${selectedId}/poi/${poiId}`, { method: 'DELETE' });
      if (!day || day === 0) {
        setPlanPois(prev => prev.filter(p => p.id !== poiId));
      } else {
        setCalendar(prev => ({ ...prev, [day]: prev[day].filter(p => p.id !== poiId) }));
      }
    } catch (e) { console.error(e); }
  };

  if (!isVisible) return null;

  const selectedItin = itineraries.find(i => i.id === selectedId);
  const days = Array.from({ length: selectedItin?.nb_jours || 0 }, (_, i) => i + 1);
  const totalPlanned = Object.values(calendar).reduce((s, a) => s + a.length, 0);

  return (
    <div className={otherPanels}>

      {/* Header */}
      <div className={panelHeader}>
        <span className="text-sm font-medium text-gray-900">Organisation</span>
        <button onClick={onClose} className={closeBtn}>
          <X style={{ width: 15, height: 15 }} />
        </button>
      </div>

      {/* Sélecteur */}
      <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0 flex items-center gap-3">
        <select
          value={selectedId || ''}
          onChange={(e) => handleSelectTrip(parseInt(e.target.value))}
          className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 appearance-none cursor-pointer"
        >
          <option value="">Sélectionner un voyage…</option>
          {itineraries.map(i => (
            <option key={i.id} value={i.id}>{i.nom}</option>
          ))}
        </select>
        {selectedItin && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {totalPlanned > 0 && (
              <span className="text-xs text-gray-400">{totalPlanned} planifié{totalPlanned > 1 ? 's' : ''}</span>
            )}
            <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full whitespace-nowrap">
              {selectedItin.nb_jours}j
            </span>
          </div>
        )}
      </div>

      {!selectedId ? (
        /* Empty state */
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <Calendar className="text-gray-300" style={{ width: 18, height: 18 }} />
          </div>
          <p className="text-sm font-medium text-gray-500">Choisissez un voyage</p>
          <p className="text-xs text-gray-400">Pour organiser vos lieux jour par jour</p>
        </div>
      ) : loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
        </div>
      ) : (
        /* Layout horizontal : dossier | jours */
        <div className="flex flex-1 overflow-hidden">

          {/* ── Colonne Dossier (fixe) ── */}
          <div className="w-44 border-r border-gray-100 flex flex-col flex-shrink-0">
            <div className="px-3 pt-3 pb-2 flex-shrink-0">
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                Dossier
                {planPois.length > 0 && (
                  <span className="ml-1.5 text-gray-300">({planPois.length})</span>
                )}
              </p>
            </div>
            <div
              className="flex-1 overflow-y-auto px-2 pb-3 flex flex-col gap-1.5"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDropOnPool}
            >
              {planPois.length === 0 ? (
                <p className="text-[10px] text-gray-300 text-center pt-8 leading-relaxed px-2">
                  Tous les lieux sont planifiés ✓
                </p>
              ) : planPois.map(poi => (
                <div
                  key={poi.id}
                  draggable
                  onDragStart={() => handleDragStart(poi, 'pool')}
                  className="group bg-gray-50 border border-gray-200 rounded-lg p-2 cursor-grab hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all active:cursor-grabbing select-none"
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium text-gray-800 leading-tight truncate">
                        {poi.name || poi.properties?.name || poi.properties?.name_en || 'Sans nom'}
                      </p>
                      {(poi.properties?.address) && (
                        <p className="text-[10px] text-gray-400 truncate mt-0.5">
                          {poi.properties.address}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeletePoi(poi.id, 0)}
                      className="w-4 h-4 rounded flex items-center justify-center text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 mt-0.5"
                    >
                      <X style={{ width: 9, height: 9 }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Colonnes Jours (scroll horizontal) ── */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <div
              className="flex gap-2 p-3 h-full"
              style={{ width: 'max-content', minWidth: '100%' }}
            >
              {days.map(day => {
                const dayPois = calendar[day] || [];
                const hasItems = dayPois.length > 0;
                const isOver = dragOverDay === day;

                return (
                  <div
                    key={day}
                    onDragOver={(e) => { e.preventDefault(); setDragOverDay(day); }}
                    onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverDay(null); }}
                    onDrop={() => handleDropOnDay(day)}
                    className="flex flex-col flex-shrink-0 h-full"
                    style={{ width: 140 }}
                  >
                    {/* En-tête du jour */}
                    <div className={`flex items-center justify-between px-2.5 py-2 mb-1.5 rounded-xl transition-colors ${
                      isOver ? 'bg-gray-900' : 'bg-gray-50'
                    }`}>
                      <span className={`text-[11px] font-medium transition-colors ${
                        isOver ? 'text-white' : hasItems ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        Jour {day}
                      </span>
                      {hasItems && !isOver && (
                        <span className="text-[10px] text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded-full">
                          {dayPois.length}
                        </span>
                      )}
                    </div>

                    {/* Zone de drop */}
                    <div className={`flex-1 rounded-xl border-2 transition-all overflow-y-auto p-1.5 flex flex-col gap-1 ${
                      isOver
                        ? 'border-gray-900 bg-gray-50'
                        : hasItems
                          ? 'border-gray-200 bg-white'
                          : 'border-dashed border-gray-200 bg-gray-50/40'
                    }`}>
                      {!hasItems && !isOver && (
                        <p className="text-[10px] text-gray-300 text-center m-auto">
                          Glisser ici
                        </p>
                      )}
                      {isOver && !hasItems && (
                        <p className="text-[10px] text-gray-500 text-center m-auto">
                          ↓ Déposer
                        </p>
                      )}
                      {dayPois.map((poi, idx) => (
                        <div
                          key={poi.id}
                          draggable
                          onDragStart={() => handleDragStart(poi, `day-${day}`)}
                          className="group flex items-start gap-1.5 p-2 bg-gray-50 border border-gray-200 rounded-lg cursor-grab hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all active:cursor-grabbing select-none flex-shrink-0"
                        >
                          <div className="w-4 h-4 rounded-full bg-gray-900 text-white text-[8px] font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium text-gray-800 leading-tight break-words">
                              {poi.name || poi.properties?.name || poi.properties?.name_en || 'Sans nom'}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeletePoi(poi.id, day)}
                            className="w-4 h-4 rounded flex items-center justify-center text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                          >
                            <X style={{ width: 9, height: 9 }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      {selectedItin && (
        <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
          <button className={btnPrimary}>
            <Navigation style={{ width: 13, height: 13 }} />
            Voir les trajets
          </button>
        </div>
      )}
    </div>
  );
}

// ── RightPanel ────────────────────────────────────────────────────────
function RightPanel({ searchOpen, favoritesOpen, tripsOpen, organizeOpen, onCloseAll, onCloseSearch, favorites, setFavorites, itineraries, setItineraries, onPlaceSelect, mapboxToken }) {
  return (
    <>
      <SearchPanel isVisible={searchOpen} onClose={onCloseSearch} onPlaceSelect={onPlaceSelect} mapboxToken={mapboxToken} />
      <FavoritesPanel isVisible={favoritesOpen} onClose={onCloseAll} favorites={favorites} setFavorites={setFavorites} onPlaceSelect={onPlaceSelect} />
      <TripsPanel isVisible={tripsOpen} onClose={onCloseAll} itineraries={itineraries} setItineraries={setItineraries} />
      <OrganizePanel isVisible={organizeOpen} onClose={onCloseAll} itineraries={itineraries} setItineraries={setItineraries} />
    </>
  );
}

export default RightPanel;