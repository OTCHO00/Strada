import { useState, useEffect } from 'react';
import { X, MapPin } from 'lucide-react';

function SelectItineraryModal({ poi, itineraries, onSelect, onClose }) {
  const [plans, setPlans] = useState({});
  const [loading, setLoading] = useState(true);

  // Charger les plans pour chaque itinéraire
  useEffect(() => {
    const loadPlans = async () => {
      setLoading(true);
      const newPlans = { ...plans }; // Conserver les plans déjà chargés
      
      // Ne charger que les plans pas encore chargés
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
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm max-w-sm w-full overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-4 pt-4 pb-3">
          <div>
            <p className="text-sm font-medium text-gray-900">Ajouter à un voyage</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{poi.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        <div className="border-t border-gray-100 mx-4" />

        {/* Liste */}
        <div className="p-3 overflow-y-auto max-h-72">
          {itineraries.length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className="text-sm font-medium text-gray-600">Aucun voyage créé</p>
              <p className="text-xs text-gray-400 mt-1">Créez-en un depuis l'onglet Voyages</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {itineraries.map(itinerary => (
                <button
                  key={itinerary.id}
                  onClick={() => onSelect(itinerary)}
                  className="w-full text-left flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-transparent hover:bg-gray-50 hover:border-gray-200 transition-all group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{itinerary.nom}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <MapPin style={{ width: 10, height: 10 }} className="text-gray-400 flex-shrink-0" />
                      {loading ? (
                        <span className="text-[11px] text-gray-300">Chargement...</span>
                      ) : (
                        <span className="text-[11px] text-gray-400">
                          {plans[itinerary.id]?.length || 0} lieu{(plans[itinerary.id]?.length || 0) > 1 ? 'x' : ''}
                        </span>
                      )}
                      {itinerary.description && (
                        <span className="text-[11px] text-gray-300">· {itinerary.description}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex-shrink-0 group-hover:bg-gray-900 group-hover:text-white transition-colors">
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