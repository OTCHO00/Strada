import { useState, useEffect } from 'react';
import { X, MapPin } from 'lucide-react';

function SelectItineraryModal({ poi, itineraries, onSelect, onClose }) {
  const [plans, setPlans] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlans = async () => {
      setLoading(true);
      const newPlans = { ...plans };
      const itinsToLoad = itineraries.filter(itin => !newPlans.hasOwnProperty(itin.id));
      for (const itin of itinsToLoad) {
        try {
          const res = await fetch(`http://localhost:8000/itineraire/${itin.id}/plan`);
          newPlans[itin.id] = res.ok ? (await res.json()) : [];
        } catch { newPlans[itin.id] = []; }
      }
      setPlans(newPlans);
      setLoading(false);
    };
    if (itineraries.length > 0) loadPlans(); else setLoading(false);
  }, [itineraries]);

  if (!poi) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 fade-in">
      <div
        className="bg-white border border-[#e5e5ea] rounded-2xl max-w-sm w-full overflow-hidden scale-in"
        style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.14)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4">
          <div>
            <p className="text-sm font-semibold text-[#1c1c1e]">Ajouter à un voyage</p>
            <p className="text-xs text-[#aeaeb2] mt-0.5 truncate">{poi.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#aeaeb2] hover:bg-[#f2f2f5] hover:text-[#1c1c1e] transition-colors flex-shrink-0"
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        <div className="border-t border-[#f0f0f4] mx-5" />

        {/* List */}
        <div className="p-3 overflow-y-auto max-h-72">
          {itineraries.length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className="text-sm font-medium text-[#6c6c70]">Aucun voyage créé</p>
              <p className="text-xs text-[#aeaeb2] mt-1">Créez-en un depuis l'onglet Voyages</p>
            </div>
          ) : (
            <div className="space-y-1">
              {itineraries.map(itinerary => (
                <button
                  key={itinerary.id}
                  onClick={() => onSelect(itinerary)}
                  className="group w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#f8f8fa] transition-colors"
                >
                  <div
                    className="w-2 h-8 rounded-full flex-shrink-0"
                    style={{ backgroundColor: `hsl(${(itinerary.id * 67) % 360}, 55%, 58%)` }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#1c1c1e] truncate">{itinerary.nom}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <MapPin style={{ width: 10, height: 10 }} className="text-[#aeaeb2] flex-shrink-0" />
                      {loading ? (
                        <span className="text-[11px] text-[#d1d1d6]">Chargement…</span>
                      ) : (
                        <span className="text-[11px] text-[#aeaeb2]">
                          {plans[itinerary.id]?.length || 0} lieu{(plans[itinerary.id]?.length || 0) > 1 ? 'x' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-[#6c6c70] bg-[#f2f2f7] px-2 py-1 rounded-lg flex-shrink-0 group-hover:bg-[#1c1c1e] group-hover:text-white transition-all">
                    {itinerary.nb_jours}j
                  </span>
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
