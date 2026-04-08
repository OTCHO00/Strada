import { X, MapPin, Plus, Star } from 'lucide-react';

function PoiCard({ poi, onClose, onAddToTrip, onAddToFavorites, searchOpen }) {
  if (!poi) return null;

  return (
    <div
      className={`fixed top-4 w-72 z-50 overflow-hidden transition-all duration-300 fade-up rounded-2xl border border-[#262630] ${
        searchOpen ? 'left-10' : 'right-20'
      }`}
      style={{
        background: 'rgba(18, 18, 22, 0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3">
        <div className="min-w-0 flex-1 pr-2">
          <h2 className="text-sm font-medium text-[#f0f0f4] leading-tight">{poi.name}</h2>
          {poi.category && (
            <span className="inline-block mt-1 text-[10px] font-medium text-[#78787f] bg-[#242428] border border-[#262630] px-2 py-0.5 rounded-full">
              {poi.category}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#484854] hover:bg-[#1c1c20] hover:text-[#f0f0f4] transition-colors flex-shrink-0"
        >
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>

      <div className="border-t border-[#1a1a1e] mx-4" />

      {/* Infos */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center gap-2 text-[#484854]">
          <MapPin style={{ width: 12, height: 12, flexShrink: 0 }} />
          <span className="text-[11px] tabular-nums">
            {poi.coordinates.lat.toFixed(5)}, {poi.coordinates.lng.toFixed(5)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[#484854]">
          <Star style={{ width: 12, height: 12, flexShrink: 0 }} />
          <span className="text-[11px] text-[#78787f]">4.5 / 5</span>
        </div>
      </div>

      <div className="border-t border-[#1a1a1e] mx-4" />

      {/* Actions */}
      <div className="flex gap-2 px-4 py-3">
        <button
          onClick={() => onAddToFavorites?.(poi)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-[#a0a0aa] bg-[#1c1c20] border border-[#262630] rounded-xl hover:bg-white hover:text-[#0d0d0f] hover:border-white transition-all"
        >
          <Star style={{ width: 12, height: 12 }} />
          Favori
        </button>
        <button
          onClick={() => onAddToTrip(poi)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-[#0d0d0f] bg-white border border-white rounded-xl hover:bg-[#e0e0e6] hover:border-[#e0e0e6] transition-all"
        >
          <Plus style={{ width: 12, height: 12 }} />
          Voyage
        </button>
      </div>
    </div>
  );
}

export default PoiCard;
