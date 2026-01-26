import { useState, useRef, useEffect } from 'react'; // ✅ Ajoute useEffect
import Map from './Map.jsx';
import Sidebar from './Sidebar.jsx';
import PoiCard from './PoiCard.jsx';
import SelectItineraryModal from './SelectItineraryModal.jsx';
import './App.css';

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMode, setActiveMode] = useState(null);
  const [selectedPoi, setSelectedPoi] = useState(null);
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const [itineraries, setItineraries] = useState([]);
  const mapRef = useRef();
  
  const mapboxToken = "pk.eyJ1Ijoib3RjaG8iLCJhIjoiY21rbHgyczY3MGJmaTNkc2JscXE5NG1wMyJ9.z77Uh_KJ_BJ3WsKKmkrgMQ";

  useEffect(() => {
    fetch('http://localhost:8000/itineraire')
      .then(res => res.json())
      .then(data => {
        console.log('Itinéraires chargés:', data);
        setItineraries(data);
      })
      .catch(err => console.error('Erreur chargement:', err));
  }, []); 

  const handlePlaceSelect = (location) => {
    console.log('Zoom vers:', location);
    mapRef.current?.flyTo({
      center: [location.lng, location.lat],
      zoom: 15,
      duration: 2000
    });
  };

  const handlePoiClick = (poiData) => {
    console.log('POI cliqué:', poiData);
    setSelectedPoi(poiData);
  };

  const handleAddToTrip = () => {
    setShowItineraryModal(true);
  };

  const handleSelectItinerary = async (itinerary) => {
    try {
      const response = await fetch(`http://localhost:8000/itineraire/${itinerary.id}/poi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: selectedPoi.name,
          category: selectedPoi.category,
          latitude: selectedPoi.coordinates.lat,
          longitude: selectedPoi.coordinates.lng,
          properties: selectedPoi.properties || {}
        })
      });
      
      if (response.ok) {
        const newPoi = await response.json();
        console.log('POI ajouté:', newPoi);
        
        const updatedItineraries = itineraries.map(it => {
          if (it.id === itinerary.id) {
            return {
              ...it,
              pois: [...(it.pois || []), newPoi]
            };
          }
          return it;
        });
        
        setItineraries(updatedItineraries);
        setShowItineraryModal(false);
        setSelectedPoi(null);
        
        alert(`✅ "${selectedPoi.nom}" ajouté à "${itinerary.nom}"`);
      }
    } catch (err) {
      console.error('Erreur ajout POI:', err);
      alert('Erreur lors de l\'ajout du POI');
    }
  };

  return (
    <>
      <Sidebar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        activeMode={activeMode}
        setActiveMode={setActiveMode}
        onPlaceSelect={handlePlaceSelect}
        mapboxToken={mapboxToken}
        itineraries={itineraries}
        setItineraries={setItineraries}
      />
      
      <Map 
        ref={mapRef} 
        onPoiClick={handlePoiClick}
      />

      {selectedPoi && !showItineraryModal && (
        <PoiCard
          poi={selectedPoi}
          onClose={() => setSelectedPoi(null)}
          onAddToTrip={handleAddToTrip}
        />
      )}

      {showItineraryModal && (
        <SelectItineraryModal
          poi={selectedPoi}
          itineraries={itineraries}
          onSelect={handleSelectItinerary}
          onClose={() => setShowItineraryModal(false)}
        />
      )}
    </>
  );
}

export default App;