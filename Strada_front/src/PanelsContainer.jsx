import { useState, useEffect } from 'react';
import { X, MapPin, GripVertical } from 'lucide-react';
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

// Shared card style
const panelCard = {
  background: 'rgba(18, 18, 22, 0.92)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
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
    <div
      className="rounded-2xl overflow-hidden w-72 border border-[#262630]"
      style={panelCard}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1e]">
        <div>
          <p className="text-sm font-medium text-[#f0f0f4]">{itinerary.nom}</p>
          <p className="text-xs text-[#484854] mt-0.5">
            {activeDays.length === 0
              ? 'Sélectionnez des jours'
              : `${activeDays.length} jour${activeDays.length > 1 ? 's' : ''} affiché${activeDays.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-[#484854] hover:bg-[#1c1c20] hover:text-[#f0f0f4] transition-colors"
        >
          <X style={{ width: 13, height: 13 }} />
        </button>
      </div>

      <div className="p-3">
        {daysToShow.length === 0 ? (
          <p className="text-xs text-[#484854] text-center py-3">Aucun lieu planifié</p>
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
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                    isActive ? '' : 'border-[#262630] text-[#484854] hover:border-[#38383f] hover:text-[#f0f0f4]'
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

    newOrder[fromIdx] = { ...draggedPoi, day: targetPoi.day };
    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, moved);

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
    <div
      className={`rounded-2xl overflow-hidden w-72 border border-[#262630] transition-all duration-300 ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      }`}
      style={panelCard}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1a1a1e]">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex gap-1">
            {sortedDays.slice(0, 4).map(day => (
              <span key={day} className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getDayColor(day) }} />
            ))}
          </div>
          <p className="text-xs font-medium text-[#f0f0f4]">
            {isMultiDay ? `Jours ${sortedDays.join(', ')}` : `Jour ${sortedDays[0]}`}
          </p>
        </div>

        {/* Mode selector */}
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
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center transition-all ${
                selectedMode === key
                  ? 'bg-white'
                  : 'bg-[#1c1c20] hover:bg-[#242428]'
              }`}
            >
              <img
                src={src}
                alt={key}
                className={`w-5 h-5 object-contain transition-all ${
                  selectedMode === key
                    ? 'opacity-100'
                    : 'invert opacity-50'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3">
          {totalDuration > 0 && (
            <span className="text-[10px] text-[#484854]">⏱ {formatDuration(totalDuration)}</span>
          )}
          {totalDistance > 0 && (
            <span className="text-[10px] text-[#484854]">📍 {formatDistance(totalDistance)}</span>
          )}
          <span className="text-[10px] text-[#484854]">{orderedPois.length} lieux</span>
        </div>
      </div>

      {/* POI list */}
      <div className="overflow-y-auto max-h-64">
        {orderedPois.length === 0 ? (
          <p className="text-xs text-[#484854] text-center py-6">Aucun lieu prévu</p>
        ) : (
          <div className="p-2">
            {orderedPois.map((poi, idx) => {
              const color = getDayColor(poi.day);
              const showDayHeader = isMultiDay && (idx === 0 || orderedPois[idx - 1].day !== poi.day);
              const nextPoi = orderedPois[idx + 1];
              const isLastOfDay = !nextPoi || nextPoi.day !== poi.day;
              const isInterDay = isLastOfDay && nextPoi && isMultiDay;
              const dist = nextPoi && nextPoi.day === poi.day
                ? getDistance(poi, nextPoi)
                : null;

              return (
                <div key={poi.id}>
                  {showDayHeader && (
                    <div className="flex items-center gap-2 px-1 py-1.5">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-[10px] font-medium text-[#484854] uppercase tracking-wider">
                        Jour {poi.day}
                      </span>
                      {routeDurations?.[poi.day]?.[selectedMode] && (
                        <span className="text-[10px] text-[#3c3c44]">
                          {formatDuration(routeDurations[poi.day][selectedMode].duration)}
                        </span>
                      )}
                      <div className="flex-1 h-px bg-[#1a1a1e]" />
                    </div>
                  )}

                  <div
                    draggable
                    onDragStart={() => handleDragStart(poi.id)}
                    onDragOver={(e) => handleDragOver(e, poi.id)}
                    onDrop={(e) => handleDrop(e, poi.id)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-2 px-2 py-2 rounded-xl transition-all cursor-grab active:cursor-grabbing select-none ${
                      dragOverId === poi.id ? 'bg-[#1c1c20] scale-[1.01]' : 'hover:bg-[#1a1a1e]'
                    } ${draggedId === poi.id ? 'opacity-40' : ''}`}
                  >
                    <GripVertical style={{ width: 11, height: 11, color: '#2a2a30', flexShrink: 0 }} />
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-semibold flex-shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#f0f0f4] truncate">{poi.nom}</p>
                    </div>
                    <MapPin style={{ width: 11, height: 11, color: '#2a2a30', flexShrink: 0 }} />
                  </div>

                  {dist !== null && (
                    <div className="flex items-center gap-1.5 pl-[28px] py-0.5">
                      <div className="w-px h-3 bg-[#262630] flex-shrink-0" />
                      <span className="text-[10px] text-[#484854] ml-1">
                        {dist} km · {modeLabel(nextPoi?.travel_mode)}
                      </span>
                    </div>
                  )}

                  {isInterDay && (
                    <div className="flex items-center gap-2 pl-[28px] py-1.5">
                      <div
                        className="w-px h-5 flex-shrink-0"
                        style={{
                          background: 'repeating-linear-gradient(to bottom, #262630 0px, #262630 3px, transparent 3px, transparent 6px)'
                        }}
                      />
                      <span className="text-[10px] text-[#3c3c44] italic ml-1">Jour suivant</span>
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
    const allUpdated = [
      ...localPois.filter(p => !updatedPois.find(u => u.id === p.id)),
      ...updatedPois
    ];
    setLocalPois(allUpdated);
    onDaysChange(selectedDays, allUpdated);

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
    <div className="fixed bottom-24 right-4 flex flex-col items-end gap-2 z-50">
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
