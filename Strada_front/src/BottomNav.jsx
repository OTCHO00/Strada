const navItems = [
  {
    mode: 'search',
    label: 'Recherche',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor">
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
  {
    mode: 'favorites',
    label: 'Favoris',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
      </svg>
    ),
  },
  {
    mode: 'trips',
    label: 'Voyages',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor">
        <path d="M3 6h18M3 12h18M3 18h12" />
      </svg>
    ),
  },
  {
    mode: 'organize',
    label: 'Organisation',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
];

function BottomNav({ activeTab, onNavigate }) {
  return (
    <div
      className="fixed bottom-5 left-1/2 z-50 nav-pop"
      style={{ transform: 'translateX(-50%)' }}
    >
      <div
        className="flex items-center gap-0.5 px-1.5 py-1.5 rounded-2xl border border-[#262630]"
        style={{
          background: 'rgba(16, 16, 20, 0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04) inset',
        }}
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.mode;
          return (
            <button
              key={item.mode}
              onClick={() => onNavigate(item.mode)}
              className={`
                relative flex flex-col items-center gap-1 px-3 sm:px-4 py-2 rounded-xl
                transition-all duration-200 min-w-[56px] sm:min-w-[72px]
                ${isActive
                  ? 'text-[#f0f0f4]'
                  : 'text-[#484854] hover:text-[#9090a0] hover:bg-white/[0.04]'
                }
              `}
            >
              {isActive && (
                <span
                  className="absolute inset-0 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.07)' }}
                />
              )}
              <span className="relative w-[18px] h-[18px] flex items-center justify-center [&>svg]:w-full [&>svg]:h-full">
                {item.icon}
              </span>
              <span className={`relative text-[10px] font-medium tracking-wide whitespace-nowrap transition-opacity ${
                isActive ? 'opacity-100' : 'opacity-50'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/50" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default BottomNav;
