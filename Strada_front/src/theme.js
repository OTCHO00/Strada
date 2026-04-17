export const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

export const isDarkColor = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 160;
};

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
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  const lum = (r * 299 + g * 587 + b * 114) / 1000; // 0–255
  const dark = lum < 160;

  if (dark) {
    return {
      dark: true,
      textPrimary:   'rgba(255,255,255,0.90)',
      textSecondary: 'rgba(255,255,255,0.55)',
      textTertiary:  'rgba(255,255,255,0.40)',
      divider:       'rgba(255,255,255,0.08)',
      inputBg:       'rgba(0,0,0,0.22)',
      inputBorder:   'rgba(255,255,255,0.08)',
      itemBg:        'rgba(255,255,255,0.07)',
      closeBtnBg:    'rgba(255,255,255,0.10)',
      closeBtnColor: 'rgba(255,255,255,0.45)',
      inputText:     'rgba(255,255,255,0.90)',
      inputPlaceholder: 'rgba(255,255,255,0.35)',
    };
  }

  // Fond clair : plus le fond est clair (lum élevée), plus on assombrit le texte subtil
  // pour garantir le contraste. lum 160 → threshold, 255 → blanc pur.
  const t = (lum - 160) / (255 - 160); // 0 à 1
  const secondaryAlpha = 0.42 + t * 0.16; // 0.42 → 0.58
  const tertiaryAlpha  = 0.28 + t * 0.22; // 0.28 → 0.50

  return {
    dark: false,
    textPrimary:   'rgba(0,0,0,0.85)',
    textSecondary: `rgba(0,0,0,${secondaryAlpha.toFixed(2)})`,
    textTertiary:  `rgba(0,0,0,${tertiaryAlpha.toFixed(2)})`,
    divider:       'rgba(0,0,0,0.06)',
    inputBg:       'rgba(255,255,255,0.45)',
    inputBorder:   'rgba(0,0,0,0.07)',
    itemBg:        'rgba(255,255,255,0.55)',
    closeBtnBg:    'rgba(0,0,0,0.05)',
    closeBtnColor: `rgba(0,0,0,${tertiaryAlpha.toFixed(2)})`,
    inputText:     'rgba(0,0,0,0.82)',
    inputPlaceholder: `rgba(0,0,0,${tertiaryAlpha.toFixed(2)})`,
  };
};
