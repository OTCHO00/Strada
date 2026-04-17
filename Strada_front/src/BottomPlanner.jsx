import { useState, useEffect } from 'react';
import { X, ChevronDown, Plus } from 'lucide-react';
import { makeGlassStyle, getTheme, GRAIN_SVG } from './theme.js';

const PALETTE = ['#5856d6','#34aadc','#30b0c7','#34c759','#ff9500','#af52de','#ff2d55','#5ac8fa','#ff6b35','#32ade6'];
const getSavedTripColors = () => { try { return JSON.parse(localStorage.getItem('strada_trip_colors') || '{}'); } catch { return {}; } };
const tripColor = (itineraries, id) => {
  const saved = getSavedTripColors();
  if (saved[id]) return saved[id];
  return PALETTE[itineraries.findIndex(i => i.id === id) % PALETTE.length] || PALETTE[0];
};
const dayColor = (day) => PALETTE[(day - 1) % PALETTE.length];

function BottomPlanner({ isVisible, isClosing, onClose, itinerary, itineraries, onTripPoisChange, height = 160, settings = {} }) {
  const t = getTheme(settings.sidebarColor);
  const grain = settings.sidebarGrain ?? 0.06;

  const [planPois, setPlanPois]       = useState([]);
  const [calendar, setCalendar]       = useState({});
  const [loading, setLoading]         = useState(false);
  const [draggedPoi, setDraggedPoi]   = useState(null);
  const [dragSource, setDragSource]   = useState(null);
  const [draggedPoiId, setDraggedPoiId] = useState(null);
  const [dragOverDay, setDragOverDay] = useState(null);
  const [dragOverPool, setDragOverPool] = useState(false);
  const [poolCollapsed, setPoolCollapsed] = useState(false);

  useEffect(() => {
    if (!itinerary) return;
    fetchPlan(itinerary.id);
  }, [itinerary?.id]);

  const fetchPlan = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/itineraire/${id}/plan`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      const pool = list.filter(p => !p.day || p.day === 0);
      const cal = {};
      for (let d = 1; d <= (itinerary?.nb_jours || 0); d++)
        cal[d] = list.filter(p => p.day === d).sort((a, b) => (a.position || 0) - (b.position || 0));
      setPlanPois(pool);
      setCalendar(cal);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleDragStart = (poi, source) => { setDraggedPoi(poi); setDragSource(source); setDraggedPoiId(poi.id); };
  const handleDragEnd   = () => { setDraggedPoi(null); setDragSource(null); setDraggedPoiId(null); };

  const handleDropOnDay = async (day) => {
    setDragOverDay(null);
    if (!draggedPoi) return;
    const poi = draggedPoi; const source = dragSource;
    if (source === 'pool') {
      setPlanPois(prev => prev.filter(p => p.id !== poi.id));
      setCalendar(prev => ({ ...prev, [day]: [...(prev[day] || []), { ...poi, day, position: prev[day]?.length || 0 }] }));
    } else if (source?.startsWith('day-')) {
      const fromDay = parseInt(source.replace('day-', ''));
      if (fromDay === day) { handleDragEnd(); return; }
      setCalendar(prev => ({ ...prev, [fromDay]: prev[fromDay].filter(p => p.id !== poi.id), [day]: [...(prev[day] || []), { ...poi, day, position: prev[day]?.length || 0 }] }));
    }
    try {
      await fetch(`http://localhost:8000/itineraire/${itinerary.id}/poi/${poi.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ day, position: 0 }),
      });
      onTripPoisChange?.();
    } catch (e) { console.error(e); }
    handleDragEnd();
  };

  const handleDropOnPool = async () => {
    setDragOverPool(false);
    if (!draggedPoi || dragSource === 'pool') { handleDragEnd(); return; }
    const poi = draggedPoi; const fromDay = parseInt(dragSource.replace('day-', ''));
    setCalendar(prev => ({ ...prev, [fromDay]: prev[fromDay].filter(p => p.id !== poi.id) }));
    setPlanPois(prev => [...prev, { ...poi, day: 0 }]);
    try {
      await fetch(`http://localhost:8000/itineraire/${itinerary.id}/poi/${poi.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ day: 0, position: 0 }),
      });
      onTripPoisChange?.();
    } catch (e) { console.error(e); }
    handleDragEnd();
  };

  const handleDeletePoi = async (poiId, day) => {
    try {
      await fetch(`http://localhost:8000/itineraire/${itinerary.id}/poi/${poiId}`, { method: 'DELETE' });
      if (!day || day === 0) setPlanPois(prev => prev.filter(p => p.id !== poiId));
      else setCalendar(prev => ({ ...prev, [day]: prev[day].filter(p => p.id !== poiId) }));
      onTripPoisChange?.();
    } catch (e) { console.error(e); }
  };

  if (!isVisible && !isClosing) return null;
  if (!itinerary) return null;

  const days = Array.from({ length: itinerary.nb_jours || 0 }, (_, i) => i + 1);
  const totalPois = planPois.length + Object.values(calendar).reduce((s, a) => s + a.length, 0);
  const totalPlanned = Object.values(calendar).reduce((s, a) => s + a.length, 0);
  const tc = tripColor(itineraries, itinerary.id);

  return (
    <div
      className={`fixed z-[60] flex flex-col ${isClosing ? 'planner-slide-out' : 'planner-slide-in'}`}
      style={{ bottom: 24, left: 12, right: 308, height, minHeight: 280, borderRadius: 20, transition: 'height 280ms cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      {/* Glass shell */}
      <div className="absolute inset-0 pointer-events-none" style={{ ...makeGlassStyle(settings.sidebarColor, 0.82), borderRadius: 20 }} />
      {grain > 0 && (
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: GRAIN_SVG, backgroundRepeat: 'repeat', backgroundSize: '256px 256px',
          opacity: grain, mixBlendMode: t.dark ? 'screen' : 'multiply', borderRadius: 20,
        }} />
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0" style={{ borderBottom: `1px solid ${t.divider}` }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: tc }}>
              <span className="text-white text-[9px] font-bold">{itinerary.nb_jours}j</span>
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight" style={{ color: t.textPrimary }}>{itinerary.nom || 'Voyage sans nom'}</p>
              <p className="text-[11px]" style={{ color: t.textTertiary }}>{totalPlanned}/{totalPois} lieu{totalPois > 1 ? 'x' : ''} planifié{totalPlanned > 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-press w-7 h-7 rounded-lg flex items-center justify-center cursor-default focus:outline-none"
            style={{ background: t.closeBtnBg, color: t.closeBtnColor }}
          >
            <X style={{ width: 13, height: 13 }} />
          </button>
        </div>

        {/* ── Body ── */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center gap-2">
            <div className="w-4 h-4 rounded-full animate-spin" style={{ border: `2px solid ${t.divider}`, borderTopColor: t.textSecondary }} />
            <span className="text-xs" style={{ color: t.textTertiary }}>Chargement…</span>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">

            {/* ── Pool (left panel, collapsible) ── */}
            <div
              className="flex-shrink-0 flex flex-col"
              style={{
                width: poolCollapsed ? 34 : 190,
                transition: 'width 260ms cubic-bezier(0.16, 1, 0.3, 1)',
                borderRight: `1px solid ${t.divider}`,
              }}
            >
              <button
                onClick={() => setPoolCollapsed(c => !c)}
                className="btn-press flex items-center gap-1.5 px-2 py-2 flex-shrink-0 cursor-default focus:outline-none w-full"
                style={{ transition: 'transform 160ms cubic-bezier(0.16, 1, 0.3, 1), background 120ms ease-out' }}
                onMouseEnter={e => { if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) e.currentTarget.style.background = t.dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = ''; }}
              >
                {!poolCollapsed && (
                  <>
                    <span className="text-[10px] font-semibold uppercase tracking-wider truncate flex-1 text-left" style={{ color: t.textSecondary }}>Non planifiés</span>
                    {planPois.length > 0 && (
                      <span className="text-[9px] font-bold px-1 py-0.5 rounded-full flex-shrink-0" style={{ background: t.textSecondary, color: t.dark ? '#000' : '#fff' }}>{planPois.length}</span>
                    )}
                  </>
                )}
                <ChevronDown style={{ width: 12, height: 12, color: t.textTertiary, flexShrink: 0, transform: poolCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 240ms cubic-bezier(0.16, 1, 0.3, 1)' }} />
              </button>

              <div
                className="flex-1 overflow-y-auto overflow-x-hidden p-1.5 flex flex-col gap-1"
                onDragOver={e => { e.preventDefault(); setDragOverPool(true); }}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverPool(false); }}
                onDrop={handleDropOnPool}
                style={{ background: dragOverPool ? (t.dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)') : '', transition: 'background 150ms ease-out' }}
              >
                {!poolCollapsed && planPois.length === 0 && (
                  <p className="text-[10px] text-center py-2 px-1" style={{ color: t.textTertiary }}>
                    {dragOverPool ? '↓ Déposer' : 'Tous planifiés ✓'}
                  </p>
                )}
                {!poolCollapsed && planPois.map((poi, idx) => (
                  <div
                    key={poi.id}
                    draggable
                    onDragStart={() => handleDragStart(poi, 'pool')}
                    onDragEnd={handleDragEnd}
                    className="poi-chip flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-grab active:cursor-grabbing select-none"
                    style={{
                      background: 'rgba(255,255,255,0.55)',
                      border: '1px solid rgba(255,255,255,0.5)',
                      animationDelay: `${idx * 28}ms`,
                      opacity: draggedPoiId === poi.id ? 0.35 : 1,
                      transform: draggedPoiId === poi.id ? 'scale(0.95)' : 'scale(1)',
                      transition: 'transform 150ms cubic-bezier(0.16, 1, 0.3, 1), background 120ms ease-out',
                    }}
                    onMouseEnter={e => { if (!draggedPoiId && window.matchMedia('(hover: hover) and (pointer: fine)').matches) e.currentTarget.style.background = 'rgba(255,255,255,0.80)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.55)'; }}
                  >
                    <p className="text-[11px] font-medium truncate" style={{ color: t.textPrimary }}>{poi.name || poi.nom || 'Sans nom'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Day columns ── */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
              <div key={itinerary.id} className="flex gap-2 p-2 h-full" style={{ width: 'max-content', minWidth: '100%' }}>
                {days.map((day, dayIdx) => {
                  const dayPois = calendar[day] || [];
                  const hasItems = dayPois.length > 0;
                  const isOver = dragOverDay === day;
                  const dc = dayColor(day);

                  return (
                    <div
                      key={day}
                      onDragOver={e => { e.preventDefault(); setDragOverDay(day); }}
                      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverDay(null); }}
                      onDrop={() => handleDropOnDay(day)}
                      className="day-col flex flex-col flex-shrink-0 h-full"
                      style={{ width: 136, animationDelay: `${dayIdx * 40}ms` }}
                    >
                      {/* Day header */}
                      <div
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-xl mb-1.5 flex-shrink-0"
                        style={{
                          background: isOver ? dc : dc + '20',
                          border: `1px solid ${isOver ? dc : dc + '55'}`,
                          transition: 'background 150ms ease-out, border-color 150ms ease-out',
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: isOver ? 'rgba(255,255,255,0.3)' : dc }}>
                            <span className="text-[8px] font-bold text-white">{day}</span>
                          </div>
                          <span className="text-[11px] font-semibold" style={{ color: isOver ? 'white' : '#1c1c1e' }}>Jour {day}</span>
                        </div>
                        <span className="text-[10px] font-bold px-1 py-0.5 rounded-full" style={{ background: isOver ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.70)', color: isOver ? 'white' : dc }}>
                          {dayPois.length}
                        </span>
                      </div>

                      {/* Drop zone */}
                      <div
                        className="flex-1 rounded-xl overflow-y-auto p-1.5 flex flex-col gap-1"
                        style={{
                          borderWidth: 1.5,
                          borderStyle: hasItems ? 'solid' : 'dashed',
                          borderColor: isOver ? dc : hasItems ? dc + '55' : 'rgba(0,0,0,0.10)',
                          background: isOver ? dc + '10' : hasItems ? 'rgba(255,255,255,0.40)' : 'rgba(255,255,255,0.18)',
                          boxShadow: isOver ? `0 0 0 2px ${dc}25` : 'none',
                          transition: 'border-color 150ms, background 150ms, box-shadow 150ms',
                        }}
                      >
                        {!hasItems && (
                          <div className="flex-1 flex flex-col items-center justify-center gap-1">
                            <Plus style={{ width: 11, height: 11, color: isOver ? dc : '#d1d1d6' }} />
                            <p className="text-[9px] text-center" style={{ color: isOver ? dc : '#d1d1d6' }}>{isOver ? 'Déposer ici' : 'Glisser un lieu'}</p>
                          </div>
                        )}
                        {dayPois.map((poi, idx) => (
                          <div
                            key={poi.id}
                            draggable
                            onDragStart={() => handleDragStart(poi, `day-${day}`)}
                            onDragEnd={handleDragEnd}
                            className="poi-chip group flex items-center gap-1 px-1.5 py-1.5 rounded-lg cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                            style={{
                              background: 'rgba(255,255,255,0.68)',
                              border: '1px solid rgba(255,255,255,0.55)',
                              borderLeft: `2px solid ${dc}`,
                              animationDelay: `${idx * 28}ms`,
                              opacity: draggedPoiId === poi.id ? 0.35 : 1,
                              transform: draggedPoiId === poi.id ? 'scale(0.95)' : 'scale(1)',
                              transition: 'opacity 150ms ease-out, transform 150ms ease-out',
                            }}
                          >
                            <span className="text-[9px] font-bold flex-shrink-0 w-3 text-center" style={{ color: dc }}>{idx + 1}</span>
                            <p className="text-[11px] font-medium leading-tight flex-1 truncate min-w-0" style={{ color: t.textPrimary }}>{poi.name || poi.nom || 'Sans nom'}</p>
                            <button
                              onClick={() => handleDeletePoi(poi.id, day)}
                              className="w-4 h-4 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 cursor-default focus:outline-none"
                              style={{ color: t.textTertiary }}
                              onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; }}
                              onMouseLeave={e => { e.currentTarget.style.color = t.textTertiary; }}
                            >
                              <X style={{ width: 8, height: 8 }} />
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
      </div>
    </div>
  );
}

export default BottomPlanner;
