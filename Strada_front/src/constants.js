export const getDayColor = (day) => {
  const hue = ((day - 1) * 137.5) % 360;
  return `hsl(${Math.round(hue)}, 55%, 48%)`;
};
