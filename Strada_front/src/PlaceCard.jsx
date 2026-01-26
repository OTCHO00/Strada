import { MapPin } from 'lucide-react';

// Composant PlaceCard réutilisable
function PlaceCard({ 
  image, 
  title, 
  description, 
  address,
  onClick 
}) {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-slate-200 hover:scale-[1.02]"
    >
      {/* Image */}
      {image && (
        <div className="relative h-48 overflow-hidden">
          <img 
            src={image} 
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Contenu */}
      <div className="p-4">
        {/* Titre */}
        <h3 className="text-lg font-bold text-slate-900 mb-2">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-sm text-slate-600 line-clamp-2 mb-3">
            {description}
          </p>
        )}

        {/* Adresse */}
        {address && (
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-slate-600 line-clamp-1">{address}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Exemple d'utilisation
export default function App() {
  const places = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400",
      title: "Café des Arts",
      description: "Un café cosy avec une ambiance chaleureuse et des pâtisseries maison",
      address: "12 Rue de la République, Paris"
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400",
      title: "Restaurant Le Gourmet",
      description: "Cuisine française traditionnelle avec des produits locaux",
      address: "45 Avenue des Champs, Paris"
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400",
      title: "Parc Central",
      description: "Grand parc urbain avec aires de jeux et sentiers de promenade",
      address: "Boulevard du Parc, Paris"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">
          Lieux à proximité
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {places.map(place => (
            <PlaceCard
              key={place.id}
              image={place.image}
              title={place.title}
              description={place.description}
              address={place.address}
              onClick={() => console.log('Cliqué sur:', place.title)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}