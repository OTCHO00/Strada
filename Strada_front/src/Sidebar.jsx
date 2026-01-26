import { useState } from 'react';
import { Search, X, MapPin, Calendar, Plus } from 'lucide-react';
import { FaSearchLocation } from "react-icons/fa";
import { RiRoadMapLine } from "react-icons/ri";
import { BiTrip } from "react-icons/bi";

// Composant SearchBar avec Mapbox Geocoding API
function SearchBar({ onPlaceSelect, mapboxToken }) {
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (value) => {
    setSearchValue(value);

    if (value.length > 2) {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${mapboxToken}&autocomplete=true&limit=5`
        );
        const data = await response.json();
        setSuggestions(data.features || []);
      } catch (error) {
        console.error('Erreur de recherche:', error);
      }
      setIsLoading(false);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectPlace = (place) => {
    const location = {
      lng: place.center[0],
      lat: place.center[1],
      name: place.text,
      address: place.place_name
    };
    onPlaceSelect(location);
    setSearchValue('');
    setSuggestions([]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && suggestions.length > 0) {
      handleSelectPlace(suggestions[0]);
    }
  };

  return (
    <div className="relative z-[60]">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Rechercher un lieu..."
          className="w-full pl-9 pr-10 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border-2 border-indigo-100 max-h-80 overflow-y-auto z-[100]">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              onClick={() => handleSelectPlace(suggestion)}
              className={`w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200 border-b border-slate-100 last:border-0 group ${index === 0 ? 'rounded-t-xl' : ''
                } ${index === suggestions.length - 1 ? 'rounded-b-xl' : ''}`}
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                    {suggestion.text}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                    {suggestion.place_name}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Composant TripCard pour les itinéraires
function TripCard({ title, description, poiCount, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border border-slate-200 hover:scale-[1.02]"
    >
      <div className="p-4">
        <h4 className="font-bold text-slate-900 mb-1">{title}</h4>
        {description && (
          <p className="text-sm text-slate-600 mb-2 line-clamp-2">{description}</p>
        )}
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="w-3 h-3" />
          <span>{poiCount} lieu{poiCount > 1 ? 'x' : ''}</span>
        </div>
      </div>
    </div>
  );
}

// Composant RoadCard
function RoadCard({ nom, nb_jours, poiCount, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.02]"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-bold text-slate-900">{name}</h4>
        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-semibold">
          {nb_jours} jours
        </span>
      </div>
      <div className="flex items-center gap-1 text-sm text-slate-600">
        <MapPin className="w-4 h-4" />
        <span>{poiCount || 0} lieu{(poiCount || 0) > 1 ? 'x' : ''}</span>
      </div>
    </div>
  );
}

// Composant Sidebar
function Sidebar({ isOpen, setIsOpen, activeMode, setActiveMode, onPlaceSelect, mapboxToken, itineraries, setItineraries }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCreateItinerary, setShowCreateItinerary] = useState(false);
  const [formData, setFormData] = useState({ name: '', nb_jours: '', description: '' });

  const menuItems = [
    { icon: FaSearchLocation, label: 'Recherche', mode: 'search' },
    { icon: RiRoadMapLine, label: 'Itinéraire', mode: 'itinerary' },
    { icon: BiTrip, label: 'Mes voyages', mode: 'trips' },
  ];

  const handleCreateItinerary = async () => {
  if (formData.name && formData.nb_jours) {
    try {
      const itineraireData = {
        nom: formData.name,
        nb_jours: parseInt(formData.nb_jours),
        description: formData.description
      };
      
      console.log('📤 Données itinéraire envoyées:', itineraireData); // ✅ Regarde ici
      
      const response = await fetch('http://localhost:8000/itineraire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itineraireData)
      });
      
      console.log('📥 Status:', response.status); // ✅ Regarde le status
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Erreur API:', errorData); // ✅ Erreur détaillée
        alert('Erreur: ' + JSON.stringify(errorData));
        return;
      }
      
      const newItinerary = await response.json();
      console.log('✅ Itinéraire créé:', newItinerary);
      setItineraries([...itineraries, newItinerary]);
      setFormData({ name: '', nb_jours: '', description: '' });
      setShowCreateItinerary(false);
      
    } catch (err) {
      console.error('💥 Erreur réseau:', err);
      alert('Erreur réseau: ' + err.message);
    }
  } else {
    alert('Remplis au moins le nom et le nombre de jours !');
  }
};

  const getSidebarWidth = () => {
    if (!isOpen) return 'w-16';
    if (activeMode === 'itinerary') return 'w-[50vw]';
    return 'w-80';
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className="fixed left-0 top-0 h-full z-50 p-4">
        <div className={`h-full bg-white rounded-2xl shadow-xl border border-slate-200 transition-all duration-300 ease-out overflow-visible ${getSidebarWidth()}`}>

          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center hover:scale-105 transition-transform duration-200"
            >
              <div className="w-3 h-3 rounded-full bg-white"></div>
            </button>
            {isOpen && activeMode && (
              <button
                onClick={() => {
                  setActiveMode(null);
                  setShowCreateForm(false);
                  setShowCreateItinerary(false);
                }}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
            )}
          </div>

          <div className="p-2 space-y-1">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsOpen(true);
                  setActiveMode(item.mode);
                  setShowCreateForm(false);
                  setShowCreateItinerary(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${activeMode === item.mode ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-100 text-slate-600'
                  }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
                  }`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          {isOpen && activeMode && (
            <div className="px-4 mt-4 overflow-y-auto" style={{ maxHeight: 'calc(100% - 180px)' }}>

              {activeMode === 'search' && (
                <div className="pb-80">
                  <SearchBar
                    onPlaceSelect={(location) => {
                      onPlaceSelect(location);
                      setIsOpen(false);
                      setActiveMode(null);
                    }}
                    mapboxToken={mapboxToken}
                  />
                </div>
              )}

              {activeMode === 'itinerary' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-900 text-lg">Itinéraires</h3>
                    <button
                      onClick={() => setShowCreateItinerary(!showCreateItinerary)}
                      className="flex items-center gap-2 px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Créer itinéraire
                    </button>
                  </div>

                  {showCreateItinerary && (
                    <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-200">
                      <h4 className="font-semibold text-slate-900 mb-3">Nouvel itinéraire</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ex: Week-end à Paris"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de jours</label>
                          <input
                            type="number"
                            value={formData.nb_jours}
                            onChange={(e) => setFormData({ ...formData, nb_jours: e.target.value })}
                            placeholder="Ex: 3"
                            min="1"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Description (optionnel)</label>
                          <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Ex: Visite des monuments"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleCreateItinerary}
                            className="flex-1 bg-indigo-500 text-white py-2 rounded-lg hover:bg-indigo-600 transition-colors text-sm font-medium"
                          >
                            Créer
                          </button>
                          <button
                            onClick={() => setShowCreateItinerary(false)}
                            className="px-4 bg-slate-200 text-slate-700 py-2 rounded-lg hover:bg-slate-300 transition-colors text-sm font-medium"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {itineraries.map(itinerary => (
                      <TripCard
                        key={itinerary.id}
                        title={itinerary.nom}
                        poiCount={itinerary.pois?.length || 0}
                        onClick={() => console.log('Itinéraire cliqué:', itinerary.name)}
                      />
                    ))}
                  </div>

                  {itineraries.length === 0 && !showCreateItinerary && (
                    <div className="text-center py-8 text-slate-500">
                      <p className="text-sm">Aucun itinéraire pour le moment</p>
                      <p className="text-xs mt-1">Créez votre premier itinéraire !</p>
                    </div>
                  )}
                </div>
              )}

              {activeMode === 'trips' && (
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 text-lg mb-4">Mes voyages</h3>

                  <div className="space-y-3">
                    {itineraries.map(trip => (
                      <RoadCard
                        key={trip.id}
                        name={trip.nom}
                        nb_jours={trip.nb_jours}
                        poiCount={trip.pois?.length || 0}
                        onClick={() => console.log('Voyage cliqué:', trip.name)}
                      />
                    ))}
                  </div>

                  {itineraries.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <p className="text-sm">Aucun voyage pour le moment</p>
                      <p className="text-xs mt-1">Créez un itinéraire pour commencer !</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Sidebar;