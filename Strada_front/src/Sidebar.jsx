import { useT } from './translations.js';
import { hexToRgba, isDarkColor, GRAIN_SVG } from './theme.js';

// ── Nav items (icon + mode, label resolved via tr()) ──────────────────
const navItems = [
  {
    mode: 'search',
    icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="w-[18px] h-[18px] flex-shrink-0"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>,
  },
  {
    mode: 'favorites',
    icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="w-[18px] h-[18px] flex-shrink-0"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>,
  },
  {
    mode: 'trips',
    icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="w-[18px] h-[18px] flex-shrink-0"><path d="M3 6h18M3 12h18M3 18h12"/></svg>,
  },
  {
    mode: 'organize',
    icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="w-[18px] h-[18px] flex-shrink-0"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  },
];

// ── Component ─────────────────────────────────────────────────────────
function Sidebar({ activeTab, onNavigate, settings = {}, plannerOpen = false }) {
  const { sidebarColor: color = '#dfe2ef', sidebarGrain: grain = 0.06, language = 'fr' } = settings;
  const tr = useT(language);

  const dark  = isDarkColor(color);
  const textPrimary   = dark ? 'rgba(255,255,255,0.90)' : '#1c1c1e';
  const textSecondary = dark ? 'rgba(255,255,255,0.45)' : '#6c6c70';
  const dividerColor  = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const activeStyle   = dark
    ? { background: 'rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.95)', boxShadow: 'none' }
    : { background: '#1c1c1e', color: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' };
  const hoverBg = dark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.65)';

  return (
    <div
      className="fixed left-3 top-3 w-[220px] z-[46] flex flex-col max-sm:hidden rounded-2xl overflow-hidden"
      style={{
        background: hexToRgba(color, 0.82),
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: 'none',
        boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.30)' : '0 8px 32px rgba(0,0,0,0.10)',
        transform: plannerOpen ? 'translateX(calc(-100% - 16px))' : 'translateX(0)',
        opacity: plannerOpen ? 0 : 1,
        transition: 'transform 360ms cubic-bezier(0.32, 0.72, 0, 1), opacity 280ms ease-out',
        pointerEvents: plannerOpen ? 'none' : 'auto',
      }}
    >
      {/* Grain overlay */}
      {grain > 0 && (
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{
            backgroundImage: GRAIN_SVG,
            backgroundRepeat: 'repeat',
            backgroundSize: '256px 256px',
            opacity: grain,
            mixBlendMode: dark ? 'screen' : 'multiply',
            zIndex: 0,
          }}
        />
      )}

      {/* Content sits above grain */}
      <div className="relative z-10 flex flex-col">

        {/* ── Brand ── */}
        <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: `1px solid ${dividerColor}` }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: dark ? 'rgba(255,255,255,0.15)' : '#1c1c1e' }}>
            <div className="w-3 h-3 rounded-full" style={{ background: dark ? 'rgba(255,255,255,0.90)' : 'white' }} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight" style={{ color: textPrimary }}>Strada</span>
        </div>

        {/* ── Nav ── */}
        <nav className="flex flex-col gap-1 p-3">
          {navItems.map((item, idx) => {
            const isActive = activeTab === item.mode;
            const label = tr(item.mode === 'organize' ? 'organize' : item.mode);
            return (
              <button
                key={item.mode}
                onClick={() => onNavigate(item.mode)}
                className="nav-item btn-press flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left cursor-default select-none focus:outline-none"
                style={{
                  ...(isActive ? activeStyle : { color: textSecondary }),
                  transition: 'background 150ms ease-out, color 150ms ease-out, transform 160ms cubic-bezier(0.16,1,0.3,1), opacity 160ms ease-out',
                  animationDelay: `${idx * 40}ms`,
                }}
                onMouseEnter={e => { if (!isActive && window.matchMedia('(hover: hover) and (pointer: fine)').matches) { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = textPrimary; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = ''; e.currentTarget.style.color = textSecondary; } }}
              >
                {item.icon}
                <span className="text-[13px] font-medium">{label}</span>
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dark ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.5)' }} />}
              </button>
            );
          })}
        </nav>

        {/* ── Settings (Apparence) button ── */}
        <div className="p-3 pt-0">
          {(() => {
            const isActive = activeTab === 'settings';
            return (
              <button
                onClick={() => onNavigate('settings')}
                className="btn-press flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left cursor-default select-none focus:outline-none"
                style={{
                  ...(isActive ? activeStyle : { color: textSecondary }),
                  transition: 'background 150ms ease-out, color 150ms ease-out, transform 160ms cubic-bezier(0.16,1,0.3,1), opacity 160ms ease-out',
                }}
                onMouseEnter={e => { if (!isActive && window.matchMedia('(hover: hover) and (pointer: fine)').matches) { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = textPrimary; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = ''; e.currentTarget.style.color = textSecondary; } }}
              >
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="w-[18px] h-[18px] flex-shrink-0">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                <span className="text-[13px] font-medium">{tr('appearance')}</span>
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dark ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.5)' }} />}
              </button>
            );
          })()}
        </div>

      </div>
    </div>
  );
}

export default Sidebar;
