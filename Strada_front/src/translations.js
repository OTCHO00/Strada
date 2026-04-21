const T = {
  fr: {
    // Navigation
    search: 'Recherche', favorites: 'Favoris', trips: 'Voyages',
    organize: 'Organisation', appearance: 'Apparence', settings: 'Paramètres',
    // Search panel
    searchSub: 'Trouvez un lieu sur la carte',
    searchPlaceholder: 'Ville, monument, adresse…',
    searchEmptyTitle: 'Recherchez un lieu', searchEmptySub: 'Tapez pour commencer',
    searchNoResult: 'Aucun résultat pour',
    // Favorites
    favoritesNone: 'Aucun favori', favoritesEmptySub: 'Cliquez sur un lieu puis "Favori"',
    seeOnMap: 'Voir sur la carte', favorited: 'Sauvegardé', addFavorite: 'Favori',
    favori: 'favori enregistré', favoris: 'favoris enregistrés',
    // Trips
    tripsNone: 'Aucun voyage', tripsEmptySub: 'Créez votre premier itinéraire',
    newTrip: 'Nouveau voyage', new: 'Nouveau',
    tripName: 'Nom du voyage', tripDays: 'Nombre de jours', tripDesc: 'Description (optionnel)',
    chooseColor: 'Choisir une couleur', tripColor: 'Couleur du voyage',
    create: 'Créer', cancel: 'Annuler', editTrip: 'Modifier le voyage', save: 'Enregistrer',
    unnamedTrip: 'Voyage sans nom', noPlaces: 'Aucun lieu ajouté',
    place: 'lieu', places: 'lieux', voyage: 'voyage', voyages: 'voyages',
    // Organize
    organizeSub: 'Planifiez vos lieux jour par jour',
    organizeEmptySub: "Créez des voyages depuis l'onglet Voyages",
    category: 'Catégorie', categoryName: 'Nom de la catégorie…',
    noCategory: 'Sans catégorie', go: 'GO !', dropHere: 'Glissez un voyage ici',
    // Settings
    settingsSub: 'Personnalisez votre expérience', general: 'Général',
    defaultCity: 'Ville de départ', searchCity: 'Chercher une ville…',
    language: 'Langue', units: 'Unités', transport: 'Transport',
    grain: 'Grain', grainNone: 'Aucun', grainSubtle: 'Subtil', grainMedium: 'Moyen', grainStrong: 'Fort',
    resetAppearance: "Réinitialiser l'apparence", map: 'Carte', startZoom: 'Zoom de départ',
    // Route / PanelsContainer
    day: 'Jour', days: 'Jours', dayShort: 'J', trip: 'Voyage',
    selectDays: 'Sélectionnez des jours', noPlanned: 'Aucun lieu planifié',
    noPOI: 'Aucun lieu prévu', nextDay: 'Jour suivant',
    // PoiCard
    free: 'Gratuit', nearby: 'À proximité', cancelNearby: 'Annuler',
  },
  en: {
    // Navigation
    search: 'Search', favorites: 'Favorites', trips: 'Trips',
    organize: 'Schedule', appearance: 'Appearance', settings: 'Settings',
    // Search panel
    searchSub: 'Find a place on the map',
    searchPlaceholder: 'City, landmark, address…',
    searchEmptyTitle: 'Search for a place', searchEmptySub: 'Start typing',
    searchNoResult: 'No results for',
    // Favorites
    favoritesNone: 'No favorites', favoritesEmptySub: 'Click on a place then tap "Favorite"',
    seeOnMap: 'See on map', favorited: 'Saved', addFavorite: 'Favorite',
    favori: 'saved favorite', favoris: 'saved favorites',
    // Trips
    tripsNone: 'No trips', tripsEmptySub: 'Create your first itinerary',
    newTrip: 'New trip', new: 'New',
    tripName: 'Trip name', tripDays: 'Number of days', tripDesc: 'Description (optional)',
    chooseColor: 'Choose a color', tripColor: 'Trip color',
    create: 'Create', cancel: 'Cancel', editTrip: 'Edit trip', save: 'Save',
    unnamedTrip: 'Unnamed trip', noPlaces: 'No places added',
    place: 'place', places: 'places', voyage: 'trip', voyages: 'trips',
    // Organize
    organizeSub: 'Plan your places day by day',
    organizeEmptySub: 'Create trips from the Trips tab',
    category: 'Category', categoryName: 'Category name…',
    noCategory: 'No category', go: 'GO!', dropHere: 'Drop a trip here',
    // Settings
    settingsSub: 'Customize your experience', general: 'General',
    defaultCity: 'Departure city', searchCity: 'Search for a city…',
    language: 'Language', units: 'Units', transport: 'Transport',
    grain: 'Grain', grainNone: 'None', grainSubtle: 'Subtle', grainMedium: 'Medium', grainStrong: 'Strong',
    resetAppearance: 'Reset appearance', map: 'Map', startZoom: 'Start zoom',
    // Route / PanelsContainer
    day: 'Day', days: 'Days', dayShort: 'D', trip: 'Trip',
    selectDays: 'Select days', noPlanned: 'No places planned',
    noPOI: 'No places scheduled', nextDay: 'Next day',
    // PoiCard
    free: 'Free', nearby: 'Nearby', cancelNearby: 'Cancel',
  },
};

export const useT = (lang = 'fr') => (key) => T[lang]?.[key] ?? T.fr[key] ?? key;
