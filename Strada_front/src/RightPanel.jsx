import { useState, useEffect } from 'react';
import { X, Star, MapPin, Plus, Trash2, ChevronDown, Navigation, Calendar, Search } from 'lucide-react';

// ── Shared styles ─────────────────────────────────────────────────────
const panelShell =
  'fixed top-0 right-0 h-full z-50 bg-white flex flex-col overflow-hidden panel-slide';

const searchPanelCls = panelShell + ' w-full sm:w-[340px] border-l border-[#e5e5ea]';
const otherPanelsCls = panelShell + ' w-full sm:w-[380px] border-l border-[#e5e5ea]';

const panelHeader =
  'flex items-center justify-between px-5 py-4 border-b border-[#f0f0f4] flex-shrink-0';

const closeBtn =
  'w-8 h-8 rounded-lg flex items-center justify-center text-[#aeaeb2] hover:bg-[#f2f2f5] hover:text-[#1c1c1e] transition-colors';

const inputBase =
  'w-full px-3 py-2.5 bg-[#f8f8fa] border border-[#e5e5ea] rounded-xl text-sm text-[#1c1c1e] placeholder-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-[#1c1c1e]/10 focus:border-[#1c1c1e]/30 transition-all';

const btnPrimary =
  'w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1c1c1e] text-white text-sm font-medium rounded-xl hover:bg-[#3a3a3c] transition-colors';

const btnSecondary =
  'px-4 py-2.5 bg-[#f2f2f5] text-[#1c1c1e] text-sm font-medium rounded-xl hover:bg-[#e5e5ea] transition-colors';

