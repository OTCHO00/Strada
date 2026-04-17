/**
 * Strada logo — SVG inline
 * Route icon : origin (hollow circle) → smooth bezier → destination (filled pin)
 *
 * Props :
 *   size     — pixel size (default 20)
 *   color    — stroke/fill color (default "currentColor")
 *   className
 */
function Logo({ size = 20, color = 'currentColor', className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* ── Origin dot (hollow) ── */}
      <circle cx="7" cy="5.5" r="2.25" stroke={color} strokeWidth="1.9" />

      {/* ── Route path — smooth S-curve ── */}
      <path
        d="M7 7.75 C7 12.5 17 11.5 17 16.25"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
      />

      {/* ── Destination pin ── */}
      {/* pin body */}
      <path
        d="M17 13.75 C14.5 13.75 12.5 15.7 12.5 18.2 C12.5 21.2 17 25 17 25 C17 25 21.5 21.2 21.5 18.2 C21.5 15.7 19.5 13.75 17 13.75 Z"
        fill={color}
      />
      {/* pin inner dot */}
      <circle cx="17" cy="18.1" r="1.5" fill="white" />
    </svg>
  );
}

export default Logo;
