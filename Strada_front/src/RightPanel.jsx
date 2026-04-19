import { useState, useEffect, useRef } from 'react';
import { X, Star, MapPin, Plus, Trash2, ChevronDown, Calendar, Search, Pencil, Check } from 'lucide-react';
import { makeGlassStyle, getTheme, GRAIN_SVG } from './theme.js';

// ── Helpers ───────────────────────────────────────────────────────────
const PALETTE = ['#5856d6','#34aadc','#30b0c7','#34c759','#ff9500','#af52de','#ff2d55','#5ac8fa','#ff6b35','#32ade6'];
const getSavedTripColors = () => { try { return JSON.parse(localStorage.getItem('strada_trip_colors') || '{}'); } catch { return {}; } };
const tripColor = (itineraries, id) => {
  const saved = getSavedTripColors();
  if (saved[id]) return saved[id];
  return PALETTE[itineraries.findIndex(i => i.id === id) % PALETTE.length] || PALETTE[0];
};
const dayColor  = (day) => PALETTE[(day - 1) % PALETTE.length];
const formatCategory = (cat) => !cat ? '' : cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

// ── Color presets (for SettingsPanel) ────────────────────────────────
const PRESETS = [
  { name: 'Verre',    hex: '#dfe2ef', glass: true },  // mode glass original (défaut)
  { name: 'Lavande',  hex: '#e8e0f5' },
  { name: 'Rose',     hex: '#f5dde8' },
  { name: 'Pêche',    hex: '#f5e8dd' },
  { name: 'Menthe',   hex: '#ddf0ea' },
  { name: 'Ciel',     hex: '#ddeaf5' },
  { name: 'Citron',   hex: '#f0f5dd' },
  { name: 'Sable',    hex: '#f0ead8' },
  { name: 'Nuit',     hex: '#1e1e2e' },
  { name: 'Marine',   hex: '#162032' },
  { name: 'Forêt',    hex: '#162415' },
  { name: 'Encre',    hex: '#0f0f17' },
];

const GRAIN_LEVELS = [
  { label: 'Aucun',  value: 0 },
  { label: 'Subtil', value: 0.06 },
  { label: 'Moyen',  value: 0.14 },
  { label: 'Fort',   value: 0.26 },
];

const MAP_STYLES = [
  { key: 'streets-v12',          label: 'Streets',    preview: '#e8e4d9' },
  { key: 'satellite-streets-v12',label: 'Satellite',  preview: '#2d4a1e' },
  { key: 'outdoors-v12',         label: 'Outdoor',    preview: '#c8d8b0' },
  { key: 'light-v11',            label: 'Monochrome', preview: '#f0f0f0' },
];

// ── Shared styles ─────────────────────────────────────────────────────
const panelShell =
  'fixed top-3 right-3 bottom-3 z-50 flex flex-col overflow-hidden panel-slide rounded-2xl';

const searchPanelCls = panelShell + ' w-full sm:w-[340px]';
const otherPanelsCls = panelShell + ' w-full sm:w-[380px]';
const organizePanelCls = panelShell + ' w-full sm:w-[700px]';

const panelHeader =
  'flex items-center justify-between px-5 py-4 flex-shrink-0';

const closeBtn =
  'btn-press w-8 h-8 rounded-lg flex items-center justify-center cursor-default focus:outline-none';

const inputBase =
  'themed-input w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-colors';

const btnPrimary =
  'btn-press w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1c1c1e] text-white text-sm font-medium rounded-xl cursor-default focus:outline-none';

const btnSecondary =
  'btn-press px-4 py-2.5 text-[#1c1c1e] text-sm font-medium rounded-xl cursor-default focus:outline-none';

const emptyState =
  'flex flex-col items-center justify-center py-16 text-center gap-3 px-6';

// ── GlassPanel wrapper ────────────────────────────────────────────────
function GlassPanel({ settings = {}, className, children, isClosing }) {
  const color = settings.sidebarColor || '#dfe2ef';
  const grain = settings.sidebarGrain ?? 0.06;
  const t = getTheme(color);
  const { dark } = t;
  return (
    <div
      className={`${className}${isClosing ? ' panel-slide-out' : ''}`}
      style={{ ...makeGlassStyle(color), '--input-text': t.inputText, '--input-placeholder': t.inputPlaceholder }}
    >
      {grain > 0 && (
        <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{
          backgroundImage: GRAIN_SVG,
          backgroundRepeat: 'repeat',
          backgroundSize: '256px 256px',
          opacity: grain,
          mixBlendMode: dark ? 'screen' : 'multiply',
          zIndex: 0,
        }} />
      )}
      <div className="relative z-10 flex flex-col h-full overflow-hidden">
        {children}
      </div>
    </div>
  );
}

