const navItems = [
  {
    mode: 'search',
    label: 'Recherche',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="w-[18px] h-[18px]">
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
  {
    mode: 'favorites',
    label: 'Favoris',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="w-[18px] h-[18px]">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
      </svg>
    ),
  },
  {
    mode: 'trips',
    label: 'Voyages',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="w-[18px] h-[18px]">
        <path d="M3 6h18M3 12h18M3 18h12" />
      </svg>
    ),
  },
  {
    mode: 'organize',
    label: 'Organisation',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="w-[18px] h-[18px]">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
];

function Sidebar({ activeTab, onNavigate }) {
  return (
    <div className="fixed left-0 top-0 h-full w-[220px] z-40 bg-white border-r border-[#e5e5ea] flex flex-col max-sm:hidden">

      {/* ── Brand ── */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-[#f0f0f4] flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-[#1c1c1e] flex items-center justify-center flex-shrink-0 overflow-hidden">
          <img src="/logo.png" alt="Strada" className="w-5 h-5 object-contain invert" />
        </div>
        <span className="text-[15px] font-semibold text-[#1c1c1e] tracking-tight">Strada</span>
      </div>

      {/* ── Nav ── */}
      <nav className="flex flex-col gap-0.5 p-3 flex-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.mode;
          return (
            <button
              key={item.mode}
              onClick={() => onNavigate(item.mode)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left
                transition-all duration-150
                ${isActive
                  ? 'bg-[#1c1c1e] text-white shadow-sm'
                  : 'text-[#6c6c70] hover:bg-[#f2f2f5] hover:text-[#1c1c1e]'
                }
              `}
            >
              <span className="flex-shrink-0 flex items-center justify-center">
                {item.icon}
              </span>
              <span className="text-[13px] font-medium">{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/50 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="px-4 py-4 border-t border-[#f0f0f4] flex-shrink-0">
        <p className="text-[11px] text-[#aeaeb2] font-medium">Strada · v1.0</p>
      </div>
    </div>
  );
}

export default Sidebar;
