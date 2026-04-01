import { useState, useEffect } from 'react';
import { X, Navigation, Eye, EyeOff, Car, Bike, FootprintsIcon, MapPin, Clock, Route, Sun, Moon } from 'lucide-react';

const DAY_COLORS = [
  '#3B82F6', // Bleu
  '#10B981', // Vert  
  '#F59E0B', // Orange
  '#EF4444', // Rouge
  '#8B5CF6', // Violet
  '#EC4899', // Rose
  '#14B8A6', // Cyan
  '#F97316', // Orange foncé
  '#6366F1', // Indigo
];

const TRANSPORT_ICONS = {
  driving: Car,
  cycling: Bike, 
  walking: FootprintsIcon,
};

const TRANSPORT_MODES = ['driving', 'cycling', 'walking'];

export default function RouteControlPanel({ 
  isVisible, 
  onClose, 
  itinerary, 
  planPois, 
  selectedDay, 
  onDaySelect,
  onMultiDayToggle,
  isMultiDayMode,
  onTransportChange,
  routeInfo,
  onMapStyleChange,
  mapStyle
}) {
  const [hoveredDay, setHoveredDay] = useState(null);
  const [showTransportMenu, setShowTransportMenu] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!isVisible || !itinerary) return null;

  // Calculer les jours avec des trajets
  const daysWithRoutes = [];
  for (let day = 1; day <= itinerary.nb_jours; day++) {
    const dayPois = (planPois || [])
      .filter(p => p.day === day)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    
    if (dayPois.length >= 2) {
      daysWithRoutes.push({ 
        day, 
        pois: dayPois,
        transport: dayPois[0]?.travel_mode || 'driving',
        distance: routeInfo[day]?.distance,
        duration: routeInfo[day]?.duration
      });
    }
  }

  const TransportIcon = TRANSPORT_ICONS[daysWithRoutes.find(d => d.day === selectedDay)?.transport] || Car;

  return (
    <div 
      className={`fixed top-6 right-6 z-[60] bg-[#E8E9EB]/95 backdrop-blur-md rounded-2xl shadow-2xl border border-[#BBBCB6] p-6 w-80 transition-all duration-300 transform ${
        isAnimating ? 'scale-95 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Navigation className="w-6 h-6 text-[#746D69]" />
          <div>
            <h3 className="font-bold text-[#746D69] text-base">Navigation</h3>
            <p className="text-xs text-[#ACADA8]">{itinerary?.nom || 'Chargement...'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onMapStyleChange?.(mapStyle === 'day' ? 'night' : 'day')}
            className="p-2 rounded-xl hover:bg-[#CCCDC6]/50 transition-colors"
            title={mapStyle === 'day' ? 'Mode nuit' : 'Mode jour'}
          >
            {mapStyle === 'day' ? 
              <Moon className="w-5 h-5 text-[#746D69]" /> : 
              <Sun className="w-5 h-5 text-[#746D69]" />
            }
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[#CCCDC6]/50 transition-colors"
          >
            <X className="w-5 h-5 text-[#746D69]" />
          </button>
        </div>
      </div>

      {/* Toggle Vue */}
      {daysWithRoutes.length > 1 && (
        <div className="flex items-center gap-3 p-3 bg-[#CCCDC6]/30 rounded-xl mb-6">
          <button
            onClick={() => onMultiDayToggle(false)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-105 ${
              !isMultiDayMode ? 'bg-[#E8E9EB] text-[#746D69] shadow-sm ring-2 ring-[#ACADA8]' : 'text-[#746D69] hover:text-[#746D69] hover:bg-[#E8E9EB]'
            }`}
          >
            <Eye className="w-4 h-4" />
            1 jour
          </button>
          <button
            onClick={() => onMultiDayToggle(true)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-105 ${
              isMultiDayMode ? 'bg-[#E8E9EB] text-[#746D69] shadow-sm ring-2 ring-[#ACADA8]' : 'text-[#746D69] hover:text-[#746D69] hover:bg-[#E8E9EB]'
            }`}
          >
            <Route className="w-4 h-4" />
            Tous
          </button>
        </div>
      )}

      {/* Sélecteur de jours */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-[#746D69]">Jours avec trajets</span>
          {selectedDay && (
            <div className="flex items-center gap-2">
              <TransportIcon className="w-4 h-4 text-[#ACADA8]" />
              <button
                onClick={() => setShowTransportMenu(showTransportMenu === selectedDay ? null : selectedDay)}
                className="text-sm text-[#ACADA8] hover:text-[#746D69] font-medium"
              >
                {daysWithRoutes.find(d => d.day === selectedDay)?.transport || 'driving'}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-5 gap-3">
          {daysWithRoutes.map(({ day, pois, distance, duration }) => (
            <div key={day} className="relative">
              <button
                onClick={() => onDaySelect(day)}
                onMouseEnter={() => setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
                className={`w-full aspect-square rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center text-sm font-semibold transform hover:scale-110 hover:shadow-lg ${
                  selectedDay === day
                    ? 'border-[#746D69] bg-[#E8E9EB] text-[#746D69] shadow-sm scale-105 ring-2 ring-[#ACADA8]'
                    : isMultiDayMode
                    ? 'border-[#BBBCB6] bg-[#E8E9EB] hover:border-[#ACADA8] text-[#746D69] hover:shadow-md'
                    : 'border-[#BBBCB6] bg-[#E8E9EB] hover:border-[#ACADA8] text-[#746D69] hover:shadow-md'
                }`}
                style={{
                  ...(isMultiDayMode && selectedDay !== day && { 
                    backgroundColor: `${DAY_COLORS[(day - 1) % DAY_COLORS.length]}20`,
                    borderColor: DAY_COLORS[(day - 1) % DAY_COLORS.length] 
                  })
                }}
              >
                <span className="text-base font-bold">J{day}</span>
                <span className="text-xs opacity-70">{pois.length}</span>
              </button>

              {/* Tooltip au survol */}
              {hoveredDay === day && (distance || duration) && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-[#746D69] text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap z-10">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>{Math.round(duration / 60)}min</span>
                    <MapPin className="w-3 h-3" />
                    <span>{(distance / 1000).toFixed(1)}km</span>
                  </div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-[#746D69]"></div>
                </div>
              )}

              {/* Menu transport */}
              {showTransportMenu === day && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-[#E8E9EB] border border-[#BBBCB6] rounded-lg shadow-lg p-1 z-20">
                  {TRANSPORT_MODES.map(mode => {
                    const Icon = TRANSPORT_ICONS[mode];
                    return (
                      <button
                        key={mode}
                        onClick={() => {
                          onTransportChange(day, mode);
                          setShowTransportMenu(null);
                        }}
                        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[#CCCDC6]/50 text-xs w-full text-[#746D69]"
                      >
                        <Icon className="w-3 h-3" />
                        <span>{mode}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Légende multi-jours */}
        {isMultiDayMode && daysWithRoutes.length > 1 && (
          <div className="mt-3 pt-3 border-t border-[#BBBCB6]">
            <p className="text-xs font-semibold text-[#746D69] mb-2">Légende</p>
            <div className="flex flex-wrap gap-2">
              {daysWithRoutes.map(({ day }) => (
                <div key={day} className="flex items-center gap-1">
                  <div 
                    className="w-3 h-3 rounded-full border-2 border-[#E8E9EB] shadow-sm"
                    style={{ backgroundColor: DAY_COLORS[(day - 1) % DAY_COLORS.length] }}
                  />
                  <span className="text-xs text-[#746D69]">J{day}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pas de trajets */}
      {daysWithRoutes.length === 0 && (
        <div className="text-center py-4">
          <Route className="w-8 h-8 text-[#ACADA8] mx-auto mb-2" />
          <p className="text-xs text-[#746D69]">Aucun trajet disponible</p>
          <p className="text-[10px] text-[#ACADA8] mt-1">
            Ajoutez au moins 2 lieux à un jour
          </p>
        </div>
      )}
    </div>
  );
}