// ── SearchPanel ───────────────────────────────────────────────────────
function SearchPanel({ isVisible, isClosing, onClose, onPlaceSelect, mapboxToken, settings = {} }) {
  const t = getTheme(settings.sidebarColor);
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef(null);

  const handleSearch = (value) => {
    setSearchValue(value);
    clearTimeout(debounceRef.current);
    if (value.length > 2) {
      setIsLoading(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${mapboxToken}&autocomplete=true&limit=6`
          );
          const data = await res.json();
          setSuggestions(data.features || []);
        } catch (e) { console.error(e); }
        setIsLoading(false);
      }, 300);
    } else {
      setSuggestions([]);
      setIsLoading(false);
    }
  };

  const handleSelect = (place) => {
    onPlaceSelect({ lng: place.center[0], lat: place.center[1], name: place.text, address: place.place_name });
    setSearchValue('');
    setSuggestions([]);
  };

  if (!isVisible && !isClosing) return null;

  return (
    <GlassPanel settings={settings} className={searchPanelCls} isClosing={isClosing}>
      {/* Header */}
      <div className={panelHeader} style={{ borderBottom: `1px solid ${t.divider}` }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>Recherche</p>
          <p className="text-xs mt-0.5" style={{ color: t.textTertiary }}>Trouvez un lieu sur la carte</p>
        </div>
        <button onClick={onClose} className={closeBtn} style={{ background: t.closeBtnBg, color: t.closeBtnColor }}>
          <X style={{ width: 15, height: 15 }} />
        </button>
      </div>

      {/* Search input */}
      <div className="px-5 py-4 flex-shrink-0" style={{ borderBottom: `1px solid ${t.divider}` }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2" style={{ width: 15, height: 15, color: t.textTertiary }} />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && suggestions[0] && handleSelect(suggestions[0])}
            placeholder="Ville, monument, adresse…"
            className="themed-input w-full pl-9 pr-9 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
            style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}
            autoFocus
          />
          {isLoading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 rounded-full animate-spin" style={{ border: `2px solid ${t.divider}`, borderTopColor: t.textSecondary }} />
            </span>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {suggestions.length === 0 && !isLoading && searchValue.length === 0 && (
          <div className={emptyState}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: t.inputBg }}>
              <Search style={{ width: 20, height: 20, color: t.textTertiary }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: t.textSecondary }}>Recherchez un lieu</p>
              <p className="text-xs mt-1" style={{ color: t.textTertiary }}>Tapez pour commencer</p>
            </div>
          </div>
        )}
        {suggestions.length === 0 && !isLoading && searchValue.length > 2 && (
          <div className={emptyState}>
            <p className="text-sm" style={{ color: t.textSecondary }}>Aucun résultat pour</p>
            <p className="text-sm font-medium" style={{ color: t.textPrimary }}>"{searchValue}"</p>
          </div>
        )}
        {suggestions.length > 0 && (
          <div className="py-2">
            {suggestions.map((s, i) => (
              <button
                key={s.id}
                onClick={() => handleSelect(s)}
                className="w-full text-left flex items-center gap-3 px-5 py-3 transition-colors group cursor-default focus:outline-none"
                onMouseEnter={e => e.currentTarget.style.background = t.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: t.inputBg }}>
                  <MapPin style={{ width: 14, height: 14, color: t.textSecondary }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate" style={{ color: t.textPrimary }}>{s.text}</p>
                  <p className="text-xs truncate mt-0.5" style={{ color: t.textTertiary }}>{s.place_name}</p>
                </div>
                <ChevronDown className="flex-shrink-0 -rotate-90 opacity-0 group-hover:opacity-100 transition-opacity" style={{ width: 14, height: 14, color: t.textTertiary }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </GlassPanel>
  );
}

// ── FavoritesPanel ────────────────────────────────────────────────────
function FavoritesPanel({ isVisible, isClosing, onClose, favorites, setFavorites, onPlaceSelect, settings = {} }) {
  const t = getTheme(settings.sidebarColor);
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

  if (!isVisible && !isClosing) return null;

  return (
    <GlassPanel settings={settings} className={otherPanelsCls} isClosing={isClosing}>
      {/* Header */}
      <div className={panelHeader} style={{ borderBottom: `1px solid ${t.divider}` }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>Favoris</p>
          <p className="text-xs mt-0.5" style={{ color: t.textTertiary }}>
            {favorites.length === 0 ? 'Aucun favori' : `${favorites.length} lieu${favorites.length > 1 ? 'x' : ''} enregistré${favorites.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={onClose} className={closeBtn} style={{ background: t.closeBtnBg, color: t.closeBtnColor }}>
          <X style={{ width: 15, height: 15 }} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {favorites.length === 0 ? (
          <div className={emptyState}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: t.inputBg }}>
              <Star style={{ width: 22, height: 22, color: t.textTertiary }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: t.textSecondary }}>Aucun favori</p>
              <p className="text-xs mt-1" style={{ color: t.textTertiary }}>Cliquez sur un lieu puis "Favori"</p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {favorites.map((fav, idx) => (
              <div
                key={fav.id}
                className="group rounded-2xl overflow-hidden fade-up"
                style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', animationDelay: `${idx * 40}ms` }}
              >
                {/* Top row */}
                <div className="flex items-start gap-3 p-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: t.inputBg }}>
                    <Star style={{ width: 15, height: 15, color: t.textSecondary }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: t.textPrimary }}>{fav.nom || fav.name}</p>
                    {fav.category && (
                      <span className="inline-block mt-1 text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ color: t.textSecondary, background: t.inputBg }}>
                        {formatCategory(fav.category)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteFavorite(fav.id)}
                    disabled={deletingId === fav.id}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                    style={{ color: t.textTertiary }}
                  >
                    {deletingId === fav.id
                      ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                      : <Trash2 style={{ width: 13, height: 13 }} />}
                  </button>
                </div>

                {/* Footer action */}
                <div className="px-4 py-2.5" style={{ borderTop: `1px solid ${t.divider}` }}>
                  <button
                    onClick={() => {
                      if (fav.latitude && fav.longitude) {
                        onPlaceSelect({ lng: fav.longitude, lat: fav.latitude, name: fav.nom || fav.name });
                        onClose();
                      }
                    }}
                    disabled={!fav.latitude || !fav.longitude}
                    className="btn-press flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-40 cursor-default focus:outline-none"
                    style={{ color: t.textSecondary }}
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
    </GlassPanel>
  );
}

// ── TripsPanel ────────────────────────────────────────────────────────
function TripsPanel({ isVisible, isClosing, onClose, itineraries, setItineraries, settings = {} }) {
  const t = getTheme(settings.sidebarColor);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nom: '', nb_jours: '', description: '', color: PALETTE[0] });
  const [expandedId, setExpandedId] = useState(null);
  const [plans, setPlans] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ nom: '', nb_jours: '', description: '' });

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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: form.nom, nb_jours: parseInt(form.nb_jours, 10), description: form.description }),
      });
      if (!res.ok) { console.error('Erreur création voyage:', await res.text()); return; }
      const created = await res.json();
      const saved = getSavedTripColors();
      localStorage.setItem('strada_trip_colors', JSON.stringify({ ...saved, [created.id]: form.color }));
      setItineraries((p) => [...p, created]);
      setForm({ nom: '', nb_jours: '', description: '', color: PALETTE[0] });
      setShowForm(false);
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:8000/itineraire/${id}`, { method: 'DELETE' });
      setItineraries((p) => p.filter((i) => i.id !== id));
    } catch (e) { console.error(e); }
  };

  const handleEditStart = (e, itin) => {
    e.stopPropagation();
    setEditingId(itin.id);
    setEditForm({ nom: itin.nom, nb_jours: itin.nb_jours, description: itin.description || '' });
    setExpandedId(null);
  };

  const handleEditSave = async (id) => {
    if (!editForm.nom || !editForm.nb_jours) return;
    try {
      const res = await fetch(`http://localhost:8000/itineraire/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: editForm.nom, nb_jours: parseInt(editForm.nb_jours, 10), description: editForm.description }),
      });
      if (!res.ok) { console.error('Erreur modification:', await res.text()); return; }
      const updated = await res.json();
      setItineraries(prev => prev.map(i => i.id === id ? { ...i, ...updated } : i));
      setEditingId(null);
    } catch (e) { console.error(e); }
  };

  const handleDeletePoi = async (itinId, poiId) => {
    try {
      await fetch(`http://localhost:8000/itineraire/${itinId}/poi/${poiId}`, { method: 'DELETE' });
      const res = await fetch(`http://localhost:8000/itineraire/${itinId}/plan`);
      if (res.ok) { const updated = await res.json(); setPlans(prev => ({ ...prev, [itinId]: updated })); }
    } catch (e) { console.error(e); }
  };

  if (!isVisible && !isClosing) return null;

  return (
    <GlassPanel settings={settings} className={otherPanelsCls} isClosing={isClosing}>
      {/* Header */}
      <div className={panelHeader} style={{ borderBottom: `1px solid ${t.divider}` }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>Voyages</p>
          <p className="text-xs mt-0.5" style={{ color: t.textTertiary }}>
            {itineraries.length === 0 ? 'Aucun voyage' : `${itineraries.length} voyage${itineraries.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-press flex items-center gap-1.5 px-3 py-1.5 bg-[#1c1c1e] text-white text-xs font-medium rounded-lg hover:bg-[#3a3a3c] transition-colors cursor-default focus:outline-none"
            >
              <Plus style={{ width: 12, height: 12 }} />
              Nouveau
            </button>
          )}
          <button onClick={onClose} className={closeBtn} style={{ background: t.closeBtnBg, color: t.closeBtnColor }}>
            <X style={{ width: 15, height: 15 }} />
          </button>
        </div>
      </div>

      {/* Creation form */}
      {showForm && (
        <div className="px-5 py-4 flex-shrink-0 space-y-3 fade-up" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.textSecondary }}>Nouveau voyage</p>
          <input type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Nom du voyage" className={inputBase} style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(0,0,0,0.07)' }} autoFocus />
          <input type="number" value={form.nb_jours} onChange={(e) => setForm({ ...form, nb_jours: e.target.value })} placeholder="Nombre de jours" min="1" className={inputBase} style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(0,0,0,0.07)' }} />
          <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description (optionnel)" className={inputBase} style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(0,0,0,0.07)' }} />
          <div className="flex items-center gap-3">
            <label className="w-8 h-8 rounded-full cursor-pointer relative overflow-hidden flex-shrink-0"
              title="Choisir une couleur"
              style={{ background: form.color, border: '2.5px solid rgba(0,0,0,0.12)', boxShadow: '0 1px 6px rgba(0,0,0,0.18)' }}>
              <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
            </label>
            <span className="text-[11px]" style={{ color: t.textTertiary }}>Couleur du voyage</span>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleCreate} className="btn-press flex-1 py-2.5 bg-[#1c1c1e] text-white text-sm font-medium rounded-xl hover:bg-[#3a3a3c] transition-colors cursor-default focus:outline-none">Créer</button>
            <button onClick={() => setShowForm(false)} className={btnSecondary} style={{ background: 'rgba(0,0,0,0.06)' }}>Annuler</button>
          </div>
        </div>
      )}

      {/* Trip list */}
      <div className="flex-1 overflow-y-auto">
        {itineraries.length === 0 ? (
          <div className={emptyState}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: t.inputBg }}>
              <MapPin style={{ width: 22, height: 22, color: t.textTertiary }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: t.textSecondary }}>Aucun voyage</p>
              <p className="text-xs mt-1" style={{ color: t.textTertiary }}>Créez votre premier itinéraire</p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {itineraries.map((itin, idx) => {
              const pois = plans[itin.id] || [];
              const isExpanded = expandedId === itin.id;

              return (
                <div
                  key={itin.id}
                  className="rounded-2xl overflow-hidden fade-up"
                  style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', animationDelay: `${idx * 40}ms` }}
                >
                  {/* Edit form (inline) */}
                  {editingId === itin.id ? (
                    <div className="p-4 space-y-2.5 fade-up" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: tripColor(itineraries, itin.id) }} />
                        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.textSecondary }}>Modifier le voyage</p>
                      </div>
                      <input
                        type="text" value={editForm.nom}
                        onChange={e => setEditForm({ ...editForm, nom: e.target.value })}
                        placeholder="Nom du voyage" className={inputBase}
                        style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(0,0,0,0.07)' }}
                        autoFocus
                      />
                      <input
                        type="number" value={editForm.nb_jours}
                        onChange={e => setEditForm({ ...editForm, nb_jours: e.target.value })}
                        placeholder="Nombre de jours" min="1" className={inputBase}
                        style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(0,0,0,0.07)' }}
                      />
                      <input
                        type="text" value={editForm.description}
                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Description (optionnel)" className={inputBase}
                        style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(0,0,0,0.07)' }}
                      />
                      <div className="flex gap-2 pt-0.5">
                        <button
                          onClick={() => handleEditSave(itin.id)}
                          className="btn-press flex-1 py-2 bg-[#1c1c1e] text-white text-xs font-medium rounded-xl hover:bg-[#3a3a3c] transition-colors cursor-default focus:outline-none flex items-center justify-center gap-1.5"
                        >
                          <Check style={{ width: 12, height: 12 }} /> Enregistrer
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className={btnSecondary} style={{ background: 'rgba(0,0,0,0.06)' }}
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                  /* Trip row */
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : itin.id)}
                    className="item-press flex items-center gap-3 p-4 cursor-default select-none"
                  >
                    {/* Color accent */}
                    <div className="w-2 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: tripColor(itineraries, itin.id) }} />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: t.textPrimary }}>{itin.nom || 'Voyage sans nom'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px]" style={{ color: t.textTertiary }}>{pois.length} lieu{pois.length > 1 ? 'x' : ''}</span>
                        {itin.description && <span className="text-[11px] truncate" style={{ color: t.textTertiary }}>· {itin.description}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[11px] font-semibold px-2 py-1 rounded-lg" style={{ color: t.textSecondary, background: t.inputBg }}>
                        {itin.nb_jours}j
                      </span>
                      <button
                        onClick={(e) => handleEditStart(e, itin)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-blue-50 hover:text-blue-500 transition-colors"
                        style={{ color: t.textTertiary }}
                      >
                        <Pencil style={{ width: 12, height: 12 }} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(itin.id); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:text-red-500 hover:bg-red-50 transition-colors"
                        style={{ color: t.textTertiary }}
                      >
                        <Trash2 style={{ width: 13, height: 13 }} />
                      </button>
                      <ChevronDown style={{ width: 15, height: 15, color: t.textTertiary, transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 240ms cubic-bezier(0.16, 1, 0.3, 1)', flexShrink: 0 }} />
                    </div>
                  </div>
                  )}

                  {/* Expanded POI list */}
                  {isExpanded && (
                    <div className="px-4 py-3 space-y-1.5 fade-up" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                      {pois.length === 0 ? (
                        <p className="text-xs py-2 text-center" style={{ color: t.textTertiary }}>Aucun lieu ajouté</p>
                      ) : pois.map((poi, idx) => (
                        <div key={poi.id} className="group flex items-center gap-2.5 py-2 px-2 rounded-xl" onMouseEnter={e => e.currentTarget.style.background= t.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'} onMouseLeave={e => e.currentTarget.style.background=''}>
                          <span className="w-5 h-5 rounded-full text-[10px] font-semibold flex items-center justify-center flex-shrink-0" style={{ background: t.inputBg, color: t.textSecondary }}>
                            {idx + 1}
                          </span>
                          <p className="flex-1 text-xs font-medium truncate" style={{ color: t.textPrimary }}>
                            {poi.name || poi.properties?.name || `POI ${idx + 1}`}
                          </p>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeletePoi(itin.id, poi.id); }}
                            className="w-6 h-6 rounded flex items-center justify-center hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                            style={{ color: t.textTertiary }}
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
    </GlassPanel>
  );
}

// ── OrganizePanel ─────────────────────────────────────────────────────
const loadOrgData = () => {
  try { return JSON.parse(localStorage.getItem('strada_org_data') || '{"order":[],"categories":[],"tripCategory":{}}'); }
  catch { return { order: [], categories: [], tripCategory: {} }; }
};

function OrganizePanel({ isVisible, isClosing, onClose, itineraries, onOpenPlanner, settings = {} }) {
  const t = getTheme(settings.sidebarColor);
  const [orgData, setOrgData] = useState(loadOrgData);
  const [showCatForm, setShowCatForm] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);   // trip card hover
  const [dragOverCat, setDragOverCat] = useState(null); // category section hover ('uncat' | cat.id)
  const [openCatMenu, setOpenCatMenu] = useState(null);

  const saveOrgData = (data) => { setOrgData(data); localStorage.setItem('strada_org_data', JSON.stringify(data)); };

  const getSortedIds = () => {
    const knownIds = orgData.order.filter(id => itineraries.some(i => i.id === id));
    const unknownIds = itineraries.filter(i => !knownIds.includes(i.id)).map(i => i.id);
    return [...knownIds, ...unknownIds];
  };

  const handleDragStart = (id) => setDraggedId(id);
  const handleDragEnd   = () => { setDraggedId(null); setDragOverId(null); setDragOverCat(null); };

  // Drop ON a trip card → reorder + adopt target's category
  const handleDropOnTrip = (e, targetId) => {
    e.stopPropagation();
    if (!draggedId || draggedId === targetId) { handleDragEnd(); return; }
    const allIds = getSortedIds();
    const from = allIds.indexOf(draggedId), to = allIds.indexOf(targetId);
    allIds.splice(from, 1); allIds.splice(to, 0, draggedId);
    const tc = { ...orgData.tripCategory };
    const targetCat = tc[targetId];
    if (targetCat) tc[draggedId] = targetCat; else delete tc[draggedId];
    saveOrgData({ ...orgData, order: allIds, tripCategory: tc });
    handleDragEnd();
  };

  // Drop ON a category section → assign to that category (no reorder)
  const handleDropOnCat = (catId) => {
    if (!draggedId) { handleDragEnd(); return; }
    const tc = { ...orgData.tripCategory };
    if (catId) tc[draggedId] = catId; else delete tc[draggedId];
    saveOrgData({ ...orgData, tripCategory: tc });
    handleDragEnd();
  };

  const handleAssignCat = (tripId, catId) => {
    const tc = { ...orgData.tripCategory };
    if (catId) tc[tripId] = catId; else delete tc[tripId];
    saveOrgData({ ...orgData, tripCategory: tc });
    setOpenCatMenu(null);
  };

  const handleCreateCat = () => {
    if (!newCatName.trim()) return;
    saveOrgData({ ...orgData, categories: [...orgData.categories, { id: `cat-${Date.now()}`, name: newCatName.trim() }] });
    setNewCatName(''); setShowCatForm(false);
  };

  const handleDeleteCat = (catId) => {
    const tc = { ...orgData.tripCategory };
    Object.keys(tc).forEach(id => { if (tc[id] === catId) delete tc[id]; });
    saveOrgData({ ...orgData, categories: orgData.categories.filter(c => c.id !== catId), tripCategory: tc });
  };

  if (!isVisible && !isClosing) return null;

  // Build sorted trip list
  const knownIds = orgData.order.filter(id => itineraries.some(i => i.id === id));
  const unknownItins = itineraries.filter(i => !knownIds.includes(i.id));
  const sortedItins = [...knownIds.map(id => itineraries.find(i => i.id === id)).filter(Boolean), ...unknownItins];

  // Group by category
  const uncatTrips = sortedItins.filter(trip => !orgData.tripCategory[trip.id]);
  const catGroups = orgData.categories.map(cat => ({
    cat,
    trips: sortedItins.filter(trip => orgData.tripCategory[trip.id] === cat.id),
  }));
  const groups = [
    ...(uncatTrips.length ? [{ cat: null, trips: uncatTrips }] : []),
    ...catGroups,
  ];

  return (
    <GlassPanel settings={settings} className={otherPanelsCls} isClosing={isClosing}>

      {/* Header */}
      <div className={panelHeader} style={{ borderBottom: `1px solid ${t.divider}` }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>Organisation</p>
          <p className="text-xs mt-0.5" style={{ color: t.textTertiary }}>
            {itineraries.length === 0 ? 'Aucun voyage' : `${itineraries.length} voyage${itineraries.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCatForm(v => !v)}
            className="btn-press flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg cursor-default focus:outline-none"
            style={{ background: t.inputBg, color: t.textSecondary, transition: 'transform 160ms cubic-bezier(0.16,1,0.3,1), opacity 160ms ease-out' }}
          >
            <Plus style={{ width: 11, height: 11 }} />
            Catégorie
          </button>
          <button onClick={onClose} className={closeBtn} style={{ background: t.closeBtnBg, color: t.closeBtnColor }}>
            <X style={{ width: 15, height: 15 }} />
          </button>
        </div>
      </div>

      {/* New category form */}
      {showCatForm && (
        <div className="px-4 py-3 flex items-center gap-2 fade-up" style={{ borderBottom: `1px solid ${t.divider}` }}>
          <input
            autoFocus
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreateCat(); if (e.key === 'Escape') setShowCatForm(false); }}
            placeholder="Nom de la catégorie…"
            className={inputBase}
            style={{ flex: 1 }}
          />
          <button onClick={handleCreateCat} className="btn-press px-3 py-2 text-white text-xs font-medium rounded-xl cursor-default focus:outline-none" style={{ background: '#1c1c1e', flexShrink: 0 }}>Créer</button>
        </div>
      )}

      {/* Trip list */}
      <div className="flex-1 overflow-y-auto p-3">
        {itineraries.length === 0 ? (
          <div className={emptyState}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: t.inputBg }}>
              <Calendar style={{ width: 22, height: 22, color: t.textTertiary }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: t.textSecondary }}>Aucun voyage</p>
              <p className="text-xs mt-1" style={{ color: t.textTertiary }}>Créez des voyages depuis l'onglet Voyages</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map(({ cat, trips }) => {
              const groupKey = cat?.id || 'uncat';
              const isCatOver = dragOverCat === groupKey && draggedId !== null;
              return (
              <div
                key={groupKey}
                onDragOver={e => { e.preventDefault(); setDragOverCat(groupKey); }}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverCat(null); }}
                onDrop={() => handleDropOnCat(cat?.id || null)}
                className="rounded-2xl transition-all"
                style={{
                  padding: '8px',
                  margin: '-8px',
                  background: isCatOver ? (t.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)') : 'transparent',
                  outline: isCatOver ? `1.5px dashed ${t.textTertiary}` : '1.5px dashed transparent',
                  transition: 'background 150ms ease-out, outline-color 150ms ease-out',
                }}
              >
                {/* Category header */}
                {cat && (
                  <div className="flex items-center justify-between px-1 mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: isCatOver ? t.textPrimary : t.textSecondary, transition: 'color 150ms' }}>{cat.name}</span>
                    <button
                      onClick={() => handleDeleteCat(cat.id)}
                      className="w-5 h-5 rounded flex items-center justify-center"
                      style={{ color: t.textTertiary }}
                      onMouseEnter={e => { if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) e.currentTarget.style.color = '#ef4444'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = t.textTertiary; }}
                    >
                      <Trash2 style={{ width: 11, height: 11 }} />
                    </button>
                  </div>
                )}

                {/* Trip cards */}
                <div className="space-y-2">
                  {trips.map(trip => {
                    const tc = tripColor(itineraries, trip.id);
                    const isDragged = draggedId === trip.id;
                    const isOver = dragOverId === trip.id;
                    const catName = orgData.tripCategory[trip.id]
                      ? orgData.categories.find(c => c.id === orgData.tripCategory[trip.id])?.name
                      : null;

                    return (
                      <div
                        key={trip.id}
                        draggable
                        onDragStart={() => handleDragStart(trip.id)}
                        onDragEnd={handleDragEnd}
                        onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOverId(trip.id); setDragOverCat(null); }}
                        onDrop={e => handleDropOnTrip(e, trip.id)}
                        className="rounded-2xl overflow-visible"
                        style={{
                          background: 'rgba(255,255,255,0.55)',
                          border: `1.5px solid ${isOver ? tc : 'rgba(255,255,255,0.5)'}`,
                          boxShadow: isOver ? `0 0 0 3px ${tc}30` : '0 1px 4px rgba(0,0,0,0.05)',
                          opacity: isDragged ? 0.4 : 1,
                          transform: isDragged ? 'scale(0.98)' : 'scale(1)',
                          transition: 'opacity 150ms ease-out, transform 150ms ease-out, border-color 150ms, box-shadow 150ms',
                          cursor: 'grab',
                        }}
                      >
                        <div className="flex items-center gap-3 p-3.5">
                          {/* Color accent */}
                          <div className="w-2 self-stretch rounded-full flex-shrink-0" style={{ background: tc }} />

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: t.textPrimary }}>{trip.nom || 'Voyage sans nom'}</p>
                            <div className="flex items-center gap-1.5 mt-0.5 relative">
                              <span className="text-[11px]" style={{ color: t.textTertiary }}>{trip.nb_jours}j</span>
                              {/* Category tag */}
                              <button
                                onClick={e => { e.stopPropagation(); setOpenCatMenu(openCatMenu === trip.id ? null : trip.id); }}
                                className="text-[10px] px-1.5 py-0.5 rounded-full cursor-default focus:outline-none transition-colors"
                                style={{ background: catName ? tc + '25' : t.inputBg, color: catName ? tc : t.textTertiary }}
                              >
                                {catName || '+ tag'}
                              </button>
                              {/* Category dropdown */}
                              {openCatMenu === trip.id && (
                                <div
                                  className="absolute left-0 top-full mt-1 rounded-xl overflow-hidden z-20 fade-up"
                                  style={{ background: t.dark ? 'rgba(30,30,46,0.98)' : 'rgba(248,248,252,0.98)', backdropFilter: 'blur(20px)', border: `1px solid ${t.divider}`, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: 150 }}
                                >
                                  {[{ id: null, name: 'Sans catégorie' }, ...orgData.categories].map(c => (
                                    <button
                                      key={c.id || 'none'}
                                      onClick={() => handleAssignCat(trip.id, c.id)}
                                      className="w-full text-left px-3 py-2 text-[11px] cursor-default focus:outline-none"
                                      style={{ color: c.id ? t.textPrimary : t.textTertiary }}
                                      onMouseEnter={e => { if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) e.currentTarget.style.background = t.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'; }}
                                      onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                                    >
                                      {c.name}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* GO! button */}
                          <button
                            onClick={() => { onClose(); onOpenPlanner?.(trip); }}
                            className="btn-press flex items-center px-3.5 py-2 text-white text-xs font-bold rounded-xl cursor-default focus:outline-none flex-shrink-0"
                            style={{ background: tc, boxShadow: `0 2px 10px ${tc}60`, transition: 'transform 160ms cubic-bezier(0.16,1,0.3,1), opacity 160ms ease-out' }}
                          >
                            GO !
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Empty category drop hint */}
                {cat && trips.length === 0 && (
                  <div className="py-3 rounded-xl text-center" style={{ border: `1px dashed ${t.divider}` }}>
                    <p className="text-[11px]" style={{ color: t.textTertiary }}>Glissez un voyage ici</p>
                  </div>
                )}
              </div>
            );
          })}
          </div>
        )}
      </div>
    </GlassPanel>
  );
}

