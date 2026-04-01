import { X, MapPin, Navigation } from 'lucide-react';

export default function ViewRoutesModal({ 
  isOpen, 
  onClose, 
  itinerary, 
  planPois, 
  onSelectDay, 
  selectedDay 
}) {
  if (!isOpen || !itinerary) return null;

  const daysWithData = [];
  for (let day = 1; day <= itinerary.nb_jours; day++) {
    const dayPois = (planPois || [])
      .filter(p => p.day === day)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    
    if (dayPois.length > 0) {
      daysWithData.push({ day, pois: dayPois });
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Voir les trajets</h2>
              <p className="text-sm text-slate-500 mt-1">
                {itinerary.nom} - {itinerary.nb_jours} jours
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 140px)' }}>
          {daysWithData.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Aucun trajet disponible</p>
              <p className="text-sm text-slate-400 mt-1">
                Ajoutez des lieux à votre calendrier pour voir les itinéraires
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {daysWithData.map(({ day, pois }) => (
                <button
                  key={day}
                  onClick={() => {
                    onSelectDay(day);
                    onClose();
                  }}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    selectedDay === day
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-900">Jour {day}</h3>
                    <Navigation className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-sm text-slate-600 mb-2">
                    {pois.length} lieu{pois.length > 1 ? 'x' : ''}
                  </div>
                  <div className="space-y-1">
                    {pois.slice(0, 3).map((poi, idx) => (
                      <div key={poi.id} className="text-xs text-slate-500 flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-medium">
                          {idx + 1}
                        </span>
                        <span className="truncate">{poi.nom}</span>
                      </div>
                    ))}
                    {pois.length > 3 && (
                      <div className="text-xs text-slate-400 italic">
                        ...et {pois.length - 3} autre{pois.length - 3 > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
