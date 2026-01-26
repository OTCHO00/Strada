import { X, MapPin } from 'lucide-react';

function SelectItineraryModal({ poi, itineraries, onSelect, onClose }) {
  if (!poi) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Ajouter à un itinéraire</h2>
              <p className="text-sm text-slate-600 mt-1">{poi.name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Liste des itinéraires */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {itineraries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600 mb-4">Vous n'avez pas encore d'itinéraire</p>
              <p className="text-sm text-slate-500">Créez-en un dans la section Itinéraire</p>
            </div>
          ) : (
            <div className="space-y-3">
              {itineraries.map(itinerary => (
                <button
                  key={itinerary.id}
                  onClick={() => onSelect(itinerary)}
                  className="w-full text-left p-4 rounded-xl border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {itinerary.nom}
                    </h3>
                    <span className="text-xs bg-slate-100 group-hover:bg-indigo-100 text-slate-700 group-hover:text-indigo-700 px-2 py-1 rounded-full font-semibold transition-colors">
                      {itinerary.nb_jours} jours
                    </span>
                  </div>
                  {itinerary.description && (
                    <p className="text-sm text-slate-600 mb-2">{itinerary.description}</p>
                  )}
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="w-3 h-3" />
                    <span>{itinerary.pois?.length || 0} lieu{(itinerary.pois?.length || 0) > 1 ? 'x' : ''}</span>
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

export default SelectItineraryModal;