// ── SettingsPanel ─────────────────────────────────────────────────────
function SettingsPanel({ isVisible, isClosing, onClose, settings = {}, onSettingsChange, mapboxToken }) {
  const [cityInput, setCityInput] = useState('');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [cityLoading, setCityLoading] = useState(false);
  const cityDebounceRef = useRef(null);

  const searchCity = (value) => {
    setCityInput(value);
    clearTimeout(cityDebounceRef.current);
    if (value.length > 2) {
      setCityLoading(true);
      cityDebounceRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${mapboxToken}&types=place,locality,region&limit=5`);
          const data = await res.json();
          setCitySuggestions(data.features || []);
        } catch (e) { /* ignore */ }
        setCityLoading(false);
      }, 300);
    } else {
      setCitySuggestions([]);
      setCityLoading(false);
    }
  };

  const selectCity = (feature) => {
    onSettingsChange({ defaultCity: feature.place_name, defaultLng: feature.center[0], defaultLat: feature.center[1] });
    setCityInput('');
    setCitySuggestions([]);
  };

  if (!isVisible && !isClosing) return null;

  const { sidebarColor: color = '#dfe2ef', sidebarGrain: grain = 0.06, mapStyle = 'streets-v12', defaultZoom = 10, language = 'fr', units = 'km', defaultTransport = 'driving', defaultCity = 'Paris' } = settings;
  const t = getTheme(color);

  const sectionHeader = 'text-[10px] font-semibold uppercase tracking-wider mb-3';
  const divider = { borderBottom: `1px solid ${t.divider}`, marginBottom: 0 };
  const toggleBtn = (active) => ({
    padding: '6px 14px',
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'default',
    border: 'none',
    outline: 'none',
    transition: 'background 150ms ease-out, color 150ms ease-out, box-shadow 150ms ease-out',
    background: active ? '#1c1c1e' : 'rgba(0,0,0,0.05)',
    color: active ? '#ffffff' : '#6c6c70',
    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.2)' : 'none',
  });

  return (
    <GlassPanel settings={settings} className={otherPanelsCls} isClosing={isClosing}>
      {/* Header */}
      <div className={panelHeader} style={{ borderBottom: `1px solid ${t.divider}` }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>Paramètres</p>
          <p className="text-xs mt-0.5" style={{ color: t.textTertiary }}>Personnalisez votre expérience</p>
        </div>
        <button onClick={onClose} className={closeBtn} style={{ background: t.closeBtnBg, color: t.closeBtnColor }}>
          <X style={{ width: 15, height: 15 }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── Section 1: GÉNÉRAL ── */}
        <div className="px-5 py-4" style={divider}>
          <p className={sectionHeader} style={{ color: t.textTertiary }}>Général</p>

          {/* Default city */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[13px] font-medium" style={{ color: t.textPrimary }}>Ville de départ</span>
              <span className="text-[11px] truncate max-w-[130px]" style={{ color: t.textTertiary }}>{defaultCity}</span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={cityInput}
                onChange={e => searchCity(e.target.value)}
                placeholder="Chercher une ville…"
                className="w-full px-3 py-2 rounded-xl text-[12px] focus:outline-none transition-all"
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.textPrimary }}
              />
              {cityLoading && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-3 h-3 rounded-full animate-spin" style={{ border: `2px solid ${t.divider}`, borderTopColor: t.textSecondary }} />
                </span>
              )}
              {citySuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-10"
                  style={{ background: t.dark ? 'rgba(30,30,46,0.98)' : 'rgba(248,248,252,0.98)', border: `1px solid ${t.inputBorder}`, boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }}>
                  {citySuggestions.map(f => (
                    <button key={f.id} onClick={() => selectCity(f)}
                      className="w-full text-left px-3 py-2 text-[12px] transition-colors cursor-default focus:outline-none truncate"
                      style={{ color: t.textPrimary }}
                      onMouseEnter={e => e.currentTarget.style.background = t.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      {f.place_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Language */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-medium" style={{ color: t.textPrimary }}>Langue</span>
            <div className="flex gap-1">
              {['fr', 'en'].map(lang => (
                <button key={lang} onClick={() => onSettingsChange({ language: lang })}
                  style={toggleBtn(language === lang)}
                  className="cursor-default focus:outline-none">
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Units */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-medium" style={{ color: t.textPrimary }}>Unités</span>
            <div className="flex gap-1">
              {['km', 'miles'].map(u => (
                <button key={u} onClick={() => onSettingsChange({ units: u })}
                  style={toggleBtn(units === u)}
                  className="cursor-default focus:outline-none">
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Default transport */}
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium" style={{ color: t.textPrimary }}>Transport</span>
            <div className="flex gap-1 rounded-xl p-1" style={{ background: t.inputBg }}>
              {[{ key: 'driving', src: '/car.png' }, { key: 'cycling', src: '/bike.png' }, { key: 'walking', src: '/man-walking.png' }, { key: 'flying', src: '/airplane.png' }].map(({ key, src }) => (
                <button key={key} onClick={() => onSettingsChange({ defaultTransport: key })}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-default focus:outline-none ${defaultTransport === key ? 'bg-white shadow-sm' : ''}`}>
                  <img src={src} alt={key} className={`w-5 h-5 object-contain ${defaultTransport === key ? 'opacity-100' : 'opacity-40'}`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: t.divider, margin: '0 20px' }} />

        {/* ── Section 2: APPARENCE ── */}
        <div className="px-5 py-4" style={divider}>
          <p className={sectionHeader} style={{ color: t.textTertiary }}>Apparence</p>

          {/* Color presets grid */}
          <div className="grid grid-cols-6 gap-2 mb-3">
            {PRESETS.map(preset => {
              const isActive = color === preset.hex;
              const isDarkPreset = parseInt(preset.hex.slice(1,3),16)*299+parseInt(preset.hex.slice(3,5),16)*587+parseInt(preset.hex.slice(5,7),16)*114 < 160*1000;
              return (
                <button
                  key={preset.hex}
                  onClick={() => onSettingsChange({ sidebarColor: preset.hex })}
                  title={preset.name}
                  className="btn-press relative w-full aspect-square rounded-xl cursor-default focus:outline-none overflow-hidden"
                  style={{
                    background: preset.glass
                      ? 'linear-gradient(135deg, rgba(223,226,239,0.9) 0%, rgba(200,205,230,0.6) 50%, rgba(223,226,239,0.9) 100%)'
                      : preset.hex,
                    border: isActive ? '2px solid #1c1c1e' : '2px solid transparent',
                    boxShadow: isActive ? '0 0 0 2px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.12)',
                    outline: isActive ? '2px solid rgba(0,0,0,0.2)' : 'none',
                    outlineOffset: 2,
                    backdropFilter: preset.glass ? 'blur(4px)' : 'none',
                  }}
                >
                  {preset.glass && <div className="absolute inset-0 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 50%, rgba(255,255,255,0.2) 100%)' }} />}
                  {isActive && (
                    <svg viewBox="0 0 10 8" fill="none" className="absolute inset-0 m-auto w-2.5 h-2.5" style={{ position: 'relative', zIndex: 1 }}>
                      <path d="M1 4l2.5 2.5L9 1" stroke={isDarkPreset ? 'white' : '#1c1c1e'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              );
            })}

            {/* Custom color picker */}
            <label className="relative w-full aspect-square rounded-xl cursor-pointer overflow-hidden" title="Couleur personnalisée"
              style={{ border: '2px solid rgba(0,0,0,0.10)', boxShadow: '0 1px 3px rgba(0,0,0,0.12)', background: 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)' }}>
              <input type="color" value={color} onChange={e => onSettingsChange({ sidebarColor: e.target.value })}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
            </label>
          </div>

          {/* Grain buttons */}
          <p className={sectionHeader} style={{ color: t.textTertiary, marginTop: 12 }}>Grain</p>
          <div className="flex gap-2 mb-3">
            {GRAIN_LEVELS.map(level => (
              <button
                key={level.value}
                onClick={() => onSettingsChange({ sidebarGrain: level.value })}
                className="btn-press flex-1 py-2 rounded-xl text-[11px] font-medium cursor-default focus:outline-none"
                style={grain === level.value ? {
                  background: '#1c1c1e', color: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                } : {
                  background: t.inputBg, color: t.textSecondary,
                }}
              >
                {level.label}
              </button>
            ))}
          </div>

          {/* Reset */}
          <button
            onClick={() => onSettingsChange({ sidebarColor: '#dfe2ef', sidebarGrain: 0.06 })}
            className="text-[11px] transition-colors cursor-default focus:outline-none"
            style={{ color: t.textTertiary }}
          >
            Réinitialiser l'apparence
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: t.divider, margin: '0 20px' }} />

        {/* ── Section 3: CARTE ── */}
        <div className="px-5 py-4">
          <p className={sectionHeader} style={{ color: t.textTertiary }}>Carte</p>

          {/* Map style 2x2 grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {MAP_STYLES.map(ms => {
              const isActive = mapStyle === ms.key;
              return (
                <button
                  key={ms.key}
                  onClick={() => onSettingsChange({ mapStyle: ms.key })}
                  className="btn-press flex items-center gap-2.5 p-2.5 rounded-xl cursor-default focus:outline-none text-left"
                  style={{
                    background: isActive ? 'rgba(28,28,30,0.08)' : t.inputBg,
                    border: isActive ? '1.5px solid #1c1c1e' : `1px solid ${t.inputBorder}`,
                    boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  <div className="w-10 h-10 rounded-lg flex-shrink-0" style={{ background: ms.preview }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium truncate" style={{ color: t.textPrimary }}>{ms.label}</p>
                    {isActive && (
                      <div className="w-4 h-4 rounded-full bg-[#1c1c1e] flex items-center justify-center mt-0.5">
                        <svg viewBox="0 0 10 8" fill="none" className="w-2 h-2">
                          <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Zoom range */}
          <p className={sectionHeader} style={{ color: t.textTertiary }}>Zoom de départ</p>
          <div className="flex items-center gap-3">
            <input
              type="range" min="3" max="18" step="1" value={defaultZoom}
              onChange={e => onSettingsChange({ defaultZoom: parseInt(e.target.value) })}
              className="flex-1 cursor-default"
            />
            <span className="text-sm font-semibold w-6 text-right" style={{ color: t.textPrimary }}>{defaultZoom}</span>
          </div>
        </div>

      </div>
    </GlassPanel>
  );
}

// ── RightPanel ────────────────────────────────────────────────────────
function RightPanel({ searchOpen, favoritesOpen, tripsOpen, organizeOpen, settingsOpen, onCloseAll, onCloseSearch, favorites, setFavorites, itineraries, setItineraries, onPlaceSelect, mapboxToken, onViewRoutes, onTripPoisChange, onOpenPlanner, settings = {}, onSettingsChange, closingPanel }) {
  return (
    <>
      <SearchPanel   isVisible={searchOpen}    isClosing={closingPanel === 'search'}   onClose={onCloseSearch} onPlaceSelect={onPlaceSelect} mapboxToken={mapboxToken} settings={settings} />
      <FavoritesPanel isVisible={favoritesOpen} isClosing={closingPanel === 'favorites'} onClose={onCloseAll} favorites={favorites} setFavorites={setFavorites} onPlaceSelect={onPlaceSelect} settings={settings} />
      <TripsPanel    isVisible={tripsOpen}     isClosing={closingPanel === 'trips'}     onClose={onCloseAll} itineraries={itineraries} setItineraries={setItineraries} settings={settings} />
      <OrganizePanel isVisible={organizeOpen}  isClosing={closingPanel === 'organize'}  onClose={onCloseAll} itineraries={itineraries} onOpenPlanner={onOpenPlanner} settings={settings} />
      <SettingsPanel isVisible={settingsOpen}  isClosing={closingPanel === 'settings'}  onClose={onCloseAll} settings={settings} onSettingsChange={onSettingsChange} mapboxToken={mapboxToken} />
    </>
  );
}

export default RightPanel;
