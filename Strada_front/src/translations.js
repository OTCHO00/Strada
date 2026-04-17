const TRANSLATIONS = {
  fr: {
    search: 'Recherche', favorites: 'Favoris', trips: 'Voyages',
    organize: 'Organisation', appearance: 'Apparence', settings: 'Paramètres',
    searchSub: 'Trouvez un lieu sur la carte',
    organizesSub: 'Planifiez vos lieux jour par jour',
    settingsSub: 'Personnalisez votre expérience',
  },
  en: {
    search: 'Search', favorites: 'Favorites', trips: 'Trips',
    organize: 'Schedule', appearance: 'Appearance', settings: 'Settings',
    searchSub: 'Find a place on the map',
    organizesSub: 'Plan your places day by day',
    settingsSub: 'Customize your experience',
  },
};
export const useT = (lang) => (key) => TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.fr[key] ?? key;
