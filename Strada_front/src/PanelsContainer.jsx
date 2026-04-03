import { useState, useEffect, useRef } from 'react';
import { X, MapPin, Navigation, GripVertical } from 'lucide-react';
import { getDayColor } from './constants.js';

// ── Utils ─────────────────────────────────────────────────────────────
const formatDuration = (seconds) => {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0) return `${h}h${m > 0 ? m + 'min' : ''}`;
  return `${m} min`;
};

const formatDistance = (meters) => {
  if (!meters) return null;
  return meters >= 1000
    ? `${(meters / 1000).toFixed(1)} km`
    : `${Math.round(meters)} m`;
};

const getDistance = (p1, p2) => {
  if (!p1 || !p2) return 0;
  const R = 6371;
  const dLat = (p2.latitude - p1.latitude) * Math.PI / 180;
  const dLon = (p2.longitude - p1.longitude) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(p1.latitude * Math.PI / 180) *
    Math.cos(p2.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
};

const modeLabel = (mode) => {
  if (mode === 'walking') return 'À pied';
  if (mode === 'cycling') return 'Vélo';
  return 'Voiture';
};

// ── RoutePanel ────────────────────────────────────────────────────────
function RoutePanel({ itinerary, planPois, onDaysChange, onDayDetail, onClose }) {
  const [activeDays, setActiveDays] = useState([]);

  if (!itinerary) return null;

  const days = Array.from({ length: itinerary.nb_jours || 0 }, (_, i) => i + 1);
  const daysToShow = days.filter(d => (planPois || []).some(p => p.day === d));

  const toggleDay = (day) => {
    const next = activeDays.includes(day)
      ? activeDays.filter(d => d !== day)
      : [...activeDays, day];
    setActiveDays(next);
    onDaysChange(next);
    onDayDetail(next);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden w-72">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <p className="text-sm font-medium text-gray-900">{itinerary.nom}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {activeDays.length === 0
              ? 'Sélectionnez des jours'
              : `${activeDays.length} jour${activeDays.length > 1 ? 's' : ''} affiché${activeDays.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={onClose} className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
          <X style={{ width: 13, height: 13 }} />
        </button>
      </div>

      <div className="p-3">
        {daysToShow.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-3">Aucun lieu planifié</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {daysToShow.map((day) => {
              const isActive = activeDays.includes(day);
              const color = getDayColor(day);
              return (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  style={isActive ? { backgroundColor: color, borderColor: color, color: '#fff' } : {}}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${isActive ? '' : 'border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-800'
                    }`}
                >
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white/80 flex-shrink-0" />}
                  J{day}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── RouteDetailPanel ──────────────────────────────────────────────────
function RouteDetailPanel({ isVisible, selectedDays, pois, routeDurations, onReorder, selectedMode, onModeChange }) {

  const [mounted, setMounted] = useState(false);
  const [orderedPois, setOrderedPois] = useState([]);
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  useEffect(() => {
    if (isVisible) {
      const t = setTimeout(() => setMounted(true), 10);
      return () => clearTimeout(t);
    } else {
      setMounted(false);
    }
  }, [isVisible]);

  // Sync orderedPois quand pois ou selectedDays changent
  useEffect(() => {
    if (!pois || !selectedDays) return;
    const sorted = pois
      .filter(p => selectedDays.includes(p.day))
      .sort((a, b) => a.day !== b.day ? a.day - b.day : (a.position ?? 0) - (b.position ?? 0));
    setOrderedPois(sorted);
  }, [pois, selectedDays]);

  if (!isVisible || !selectedDays?.length || !pois) return null;

  const sortedDays = [...selectedDays].sort((a, b) => a - b);
  const isMultiDay = selectedDays.length > 1;

  const totalDuration = sortedDays.reduce((acc, day) => {
    return acc + (routeDurations?.[day]?.[selectedMode]?.duration || 0);
  }, 0);
  const totalDistance = sortedDays.reduce((acc, day) => {
    return acc + (routeDurations?.[day]?.[selectedMode]?.distance || 0);
  }, 0);


  // ── Drag & drop handlers ──────────────────────────────────────
  const handleDragStart = (id) => setDraggedId(id);

  const handleDragOver = (e, id) => {
    e.preventDefault();
    if (id !== draggedId) setDragOverId(id);
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const draggedPoi = orderedPois.find(p => p.id === draggedId);
    const targetPoi = orderedPois.find(p => p.id === targetId);
    if (!draggedPoi || !targetPoi) return;

    const newOrder = [...orderedPois];
    const fromIdx = newOrder.findIndex(p => p.id === draggedId);
    const toIdx = newOrder.findIndex(p => p.id === targetId);

    // Changer le jour si nécessaire
    newOrder[fromIdx] = { ...draggedPoi, day: targetPoi.day };

    // Réinsérer à la bonne position
    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, moved);

    // Recalculer toutes les positions par jour
    const updatedOrder = newOrder.map(p => {
      const dayPois = newOrder.filter(x => x.day === p.day);
      return { ...p, position: dayPois.findIndex(x => x.id === p.id) };
    });

    setOrderedPois(updatedOrder);
    setDraggedId(null);
    setDragOverId(null);
    onReorder?.(updatedOrder);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-2xl overflow-hidden w-72 transition-all duration-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      }`}>

      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex gap-1">
            {sortedDays.slice(0, 4).map(day => (
              <span key={day} className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getDayColor(day) }} />
            ))}
          </div>
          <p className="text-xs font-medium text-gray-900">
            {isMultiDay ? `Jours ${sortedDays.join(', ')}` : `Jour ${sortedDays[0]}`}
          </p>
        </div>

        {/* Sélecteur de mode */}
        <div className="flex gap-1 mb-2">
          {[
            { key: 'driving', src: '/car.png' },
            { key: 'cycling', src: '/bike.png' },
            { key: 'walking', src: '/man-walking.png' },
            { key: 'flying', src: '/airplane.png' },
          ].map(({ key, src }) => (
            <button
              key={key}
              onClick={() => onModeChange(key)}
              className={`flex-1 py-1 rounded-lg flex items-center justify-center transition-all ${selectedMode === key
                  ? 'bg-gray-900'
                  : 'bg-gray-100 hover:bg-gray-200'
                }`}
            >
              <img
                src={src}
                alt={key}
                className={`w-5 h-5 object-contain transition-all ${selectedMode === key
                    ? 'invert'
                    : 'opacity-70'
                  }`}
              />
            </button>
          ))}
        </div>

        {/* Stats du mode sélectionné */}
        <div className="flex items-center gap-3">
          {totalDuration > 0 && (
            <span className="text-[10px] text-gray-400">⏱ {formatDuration(totalDuration)}</span>
          )}
          {totalDistance > 0 && (
            <span className="text-[10px] text-gray-400">📍 {formatDistance(totalDistance)}</span>
          )}
          <span className="text-[10px] text-gray-400">{orderedPois.length} lieux</span>
        </div>
      </div>

      {/* Liste des lieux avec drag & drop */}
      <div className="overflow-y-auto max-h-64">
        {orderedPois.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">Aucun lieu prévu</p>
        ) : (
          <div className="p-2">
            {orderedPois.map((poi, idx) => {
              const color = getDayColor(poi.day);
              const showDayHeader = isMultiDay && (idx === 0 || orderedPois[idx - 1].day !== poi.day);
              const nextPoi = orderedPois[idx + 1];

              // Connexion inter-jours : dernier POI d'un jour → premier du jour suivant
              const isLastOfDay = !nextPoi || nextPoi.day !== poi.day;
              const isInterDay = isLastOfDay && nextPoi && isMultiDay;

              // Distance à vol d'oiseau pour les segments intra-jour
              const dist = nextPoi && nextPoi.day === poi.day
                ? getDistance(poi, nextPoi)
                : null;

              return (
                <div key={poi.id}>
                  {/* Séparateur de jour */}
                  {showDayHeader && (
                    <div className="flex items-center gap-2 px-1 py-1.5">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Jour {poi.day}
                      </span>
                      {routeDurations?.[poi.day]?.[selectedMode] && (
                        <span className="text-[10px] text-gray-400">
                          {formatDuration(routeDurations[poi.day][selectedMode].duration)}
                        </span>
                      )}
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>
                  )}

                  {/* POI draggable */}
                  <div
                    draggable
                    onDragStart={() => handleDragStart(poi.id)}
                    onDragOver={(e) => handleDragOver(e, poi.id)}
                    onDrop={(e) => handleDrop(e, poi.id)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-2 px-2 py-2 rounded-xl transition-all cursor-grab active:cursor-grabbing select-none ${dragOverId === poi.id ? 'bg-gray-100 scale-[1.01]' : 'hover:bg-gray-50'
                      } ${draggedId === poi.id ? 'opacity-40' : ''}`}
                  >
                    <GripVertical style={{ width: 11, height: 11, color: '#d1d5db', flexShrink: 0 }} />
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-semibold flex-shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{poi.nom}</p>
                    </div>
                    <MapPin style={{ width: 11, height: 11, color: '#d1d5db', flexShrink: 0 }} />
                  </div>

                  {/* Connecteur intra-jour */}
                  {dist !== null && (
                    <div className="flex items-center gap-1.5 pl-[28px] py-0.5">
                      <div className="w-px h-3 bg-gray-200 flex-shrink-0" />
                      <span className="text-[10px] text-gray-400 ml-1">
                        {dist} km · {modeLabel(nextPoi?.travel_mode)}
                      </span>
                    </div>
                  )}

                  {/* Connexion inter-jours — trait pointillé */}
                  {isInterDay && (
                    <div className="flex items-center gap-2 pl-[28px] py-1.5">
                      <div
                        className="w-px h-5 flex-shrink-0"
                        style={{
                          background: 'repeating-linear-gradient(to bottom, #d1d5db 0px, #d1d5db 3px, transparent 3px, transparent 6px)'
                        }}
                      />
                      <span className="text-[10px] text-gray-300 italic ml-1">Jour suivant</span>
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

// ── PanelsContainer ───────────────────────────────────────────────────
function PanelsContainer({ isVisible, onClose, itinerary, planPois, onDaysChange, routeDurations }) {
  const [selectedDays, setSelectedDays] = useState([]);
  const [localPois, setLocalPois] = useState([]);
  const [selectedMode, setSelectedMode] = useState('driving');

  useEffect(() => {
    setLocalPois(planPois || []);
  }, [planPois]);

  if (!isVisible || !itinerary) return null;

  const handleDayDetail = (days) => setSelectedDays(days);

  const handleReorder = async (updatedPois) => {
    // 1. Mettre à jour localPois immédiatement
    const allUpdated = [
      ...localPois.filter(p => !updatedPois.find(u => u.id === p.id)),
      ...updatedPois
    ];
    setLocalPois(allUpdated);

    // 2. Recalculer la carte avec le nouvel ordre
    onDaysChange(selectedDays, allUpdated);

    // 3. Sync backend
    await Promise.all(updatedPois.map(async (poi) => {
      try {
        await fetch(`http://localhost:8000/itineraire/${itinerary.id}/poi/${poi.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ day: poi.day, position: poi.position }),
        });
      } catch (e) {
        console.error('Erreur sync position', e);
      }
    }));
  };

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end gap-2 z-50">
      {selectedDays.length > 0 && (
        <RouteDetailPanel
          isVisible={true}
          selectedDays={selectedDays}
          pois={localPois}
          routeDurations={routeDurations}
          onReorder={handleReorder}
          selectedMode={selectedMode}
          onModeChange={(mode) => {
            setSelectedMode(mode);
            onDaysChange(selectedDays, null, mode);
          }}
        />
      )}
      <RoutePanel
        itinerary={itinerary}
        planPois={localPois}
        onDaysChange={onDaysChange}
        onDayDetail={handleDayDetail}
        onClose={onClose}
      />
    </div>
  );
}

export default PanelsContainer;