const emptyState =
  'flex flex-col items-center justify-center py-16 text-center gap-3 px-6';

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
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${mapboxToken}&autocomplete=true&limit=6`
        );
        const data = await res.json();
        setSuggestions(data.features || []);
      } catch (e) { console.error(e); }
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
    <div className={searchPanelCls} style={{ boxShadow: 'var(--shadow-panel)' }}>
      {/* Header */}
      <div className={panelHeader}>
        <div>
          <p className="text-sm font-semibold text-[#1c1c1e]">Recherche</p>
          <p className="text-xs text-[#aeaeb2] mt-0.5">Trouvez un lieu sur la carte</p>
        </div>
        <button onClick={onClose} className={closeBtn}>
          <X style={{ width: 15, height: 15 }} />
        </button>
      </div>

      {/* Search input */}
      <div className="px-5 py-4 border-b border-[#f0f0f4] flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aeaeb2]" style={{ width: 15, height: 15 }} />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && suggestions[0] && handleSelect(suggestions[0])}
            placeholder="Ville, monument, adresse…"
            className="w-full pl-9 pr-9 py-2.5 bg-[#f2f2f7] border-0 rounded-xl text-sm text-[#1c1c1e] placeholder-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-[#1c1c1e]/10 transition-all"
            autoFocus
          />
          {isLoading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-[#d1d1d6] border-t-[#6c6c70] rounded-full animate-spin" />
            </span>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {suggestions.length === 0 && !isLoading && searchValue.length === 0 && (
          <div className={emptyState}>
            <div className="w-12 h-12 rounded-2xl bg-[#f2f2f7] flex items-center justify-center">
              <Search className="text-[#aeaeb2]" style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <p className="text-sm font-medium text-[#6c6c70]">Recherchez un lieu</p>
              <p className="text-xs text-[#aeaeb2] mt-1">Tapez pour commencer</p>
            </div>
          </div>
        )}
        {suggestions.length === 0 && !isLoading && searchValue.length > 2 && (
          <div className={emptyState}>
            <p className="text-sm text-[#6c6c70]">Aucun résultat pour</p>
            <p className="text-sm font-medium text-[#1c1c1e]">"{searchValue}"</p>
          </div>
        )}
        {suggestions.length > 0 && (
          <div className="py-2">
            {suggestions.map((s, i) => (
              <button
                key={s.id}
                onClick={() => handleSelect(s)}
                className="w-full text-left flex items-center gap-3 px-5 py-3 hover:bg-[#f8f8fa] transition-colors group"
              >
                <div className="w-8 h-8 rounded-xl bg-[#f2f2f7] flex items-center justify-center flex-shrink-0 group-hover:bg-[#e5e5ea] transition-colors">
                  <MapPin className="text-[#6c6c70]" style={{ width: 14, height: 14 }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#1c1c1e] truncate">{s.text}</p>
                  <p className="text-xs text-[#aeaeb2] truncate mt-0.5">{s.place_name}</p>
                </div>
                <ChevronDown className="text-[#d1d1d6] flex-shrink-0 -rotate-90 opacity-0 group-hover:opacity-100 transition-opacity" style={{ width: 14, height: 14 }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── FavoritesPanel ────────────────────────────────────────────────────
function FavoritesPanel({ isVisible, onClose, favorites, setFavorites, onPlaceSelect }) {
  const [deletingId, setDeletingId] = useState(null);

  const handleDeleteFavorite = async (favId) => {
    try {
      setDeletingId(favId);
      const response = await fetch(`http://localhost:8000/favorites/${favId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(`Erreur: ${response.status}`);
      setFavorites((prev) => prev.filter((f) => f.id !== favId));
    } catch (error) {
      console.error('Erreur suppression favori:', error);
      alert('Erreur lors de la suppression du favori.');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isVisible) return null;

  return (
    <div className={otherPanelsCls} style={{ boxShadow: 'var(--shadow-panel)' }}>
      {/* Header */}
      <div className={panelHeader}>
        <div>
          <p className="text-sm font-semibold text-[#1c1c1e]">Favoris</p>
          <p className="text-xs text-[#aeaeb2] mt-0.5">
            {favorites.length === 0 ? 'Aucun favori' : `${favorites.length} lieu${favorites.length > 1 ? 'x' : ''} enregistré${favorites.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={onClose} className={closeBtn}>
          <X style={{ width: 15, height: 15 }} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {favorites.length === 0 ? (
          <div className={emptyState}>
            <div className="w-12 h-12 rounded-2xl bg-[#f2f2f7] flex items-center justify-center">
              <Star className="text-[#d1d1d6]" style={{ width: 22, height: 22 }} />
            </div>
            <div>
              <p className="text-sm font-medium text-[#6c6c70]">Aucun favori</p>
              <p className="text-xs text-[#aeaeb2] mt-1">Cliquez sur un lieu puis "Favori"</p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {favorites.map((fav) => (
              <div
                key={fav.id}
                className="group bg-white border border-[#f0f0f4] rounded-2xl overflow-hidden hover:border-[#e5e5ea] hover:shadow-sm transition-all"
              >
                {/* Top row */}
                <div className="flex items-start gap-3 p-4">
                  <div className="w-9 h-9 rounded-xl bg-[#f2f2f7] flex items-center justify-center flex-shrink-0">
                    <Star className="text-[#6c6c70]" style={{ width: 15, height: 15 }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1c1c1e] truncate">{fav.nom || fav.name}</p>
                    {fav.category && (
                      <span className="inline-block mt-1 text-[11px] font-medium text-[#6c6c70] bg-[#f2f2f7] px-2 py-0.5 rounded-full">
                        {fav.category}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteFavorite(fav.id)}
                    disabled={deletingId === fav.id}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#d1d1d6] hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                  >
                    {deletingId === fav.id
                      ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                      : <Trash2 style={{ width: 13, height: 13 }} />}
                  </button>
                </div>

                {/* Footer action */}
                <div className="border-t border-[#f0f0f4] px-4 py-2.5">
                  <button
                    onClick={() => {
                      if (fav.latitude && fav.longitude) {
                        onPlaceSelect({ lng: fav.longitude, lat: fav.latitude, name: fav.nom || fav.name });
                        onClose();
                      }
                    }}
                    disabled={!fav.latitude || !fav.longitude}
                    className="flex items-center gap-1.5 text-xs font-medium text-[#6c6c70] hover:text-[#1c1c1e] transition-colors disabled:opacity-40"
                  >
                    <MapPin style={{ width: 11, height: 11 }} />
                    Voir sur la carte
                  </button>
                </div>
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
  const [form, setForm] = useState({ nom: '', nb_jours: '', description: '' });
  const [expandedId, setExpandedId] = useState(null);
  const [plans, setPlans] = useState({});

  useEffect(() => {
    const loadPlans = async () => {
      const newPlans = {};
      for (const itin of itineraries) {
        try {
          const res = await fetch(`http://localhost:8000/itineraire/${itin.id}/plan`);
          if (res.ok) newPlans[itin.id] = await res.json();
        } catch (e) { newPlans[itin.id] = []; }
      }
      setPlans(newPlans);
    };
    if (itineraries.length > 0) loadPlans();
  }, [itineraries]);

  const handleCreate = async () => {
    if (!form.nom || !form.nb_jours) return;
    try {
      const res = await fetch('http://localhost:8000/itineraire', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const created = await res.json();
      setItineraries((p) => [...p, created]);
      setForm({ nom: '', nb_jours: '', description: '' });
      setShowForm(false);
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:8000/itineraire/${id}`, { method: 'DELETE' });
      setItineraries((p) => p.filter((i) => i.id !== id));
    } catch (e) { console.error(e); }
  };

  const handleDeletePoi = async (itinId, poiId) => {
    try {
      await fetch(`http://localhost:8000/itineraire/${itinId}/poi/${poiId}`, { method: 'DELETE' });
      const res = await fetch(`http://localhost:8000/itineraire/${itinId}/plan`);
      if (res.ok) setPlans(prev => ({ ...prev, [itinId]: await res.json() }));
    } catch (e) { console.error(e); }
  };

  if (!isVisible) return null;

  return (
    <div className={otherPanelsCls} style={{ boxShadow: 'var(--shadow-panel)' }}>
      {/* Header */}
      <div className={panelHeader}>
        <div>
          <p className="text-sm font-semibold text-[#1c1c1e]">Voyages</p>
          <p className="text-xs text-[#aeaeb2] mt-0.5">
            {itineraries.length === 0 ? 'Aucun voyage' : `${itineraries.length} voyage${itineraries.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1c1c1e] text-white text-xs font-medium rounded-lg hover:bg-[#3a3a3c] transition-colors"
            >
              <Plus style={{ width: 12, height: 12 }} />
              Nouveau
            </button>
          )}
          <button onClick={onClose} className={closeBtn}>
            <X style={{ width: 15, height: 15 }} />
          </button>
        </div>
      </div>

      {/* Creation form */}
      {showForm && (
        <div className="px-5 py-4 border-b border-[#f0f0f4] flex-shrink-0 space-y-3 fade-up">
          <p className="text-xs font-semibold text-[#6c6c70] uppercase tracking-wider">Nouveau voyage</p>
          <input type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Nom du voyage" className={inputBase} autoFocus />
          <input type="number" value={form.nb_jours} onChange={(e) => setForm({ ...form, nb_jours: e.target.value })} placeholder="Nombre de jours" min="1" className={inputBase} />
          <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description (optionnel)" className={inputBase} />
          <div className="flex gap-2 pt-1">
            <button onClick={handleCreate} className="flex-1 py-2.5 bg-[#1c1c1e] text-white text-sm font-medium rounded-xl hover:bg-[#3a3a3c] transition-colors">Créer</button>
            <button onClick={() => setShowForm(false)} className={btnSecondary}>Annuler</button>
          </div>
        </div>
      )}

      {/* Trip list */}
      <div className="flex-1 overflow-y-auto">
        {itineraries.length === 0 ? (
          <div className={emptyState}>
            <div className="w-12 h-12 rounded-2xl bg-[#f2f2f7] flex items-center justify-center">
              <MapPin className="text-[#d1d1d6]" style={{ width: 22, height: 22 }} />
            </div>
            <div>
              <p className="text-sm font-medium text-[#6c6c70]">Aucun voyage</p>
              <p className="text-xs text-[#aeaeb2] mt-1">Créez votre premier itinéraire</p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {itineraries.map((itin) => {
              const pois = plans[itin.id] || [];
              const isExpanded = expandedId === itin.id;

              return (
                <div
                  key={itin.id}
                  className="bg-white border border-[#f0f0f4] rounded-2xl overflow-hidden hover:border-[#e5e5ea] transition-all"
                >
                  {/* Trip row */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : itin.id)}
                    className="flex items-center gap-3 p-4 cursor-pointer"
                  >
                    {/* Color accent */}
                    <div className="w-2 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: `hsl(${(itin.id * 67) % 360}, 55%, 58%)` }} />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1c1c1e] truncate">{itin.nom || 'Voyage sans nom'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-[#aeaeb2]">{pois.length} lieu{pois.length > 1 ? 'x' : ''}</span>
                        {itin.description && <span className="text-[11px] text-[#aeaeb2] truncate">· {itin.description}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[11px] font-semibold text-[#6c6c70] bg-[#f2f2f7] px-2 py-1 rounded-lg">
                        {itin.nb_jours}j
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(itin.id); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[#d1d1d6] hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 style={{ width: 13, height: 13 }} />
                      </button>
                      <ChevronDown className={`text-[#aeaeb2] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} style={{ width: 15, height: 15 }} />
                    </div>
                  </div>

                  {/* Expanded POI list */}
                  {isExpanded && (
                    <div className="border-t border-[#f0f0f4] px-4 py-3 space-y-1.5 fade-up">
                      {pois.length === 0 ? (
                        <p className="text-xs text-[#aeaeb2] py-2 text-center">Aucun lieu ajouté</p>
                      ) : pois.map((poi, idx) => (
                        <div key={poi.id} className="group flex items-center gap-2.5 py-2 px-2 rounded-xl hover:bg-[#f8f8fa]">
                          <span className="w-5 h-5 rounded-full bg-[#f2f2f7] text-[#6c6c70] text-[10px] font-semibold flex items-center justify-center flex-shrink-0">
                            {idx + 1}
                          </span>
                          <p className="flex-1 text-xs font-medium text-[#1c1c1e] truncate">
                            {poi.name || poi.properties?.name || `POI ${idx + 1}`}
                          </p>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeletePoi(itin.id, poi.id); }}
                            className="w-6 h-6 rounded flex items-center justify-center text-[#d1d1d6] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X style={{ width: 11, height: 11 }} />
                          </button>
                        </div>
                      ))}
                    </div>
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

// ── OrganizePanel ─────────────────────────────────────────────────────
function OrganizePanel({ isVisible, onClose, itineraries, setItineraries, onViewRoutes }) {
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
      for (let d = 1; d <= (itin?.nb_jours || 0); d++)
        cal[d] = list.filter(p => p.day === d).sort((a, b) => (a.position || 0) - (b.position || 0));
      setPlanPois(pool);
      setCalendar(cal);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSelectTrip = (id) => { setSelectedId(id); setCalendar({}); setPlanPois([]); fetchPlan(id); };

  const handleDragStart = (poi, source) => { setDraggedPoi(poi); setDragSource(source); };

  const handleDropOnDay = async (day) => {
    setDragOverDay(null);
    if (!draggedPoi) return;
    const poi = draggedPoi; const source = dragSource;
    if (source === 'pool') {
      setPlanPois(prev => prev.filter(p => p.id !== poi.id));
      setCalendar(prev => ({ ...prev, [day]: [...(prev[day] || []), { ...poi, day, position: prev[day]?.length || 0 }] }));
    } else if (source?.startsWith('day-')) {
      const fromDay = parseInt(source.replace('day-', ''));
      if (fromDay === day) return;
      setCalendar(prev => ({ ...prev, [fromDay]: prev[fromDay].filter(p => p.id !== poi.id), [day]: [...(prev[day] || []), { ...poi, day, position: prev[day]?.length || 0 }] }));
    }
    try {
      await fetch(`http://localhost:8000/itineraire/${selectedId}/poi/${poi.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ day, position: 0 }),
      });
    } catch (e) { console.error(e); }
    setDraggedPoi(null); setDragSource(null);
  };

  const handleDropOnPool = async () => {
    if (!draggedPoi || dragSource === 'pool') return;
    const poi = draggedPoi; const fromDay = parseInt(dragSource.replace('day-', ''));
    setCalendar(prev => ({ ...prev, [fromDay]: prev[fromDay].filter(p => p.id !== poi.id) }));
    setPlanPois(prev => [...prev, { ...poi, day: 0 }]);
    try {
      await fetch(`http://localhost:8000/itineraire/${selectedId}/poi/${poi.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ day: 0, position: 0 }),
      });
    } catch (e) { console.error(e); }
    setDraggedPoi(null); setDragSource(null);
  };

  const handleDeletePoi = async (poiId, day) => {
    try {
      await fetch(`http://localhost:8000/itineraire/${selectedId}/poi/${poiId}`, { method: 'DELETE' });
      if (!day || day === 0) setPlanPois(prev => prev.filter(p => p.id !== poiId));
      else setCalendar(prev => ({ ...prev, [day]: prev[day].filter(p => p.id !== poiId) }));
    } catch (e) { console.error(e); }
  };

  if (!isVisible) return null;

  const selectedItin = itineraries.find(i => i.id === selectedId);
  const days = Array.from({ length: selectedItin?.nb_jours || 0 }, (_, i) => i + 1);
  const totalPlanned = Object.values(calendar).reduce((s, a) => s + a.length, 0);

  return (
    <div className={otherPanelsCls} style={{ boxShadow: 'var(--shadow-panel)' }}>
      {/* Header */}
      <div className={panelHeader}>
        <div>
          <p className="text-sm font-semibold text-[#1c1c1e]">Organisation</p>
          <p className="text-xs text-[#aeaeb2] mt-0.5">Planifiez jour par jour</p>
        </div>
        <button onClick={onClose} className={closeBtn}><X style={{ width: 15, height: 15 }} /></button>
      </div>

      {/* Trip selector */}
      <div className="px-5 py-3 border-b border-[#f0f0f4] flex-shrink-0 flex items-center gap-3">
        <select
          value={selectedId || ''}
          onChange={(e) => handleSelectTrip(parseInt(e.target.value))}
          className="flex-1 px-3 py-2 bg-[#f8f8fa] border border-[#e5e5ea] rounded-xl text-xs text-[#1c1c1e] focus:outline-none focus:ring-2 focus:ring-[#1c1c1e]/10 appearance-none cursor-pointer"
        >
          <option value="">Choisir un voyage…</option>
          {itineraries.map(i => <option key={i.id} value={i.id}>{i.nom || 'Voyage sans nom'}</option>)}
        </select>
        {selectedItin && (
          <span className="text-[11px] font-semibold text-[#6c6c70] bg-[#f2f2f7] px-2 py-1 rounded-lg flex-shrink-0">{selectedItin.nb_jours}j · {totalPlanned} planifié{totalPlanned > 1 ? 's' : ''}</span>
        )}
      </div>

      {!selectedId ? (
        <div className={emptyState}>
          <div className="w-12 h-12 rounded-2xl bg-[#f2f2f7] flex items-center justify-center">
            <Calendar className="text-[#d1d1d6]" style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <p className="text-sm font-medium text-[#6c6c70]">Choisissez un voyage</p>
            <p className="text-xs text-[#aeaeb2] mt-1">Pour organiser vos lieux</p>
          </div>
        </div>
      ) : loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-[#e5e5ea] border-t-[#6c6c70] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Pool */}
          <div className="w-44 border-r border-[#f0f0f4] flex flex-col flex-shrink-0">
            <div className="px-3 pt-3 pb-2">
              <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-wider">
                Dossier {planPois.length > 0 && <span className="text-[#d1d1d6]">({planPois.length})</span>}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-3 flex flex-col gap-1.5" onDragOver={e => e.preventDefault()} onDrop={handleDropOnPool}>
              {planPois.length === 0 ? (
                <p className="text-[10px] text-[#d1d1d6] text-center pt-8 px-2 leading-relaxed">Tous les lieux sont planifiés ✓</p>
              ) : planPois.map(poi => (
                <div key={poi.id} draggable onDragStart={() => handleDragStart(poi, 'pool')}
                  className="group bg-[#f8f8fa] border border-[#e5e5ea] rounded-xl p-2.5 cursor-grab hover:bg-white hover:shadow-sm transition-all active:cursor-grabbing select-none">
                  <div className="flex items-start gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium text-[#1c1c1e] leading-tight truncate">
                        {poi.name || poi.properties?.name || 'Sans nom'}
                      </p>
                    </div>
                    <button onClick={() => handleDeletePoi(poi.id, 0)} className="w-4 h-4 rounded flex items-center justify-center text-[#d1d1d6] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                      <X style={{ width: 9, height: 9 }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Day columns */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <div className="flex gap-2 p-3 h-full" style={{ width: 'max-content', minWidth: '100%' }}>
              {days.map(day => {
                const dayPois = calendar[day] || [];
                const hasItems = dayPois.length > 0;
                const isOver = dragOverDay === day;
                const dayColor = `hsl(${((day - 1) * 137.5) % 360}, 55%, 52%)`;

                return (
                  <div key={day}
                    onDragOver={e => { e.preventDefault(); setDragOverDay(day); }}
                    onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverDay(null); }}
                    onDrop={() => handleDropOnDay(day)}
                    className="flex flex-col flex-shrink-0 h-full" style={{ width: 136 }}>

                    {/* Day header */}
                    <div className={`flex items-center justify-between px-2.5 py-2 mb-1.5 rounded-xl transition-all ${isOver ? 'text-white' : ''}`}
                      style={{ backgroundColor: isOver ? dayColor : '#f8f8fa' }}>
                      <span className={`text-[11px] font-semibold ${isOver ? 'text-white' : hasItems ? 'text-[#1c1c1e]' : 'text-[#aeaeb2]'}`}>
                        Jour {day}
                      </span>
                      {hasItems && !isOver && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: dayColor }}>
                          {dayPois.length}
                        </span>
                      )}
                    </div>

                    {/* Drop zone */}
                    <div className={`flex-1 rounded-xl border-2 transition-all overflow-y-auto p-1.5 flex flex-col gap-1 ${
                      isOver ? 'border-dashed bg-[#f8f8fa]' : hasItems ? 'border-[#e5e5ea] bg-white' : 'border-dashed border-[#e5e5ea] bg-[#fafafa]'
                    }`} style={{ borderColor: isOver ? dayColor : undefined }}>
                      {!hasItems && !isOver && <p className="text-[10px] text-[#d1d1d6] text-center m-auto">Glisser ici</p>}
                      {isOver && !hasItems && <p className="text-[10px] text-[#6c6c70] text-center m-auto">↓ Déposer</p>}
                      {dayPois.map((poi, idx) => (
                        <div key={poi.id} draggable onDragStart={() => handleDragStart(poi, `day-${day}`)}
                          className="group flex items-start gap-1.5 p-2 bg-[#f8f8fa] border border-[#e5e5ea] rounded-xl cursor-grab hover:bg-white hover:shadow-sm transition-all active:cursor-grabbing select-none flex-shrink-0">
                          <div className="w-4 h-4 rounded-full text-white text-[8px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: dayColor }}>
                            {idx + 1}
                          </div>
                          <p className="text-[11px] font-medium text-[#1c1c1e] leading-tight flex-1 break-words">
                            {poi.name || poi.properties?.name || 'Sans nom'}
                          </p>
                          <button onClick={() => handleDeletePoi(poi.id, day)} className="w-4 h-4 rounded flex items-center justify-center text-[#d1d1d6] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
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

      {selectedItin && (
        <div className="px-5 py-4 border-t border-[#f0f0f4] flex-shrink-0">
          <button onClick={() => onViewRoutes(selectedItin, [...planPois, ...Object.values(calendar).flat()])} className={btnPrimary}>
            <Navigation style={{ width: 13, height: 13 }} />
            Voir les trajets
          </button>
        </div>
      )}
    </div>
  );
}

// ── RightPanel ────────────────────────────────────────────────────────
function RightPanel({ searchOpen, favoritesOpen, tripsOpen, organizeOpen, onCloseAll, onCloseSearch, favorites, setFavorites, itineraries, setItineraries, onPlaceSelect, mapboxToken, onViewRoutes }) {
  return (
    <>
      <SearchPanel isVisible={searchOpen} onClose={onCloseSearch} onPlaceSelect={onPlaceSelect} mapboxToken={mapboxToken} />
      <FavoritesPanel isVisible={favoritesOpen} onClose={onCloseAll} favorites={favorites} setFavorites={setFavorites} onPlaceSelect={onPlaceSelect} />
      <TripsPanel isVisible={tripsOpen} onClose={onCloseAll} itineraries={itineraries} setItineraries={setItineraries} />
      <OrganizePanel isVisible={organizeOpen} onClose={onCloseAll} itineraries={itineraries} setItineraries={setItineraries} onViewRoutes={onViewRoutes} />
    </>
  );
}

export default RightPanel;
