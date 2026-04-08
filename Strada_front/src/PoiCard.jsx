import { X, MapPin, Plus, Star } from 'lucide-react';

function PoiCard({ poi, onClose, onAddToTrip, onAddToFavorites, searchOpen }) {
  if (!poi) return null;

  return (
    <div
      className={`fixed top-4 w-72 z-[48] bg-white border border-[#e5e5ea] rounded-2xl overflow-hidden fade-up transition-all duration-300 ${
        searchOpen ? 'left-[232px]' : 'right-4'
      }`}
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3">
        <div className="min-w-0 flex-1 pr-2">
          <h2 className="text-sm font-semibold text-[#1c1c1e] leading-tight">{poi.name}</h2>
          {poi.category && (
            <span className="inline-block mt-1.5 text-[11px] font-medium text-[#6c6c70] bg-[#f2f2f7] px-2 py-0.5 rounded-full">
              {poi.category}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#aeaeb2] hover:bg-[#f2f2f5] hover:text-[#1c1c1e] transition-colors flex-shrink-0"
        >
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>

      <div className="border-t border-[#f0f0f4] mx-4" />

      {/* Infos */}
      <div className="px-4 py-3 space-y-1.5">
        <div className="flex items-center gap-2 text-[#aeaeb2]">
          <MapPin style={{ width: 12, height: 12, flexShrink: 0 }} />
          <span className="text-[11px] tabular-nums text-[#6c6c70]">
            {poi.coordinates.lat.toFixed(5)}, {poi.coordinates.lng.toFixed(5)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[#aeaeb2]">
          <Star style={{ width: 12, height: 12, flexShrink: 0 }} />
          <span className="text-[11px] text-[#6c6c70]">4.5 / 5</span>
        </div>
      </div>

      <div className="border-t border-[#f0f0f4] mx-4" />

      {/* Actions */}
      <div className="flex gap-2 px-4 py-3">
        <button
          onClick={() => onAddToFavorites?.(poi)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-[#6c6c70] bg-[#f8f8fa] border border-[#e5e5ea] rounded-xl hover:bg-[#1c1c1e] hover:text-white hover:border-[#1c1c1e] transition-all"
        >
          <Star style={{ width: 12, height: 12 }} />
          Favori
        </button>
        <button
          onClick={() => onAddToTrip(poi)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-white bg-[#1c1c1e] border border-[#1c1c1e] rounded-xl hover:bg-[#3a3a3c] hover:border-[#3a3a3c] transition-all"
        >
          <Plus style={{ width: 12, height: 12 }} />
          Voyage
        </button>
      </div>
    </div>
  );
}

export default PoiCard;
