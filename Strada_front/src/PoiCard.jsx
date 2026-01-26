import { X, MapPin, Plus, Star } from 'lucide-react';

function PoiCard({ poi, onClose, onAddToTrip }) {
  if (!poi) return null;

  return (
    <div className="fixed top-20 right-8 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
      {/* Header avec image placeholder */}
      <div className="h-48 bg-gradient-to-br from-indigo-500 to-purple-600 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="absolute bottom-4 left-4 right-4">
          <h2 className="text-2xl font-bold text-white mb-1">{poi.name}</h2>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-xs text-white font-medium">
              {poi.category}
            </span>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-6 space-y-4">
        <div className="flex items-start gap-2">
          <MapPin className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-slate-600">
              {poi.coordinates.lat.toFixed(6)}, {poi.coordinates.lng.toFixed(6)}
            </p>
          </div>
        </div>

        {/* Placeholder pour les infos supplémentaires */}
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="text-sm text-slate-600">4.5 / 5</span>
          </div>
        </div>

        {/* Bouton ajouter au trajet */}
        <button
          onClick={() => onAddToTrip(poi)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Ajouter à un trajet
        </button>
      </div>
    </div>
  );
}

export default PoiCard;