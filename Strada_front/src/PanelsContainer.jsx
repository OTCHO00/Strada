import { useState, useEffect, useRef, useCallback } from 'react';
import API from './api.js';
import { X, MapPin, GripVertical } from 'lucide-react';
import { getDayColor } from './constants.js';
import { makeGlassStyle, getTheme, GRAIN_SVG } from './theme.js';
import { useT } from './translations.js';

const formatDuration = (s) => { if (!s) return null; const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60); return h > 0 ? `${h}h${m > 0 ? m + 'min' : ''}` : `${m} min`; };
const formatDistance = (m, units = 'km') => {
  if (!m) return null;
  if (units === 'miles') {
    const mi = m / 1609.34;
    return mi >= 0.1 ? `${mi.toFixed(1)} mi` : `${Math.round(m * 3.281)} ft`;
  }
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
};
const getDistance = (p1, p2) => {
  if (!p1 || !p2) return 0;
  const R = 6371, dLat = (p2.latitude - p1.latitude) * Math.PI / 180, dLon = (p2.longitude - p1.longitude) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(p1.latitude * Math.PI / 180) * Math.cos(p2.latitude * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
};
const modeLabel = (m) => m === 'walking' ? 'À pied' : m === 'cycling' ? 'Vélo' : 'Voiture';

// ── RoutePanel ────────────────────────────────────────────────────────
function RoutePanel({ itinerary, planPois, onDaysChange, onDayDetail, onClose, settings = {} }) {
  const t = getTheme(settings.sidebarColor);
  const grain = settings.sidebarGrain ?? 0.06;
  const tr = useT(settings.language);
  const [activeDays, setActiveDays] = useState([]);
  if (!itinerary) return null;
  const days = Array.from({ length: itinerary.nb_jours || 0 }, (_, i) => i + 1);
  const daysToShow = days.filter(d => (planPois || []).some(p => p.day === d));

  const toggleDay = (day) => {
    const next = activeDays.includes(day) ? activeDays.filter(d => d !== day) : [...activeDays, day];
    setActiveDays(next); onDaysChange(next); onDayDetail(next);
  };

  return (
    <div className="overflow-hidden w-72 relative" style={{ ...makeGlassStyle(settings.sidebarColor, 0.82), borderRadius: 16 }}>
      {grain > 0 && <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{ backgroundImage: GRAIN_SVG, backgroundRepeat: 'repeat', backgroundSize: '256px 256px', opacity: grain, mixBlendMode: t.dark ? 'screen' : 'multiply', zIndex: 0 }} />}
      <div className="relative z-10">
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${t.divider}` }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>{itinerary.nom}</p>
          <p className="text-xs mt-0.5" style={{ color: t.textTertiary }}>
            {activeDays.length === 0 ? tr('selectDays') : `${activeDays.length} ${activeDays.length > 1 ? tr('days') : tr('day')}`}
          </p>
        </div>
      </div>
      <div className="p-3">
        {daysToShow.length === 0 ? (
          <p className="text-xs text-center py-3" style={{ color: t.textTertiary }}>{tr('noPlanned')}</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {daysToShow.map(day => {
              const isActive = activeDays.includes(day);
              const color = getDayColor(day);
              const inactiveBorder = t.dark ? 'rgba(255,255,255,0.15)' : '#e5e5ea';
              const hoverBorder    = t.dark ? 'rgba(255,255,255,0.30)' : '#d1d1d6';
              return (
                <button key={day} onClick={() => toggleDay(day)}
                  style={isActive
                    ? { backgroundColor: color, borderColor: color, color: '#fff', transition: 'background 180ms cubic-bezier(0.16,1,0.3,1), transform 140ms cubic-bezier(0.16,1,0.3,1)' }
                    : { borderColor: inactiveBorder, color: t.textSecondary, transition: 'background 180ms cubic-bezier(0.16,1,0.3,1), color 180ms, border-color 180ms, transform 140ms cubic-bezier(0.16,1,0.3,1)' }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium active:scale-[0.94]"
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = hoverBorder; e.currentTarget.style.color = t.textPrimary; } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = inactiveBorder; e.currentTarget.style.color = t.textSecondary; } }}
                >
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white/80 flex-shrink-0" />}
                  {tr('dayShort')}{day}
                </button>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

// ── RouteDetailPanel ──────────────────────────────────────────────────
function RouteDetailPanel({ isVisible, selectedDays, pois, routeDurations, onReorder, selectedMode, onModeChange, onSegmentModeChange, units = 'km', settings = {} }) {
  const t = getTheme(settings.sidebarColor);
  const grain = settings.sidebarGrain ?? 0.06;
  const tr = useT(settings.language);
  const [mounted, setMounted] = useState(false);
  const [orderedPois, setOrderedPois] = useState([]);
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  useEffect(() => {
    if (isVisible) { const t = setTimeout(() => setMounted(true), 10); return () => clearTimeout(t); }
    else setMounted(false);
  }, [isVisible]);

  useEffect(() => {
    if (!pois || !selectedDays) return;
    setOrderedPois(pois.filter(p => selectedDays.includes(p.day)).sort((a, b) => a.day !== b.day ? a.day - b.day : (a.position ?? 0) - (b.position ?? 0)));
  }, [pois, selectedDays]);

  if (!isVisible || !selectedDays?.length || !pois) return null;

  const sortedDays = [...selectedDays].sort((a, b) => a - b);
  const isMultiDay = selectedDays.length > 1;
  const totalDuration = sortedDays.reduce((acc, day) => acc + (routeDurations?.[day]?.[selectedMode]?.duration || 0), 0);
  const totalDistance = sortedDays.reduce((acc, day) => acc + (routeDurations?.[day]?.[selectedMode]?.distance || 0), 0);

  const handleDragStart = (id) => setDraggedId(id);
  const handleDragOver = (e, id) => { e.preventDefault(); if (id !== draggedId) setDragOverId(id); };
  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) { setDraggedId(null); setDragOverId(null); return; }
    const from = orderedPois.find(p => p.id === draggedId), to = orderedPois.find(p => p.id === targetId);
    if (!from || !to) return;
    const arr = [...orderedPois];
    const fi = arr.findIndex(p => p.id === draggedId), ti = arr.findIndex(p => p.id === targetId);
    arr[fi] = { ...from, day: to.day };
    const [moved] = arr.splice(fi, 1); arr.splice(ti, 0, moved);
    const updated = arr.map(p => ({ ...p, position: arr.filter(x => x.day === p.day).findIndex(x => x.id === p.id) }));
    setOrderedPois(updated); setDraggedId(null); setDragOverId(null); onReorder?.(updated);
  };
  const handleDragEnd = () => { setDraggedId(null); setDragOverId(null); };

  // Adaptive backgrounds for inner UI elements
  const pillBg       = t.dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.05)';
  const activeModeBg = t.dark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.90)';
  const hoverItemBg  = t.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)';
  const segActiveBg  = t.dark ? 'rgba(255,255,255,0.85)' : '#1c1c1e';
  const segActiveFilter = t.dark ? 'none' : 'invert(1)';

  return (
    <div className={`overflow-hidden w-72 relative ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`} style={{ ...makeGlassStyle(settings.sidebarColor, 0.82), borderRadius: 16, transition: 'transform 320ms cubic-bezier(0.32, 0.72, 0, 1), opacity 280ms cubic-bezier(0.16, 1, 0.3, 1)' }}>
      {grain > 0 && <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{ backgroundImage: GRAIN_SVG, backgroundRepeat: 'repeat', backgroundSize: '256px 256px', opacity: grain, mixBlendMode: t.dark ? 'screen' : 'multiply', zIndex: 0 }} />}
      <div className="relative z-10">
      <div className="px-4 py-3" style={{ borderBottom: `1px solid ${t.divider}` }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex gap-1">
            {sortedDays.slice(0, 4).map(day => <span key={day} className="w-2 h-2 rounded-full" style={{ backgroundColor: getDayColor(day) }} />)}
          </div>
          <p className="text-xs font-semibold" style={{ color: t.textPrimary }}>
            {isMultiDay ? `${tr('days')} ${sortedDays.join(', ')}` : `${tr('day')} ${sortedDays[0]}`}
          </p>
        </div>

        {/* Mode selector */}
        <div className="flex gap-1 mb-2 rounded-xl p-1" style={{ background: pillBg }}>
          {[{ key: 'driving', src: '/car.png' }, { key: 'cycling', src: '/bike.png' }, { key: 'walking', src: '/man-walking.png' }, { key: 'flying', src: '/airplane.png' }].map(({ key, src }) => (
            <button key={key} onClick={() => onModeChange(key)}
              className="btn-press flex-1 py-1.5 rounded-lg flex items-center justify-center"
              style={{ background: selectedMode === key ? activeModeBg : 'transparent', boxShadow: selectedMode === key ? '0 1px 4px rgba(0,0,0,0.12)' : 'none', transition: 'transform 140ms cubic-bezier(0.16,1,0.3,1), background 150ms ease-out, box-shadow 150ms ease-out' }}>
              <img src={src} alt={key} className="w-5 h-5 object-contain"
                style={{ opacity: selectedMode === key ? (t.dark ? 1 : 1) : 0.35, filter: t.dark && selectedMode === key ? 'none' : 'none' }} />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {totalDuration > 0 && <span className="text-[10px]" style={{ color: t.textSecondary }}>⏱ {formatDuration(totalDuration)}</span>}
          {totalDistance > 0 && <span className="text-[10px]" style={{ color: t.textSecondary }}>📍 {formatDistance(totalDistance, units)}</span>}
          <span className="text-[10px]" style={{ color: t.textTertiary }}>{orderedPois.length} lieux</span>
        </div>
      </div>

      <div className="overflow-y-auto max-h-64">
        {orderedPois.length === 0 ? (
          <p className="text-xs text-center py-6" style={{ color: t.textTertiary }}>{tr('noPOI')}</p>
        ) : (
          <div className="p-2">
            {orderedPois.map((poi, idx) => {
              const color = getDayColor(poi.day);
              const showHeader = isMultiDay && (idx === 0 || orderedPois[idx - 1].day !== poi.day);
              const next = orderedPois[idx + 1];
              const dist = next && next.day === poi.day ? getDistance(poi, next) : null;
              const isInterDay = (!next || next.day !== poi.day) && next && isMultiDay;

              return (
                <div key={poi.id}>
                  {showHeader && (
                    <div className="flex items-center gap-2 px-1 py-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: t.textSecondary }}>{tr('day')} {poi.day}</span>
                      {routeDurations?.[poi.day]?.[selectedMode] && <span className="text-[10px]" style={{ color: t.textTertiary }}>{formatDuration(routeDurations[poi.day][selectedMode].duration)}</span>}
                      <div className="flex-1 h-px" style={{ background: t.divider }} />
                    </div>
                  )}
                  <div
                    draggable onDragStart={() => handleDragStart(poi.id)} onDragOver={e => handleDragOver(e, poi.id)}
                    onDrop={e => handleDrop(e, poi.id)} onDragEnd={handleDragEnd}
                    className={`flex items-center gap-2 px-2 py-2 rounded-xl cursor-grab active:cursor-grabbing select-none ${draggedId === poi.id ? 'opacity-40 scale-[0.97]' : ''}`}
                    style={{ background: dragOverId === poi.id ? hoverItemBg : '', transition: 'background 120ms ease-out, transform 150ms cubic-bezier(0.16, 1, 0.3, 1)' }}
                    onMouseEnter={e => { if (draggedId !== poi.id) e.currentTarget.style.background = hoverItemBg; }}
                    onMouseLeave={e => { if (dragOverId !== poi.id) e.currentTarget.style.background = ''; }}
                  >
                    <GripVertical style={{ width: 11, height: 11, color: t.textTertiary, flexShrink: 0 }} />
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0" style={{ backgroundColor: color }}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: t.textPrimary }}>{poi.nom}</p>
                    </div>
                    <MapPin style={{ width: 11, height: 11, color: t.textTertiary, flexShrink: 0 }} />
                  </div>
                  {dist !== null && (
                    <div className="flex items-center gap-2 pl-[28px] py-1">
                      <div className="w-px h-5 flex-shrink-0" style={{ background: t.divider }} />
                      <div className="flex items-center gap-0.5 rounded-lg p-0.5 flex-shrink-0" style={{ background: pillBg }}>
                        {[{ key: 'driving', src: '/car.png' }, { key: 'cycling', src: '/bike.png' }, { key: 'walking', src: '/man-walking.png' }, { key: 'flying', src: '/airplane.png' }].map(({ key, src }) => {
                          const segMode = next?.travel_mode || selectedMode;
                          const isActive = segMode === key;
                          return (
                            <button key={key} onClick={() => onSegmentModeChange?.(next.id, key)}
                              className="w-6 h-6 rounded-md flex items-center justify-center cursor-default focus:outline-none"
                              style={{ background: isActive ? segActiveBg : 'transparent', transition: 'background 140ms ease-out' }}>
                              <img src={src} alt={key} className="w-3.5 h-3.5 object-contain"
                                style={{ opacity: isActive ? 1 : 0.30, filter: isActive ? segActiveFilter : 'none' }} />
                            </button>
                          );
                        })}
                      </div>
                      <span className="text-[10px]" style={{ color: t.textTertiary }}>{formatDistance(dist * 1000, units)}</span>
                    </div>
                  )}
                  {isInterDay && (
                    <div className="flex items-center gap-2 pl-[28px] py-1.5">
                      <div className="w-px h-5" style={{ background: `repeating-linear-gradient(to bottom, ${t.divider} 0px, ${t.divider} 3px, transparent 3px, transparent 6px)` }} />
                      <span className="text-[10px] italic ml-1" style={{ color: t.textTertiary }}>{tr('nextDay')}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

// ── PanelsContainer ───────────────────────────────────────────────────
function PanelsContainer({ isVisible, isClosing, onClose, itinerary, planPois, onDaysChange, routeDurations, defaultTransport, units, settings = {}, onHeightChange }) {
  const [selectedDays, setSelectedDays] = useState([]);
  const [localPois, setLocalPois] = useState([]);
  const [selectedMode, setSelectedMode] = useState(defaultTransport || 'driving');
  const containerRef = useRef(null);

  useEffect(() => { setLocalPois(planPois || []); }, [planPois]);

  // Observe la hauteur totale du container et remonte les changements
  useEffect(() => {
    if (!containerRef.current || !onHeightChange) return;
    const observer = new ResizeObserver(entries => {
      const h = entries[0]?.contentRect?.height;
      if (h) onHeightChange(h);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [onHeightChange]);

  if ((!isVisible && !isClosing) || !itinerary) return null;

  const handleSegmentModeChange = async (poiId, mode) => {
    const updatedPois = localPois.map(p => p.id === poiId ? { ...p, travel_mode: mode } : p);
    setLocalPois(updatedPois);
    const poi = localPois.find(p => p.id === poiId);
    if (poi) {
      try {
        await fetch(`${API}/itineraire/${itinerary.id}/poi/${poiId}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ day: poi.day, position: poi.position, travel_mode: mode }),
        });
      } catch (e) { console.error(e); }
    }
    onDaysChange(selectedDays, updatedPois, selectedMode);
  };

  const handleReorder = async (updatedPois) => {
    const allUpdated = [...localPois.filter(p => !updatedPois.find(u => u.id === p.id)), ...updatedPois];
    setLocalPois(allUpdated); onDaysChange(selectedDays, allUpdated);
    await Promise.all(updatedPois.map(async poi => {
      try {
        await fetch(`${API}/itineraire/${itinerary.id}/poi/${poi.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ day: poi.day, position: poi.position }),
        });
      } catch (e) { console.error(e); }
    }));
  };

  return (
    <div ref={containerRef} className={`fixed bottom-6 right-3 flex flex-col items-end gap-2 z-50 ${isClosing ? 'panels-slide-out' : 'panels-slide-in'}`}>
      {selectedDays.length > 0 && (
        <RouteDetailPanel
          isVisible={true} selectedDays={selectedDays} pois={localPois} routeDurations={routeDurations}
          onReorder={handleReorder} selectedMode={selectedMode}
          onModeChange={mode => { setSelectedMode(mode); onDaysChange(selectedDays, null, mode); }}
          onSegmentModeChange={handleSegmentModeChange}
          units={units} settings={settings}
        />
      )}
      <RoutePanel
        itinerary={itinerary} planPois={localPois} onDaysChange={onDaysChange}
        onDayDetail={days => setSelectedDays(days)} onClose={onClose} settings={settings}
      />
    </div>
  );
}

export default PanelsContainer;
