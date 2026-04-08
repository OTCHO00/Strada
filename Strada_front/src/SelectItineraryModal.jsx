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
          if (res.ok) {
            const data = await res.json();
            newPlans[itin.id] = Array.isArray(data) ? data : [];
          } else {
            newPlans[itin.id] = [];
          }
        } catch (error) {
          console.error(`Erreur chargement plan pour itinéraire ${itin.id}:`, error);
          newPlans[itin.id] = [];
        }
      }
      setPlans(newPlans);
      setLoading(false);
    };

    if (itineraries.length > 0) {
      loadPlans();
    } else {
      setLoading(false);
    }
  }, [itineraries]);

  if (!poi) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 fade-in">
      <div
        className="max-w-sm w-full overflow-hidden rounded-2xl border border-[#262630] scale-in"
        style={{
          background: 'rgba(18, 18, 22, 0.96)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-4 pt-4 pb-3">
          <div>
            <p className="text-sm font-medium text-[#f0f0f4]">Ajouter à un voyage</p>
            <p className="text-xs text-[#484854] mt-0.5 truncate">{poi.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#484854] hover:bg-[#1c1c20] hover:text-[#f0f0f4] transition-colors flex-shrink-0"
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        <div className="border-t border-[#1a1a1e] mx-4" />

        {/* List */}
        <div className="p-3 overflow-y-auto max-h-72">
          {itineraries.length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className="text-sm font-medium text-[#78787f]">Aucun voyage créé</p>
              <p className="text-xs text-[#484854] mt-1">Créez-en un depuis l'onglet Voyages</p>
            </div>
          ) : (
            <div className="space-y-1">
              {itineraries.map(itinerary => (
                <button
                  key={itinerary.id}
                  onClick={() => onSelect(itinerary)}
                  className="group w-full text-left flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-transparent hover:bg-[#1c1c20] hover:border-[#262630] transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#f0f0f4] truncate">{itinerary.nom}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <MapPin style={{ width: 10, height: 10 }} className="text-[#484854] flex-shrink-0" />
                      {loading ? (
                        <span className="text-[11px] text-[#3c3c44]">Chargement...</span>
                      ) : (
                        <span className="text-[11px] text-[#484854]">
                          {plans[itinerary.id]?.length || 0} lieu{(plans[itinerary.id]?.length || 0) > 1 ? 'x' : ''}
                        </span>
                      )}
                      {itinerary.description && (
                        <span className="text-[11px] text-[#3c3c44]">· {itinerary.description}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-medium bg-[#242428] text-[#78787f] px-2 py-0.5 rounded-full flex-shrink-0 border border-[#262630] group-hover:bg-white group-hover:text-[#0d0d0f] group-hover:border-white transition-all">
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
