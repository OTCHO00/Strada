import { useState } from 'react';
import { FaSearchLocation } from 'react-icons/fa';
import { BiTrip } from 'react-icons/bi';
import { Star, ListChecks } from 'lucide-react';

const menuItems = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor">
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
    label: 'Recherche',
    mode: 'search',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
      </svg>
    ),
    label: 'Favoris',
    mode: 'favorites',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor">
        <path d="M3 6h18M3 12h18M3 18h18" />
      </svg>
    ),
    label: 'Voyages',
    mode: 'trips',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
    label: 'Organisation',
    mode: 'organize',
  },
];

function Sidebar({ isOpen, setIsOpen, isCollapsed, setIsCollapsed, onOpenSearch, onOpenFavorites, onOpenTrips, onOpenOrganize, searchOpen }) {
  const [activeMode, setActiveMode] = useState(null);

  const handlers = {
    search: onOpenSearch,
    favorites: onOpenFavorites,
    trips: onOpenTrips,
    organize: onOpenOrganize,
  };

  const handleMenuClick = (mode) => {
    setActiveMode(mode);
    handlers[mode]?.();
  };

  const handleToggleCollapse = () => {
    if (isOpen) {
      setIsCollapsed(!isCollapsed);
    } else {
      setIsOpen(true);
      setIsCollapsed(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/10 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
        <div className="fixed left-0 top-0 h-full z-50 p-4 transition-all duration-300">
          <div
            className={`h-full bg-white border border-gray-200 rounded-2xl flex flex-col overflow-hidden shadow-sm transition-all duration-300 ease-in-out ${
              searchOpen
                ? 'w-0 opacity-0 p-0 border-0 pointer-events-none'
                : isOpen
                  ? 'w-56'
                  : 'w-16'
            }`}
          >
          {/* Header */}
          <div className="flex items-center gap-3 px-3 py-4 border-b border-gray-100 min-h-[60px]">
            <button
              onClick={handleToggleCollapse}
              className="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0 overflow-hidden"
            >
              <img
                src="/logo.png"
                alt="logo"
                className="w-7 h-7 object-contain"
              />
            </button>

            <span
              className={`text-[13px] font-medium text-gray-800 whitespace-nowrap transition-all duration-300 ${
                isOpen && !isCollapsed ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
              }`}
            >
              Strada
            </span>
          </div>

          {/* Nav items */}
          <nav className="flex flex-col gap-1 p-2 flex-1">
            {menuItems.map((item) => {
              const isActive = activeMode === item.mode;
              return (
                <button
                  key={item.mode}
                  onClick={() => handleMenuClick(item.mode)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl w-full text-left transition-colors duration-150 ${
                    isActive
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                    <span
                      className={`w-4 h-4 [&>svg]:w-full [&>svg]:h-full ${
                        isActive ? '[&>svg]:stroke-white' : '[&>svg]:stroke-current'
                      }`}
                    >
                      {item.icon}
                    </span>
                  </span>
                  <span
                    className={`text-[13px] font-normal whitespace-nowrap transition-all duration-300 ${
                      isOpen && !isCollapsed ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
                    } ${isActive ? 'font-medium' : ''}`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}

export default Sidebar;