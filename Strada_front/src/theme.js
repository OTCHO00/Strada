export const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

// ── WCAG 2.1 relative luminance (0 = black, 1 = white) ───────────────
// Applies proper sRGB gamma correction — far more accurate than the old
// (r*299+g*587+b*114)/1000 formula, which badly misclassifies saturated
// colors like orange, cyan, lime, magenta, etc.
const relLum = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lin = (c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

// WCAG optimal crossover: the luminance where white and black give equal contrast ratio.
// Below 0.179 → white text gives better contrast; above → black text is better.
// This is the mathematically optimal threshold — no guesswork needed.
const DARK_THRESHOLD = 0.179;

export const isDarkColor = (hex) => relLum(hex) < DARK_THRESHOLD;

export const GRAIN_SVG = `url("data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="256" height="256" filter="url(#n)"/></svg>')}")`;

export const makeGlassStyle = (color = '#dfe2ef', opacity = 0.68) => {
  const dark = isDarkColor(color);
  return {
    background: hexToRgba(color, opacity),
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    border: 'none',
    boxShadow: dark
      ? '-4px 0 48px rgba(0,0,0,0.28), 0 8px 32px rgba(0,0,0,0.18)'
      : '-4px 0 48px rgba(0,0,0,0.10), 0 8px 32px rgba(0,0,0,0.07)',
  };
};

export const getTheme = (color = '#dfe2ef') => {
  const lum = relLum(color);
  const dark = lum < DARK_THRESHOLD;

  if (dark) {
    // Dark background → white text.
    // Scale opacity with darkness: the darker the bg, the more opacity we can afford.
    // Very dark (lum~0): high opacity fine. Near-threshold (lum~0.20): bump up to ensure contrast.
    const t = lum / DARK_THRESHOLD; // 0 (pitch black) → 1 (at threshold)
    const secAlpha  = 0.75 - t * 0.15; // 0.75 → 0.60 (always ≥0.60)
    const tertAlpha = 0.55 - t * 0.10; // 0.55 → 0.45 (always ≥0.45)
    return {
      dark: true,
      textPrimary:      'rgba(255,255,255,0.92)',
      textSecondary:    `rgba(255,255,255,${secAlpha.toFixed(2)})`,
      textTertiary:     `rgba(255,255,255,${tertAlpha.toFixed(2)})`,
      divider:          'rgba(255,255,255,0.09)',
      inputBg:          'rgba(0,0,0,0.22)',
      inputBorder:      'rgba(255,255,255,0.09)',
      itemBg:           'rgba(255,255,255,0.07)',
      closeBtnBg:       'rgba(255,255,255,0.10)',
      closeBtnColor:    'rgba(255,255,255,0.50)',
      inputText:        'rgba(255,255,255,0.92)',
      inputPlaceholder: 'rgba(255,255,255,0.38)',
      activeNavBg:      'rgba(255,255,255,0.18)',
      activeNavColor:   'rgba(255,255,255,0.95)',
      hoverBg:          'rgba(255,255,255,0.10)',
    };
  }

  // Light background → dark text.
  // Use high fixed opacities to guarantee contrast regardless of the specific hue.
  return {
    dark: false,
    textPrimary:      'rgba(0,0,0,0.88)',
    textSecondary:    'rgba(0,0,0,0.56)',
    textTertiary:     'rgba(0,0,0,0.42)',
    divider:          'rgba(0,0,0,0.07)',
    inputBg:          'rgba(255,255,255,0.50)',
    inputBorder:      'rgba(0,0,0,0.08)',
    itemBg:           'rgba(255,255,255,0.55)',
    closeBtnBg:       'rgba(0,0,0,0.05)',
    closeBtnColor:    'rgba(0,0,0,0.42)',
    inputText:        'rgba(0,0,0,0.84)',
    inputPlaceholder: 'rgba(0,0,0,0.36)',
    activeNavBg:      '#1c1c1e',
    activeNavColor:   '#ffffff',
    hoverBg:          'rgba(255,255,255,0.65)',
  };
};
