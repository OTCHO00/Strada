import { X, MapPin, Plus, Star } from 'lucide-react';

function PoiCard({ poi, onClose, onAddToTrip, onAddToFavorites, searchOpen }) {
  if (!poi) return null;

  return (
    <div className={`fixed top-4 w-72 bg-white border border-gray-200 rounded-2xl shadow-sm z-50 overflow-hidden transition-all duration-300 ${
      searchOpen ? 'left-10' : 'right-20' 
    }`}>
      
      {/* Header */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3">
        <div className="min-w-0 flex-1 pr-2">
          <h2 className="text-sm font-medium text-gray-900 leading-tight">{poi.name}</h2>
          {poi.category && (
            <span className="inline-block mt-1 text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {poi.category}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors flex-shrink-0"
        >
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>

      {/* Séparateur */}
      <div className="border-t border-gray-100 mx-4" />

      {/* Infos */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center gap-2 text-gray-400">
          <MapPin style={{ width: 12, height: 12, flexShrink: 0 }} />
          <span className="text-[11px] tabular-nums">
            {poi.coordinates.lat.toFixed(5)}, {poi.coordinates.lng.toFixed(5)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <Star style={{ width: 12, height: 12, flexShrink: 0 }} />
          <span className="text-[11px] text-gray-500">4.5 / 5</span>
        </div>
      </div>

      {/* Séparateur */}
      <div className="border-t border-gray-100 mx-4" />

      {/* Actions */}
      <div className="flex gap-2 px-4 py-3">
        <button
          onClick={() => onAddToFavorites?.(poi)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all"
        >
          <Star style={{ width: 12, height: 12 }} />
          Favori
        </button>
        <button
          onClick={() => onAddToTrip(poi)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-white bg-gray-900 border border-gray-900 rounded-xl hover:bg-gray-700 hover:border-gray-700 transition-all"
        >
          <Plus style={{ width: 12, height: 12 }} />
          Voyage
        </button>
      </div>

    </div>
  );
}

export default PoiCard;