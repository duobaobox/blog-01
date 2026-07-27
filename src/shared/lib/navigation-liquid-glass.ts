export const NAVIGATION_CONDENSE_ON = 64;
export const NAVIGATION_CONDENSE_OFF = 24;

const GLASS_MAP_BORDER_RATIO = 0.5;
const GLASS_MAP_ALPHA_PERCENT = 5;
const GLASS_MAP_BLUR = 10;

export function resolveNavigationCondensedState(
  condensed: boolean,
  scrollY: number,
) {
  if (!condensed && scrollY > NAVIGATION_CONDENSE_ON) {
    return true;
  }

  if (condensed && scrollY < NAVIGATION_CONDENSE_OFF) {
    return false;
  }

  return condensed;
}

export function buildNavigationGlassMap(width: number, height: number) {
  const resolvedWidth = Math.max(1, Math.round(width));
  const resolvedHeight = Math.max(1, Math.round(height));
  const radius = Math.round(Math.min(resolvedWidth, resolvedHeight) / 2);
  const inset =
    Math.min(resolvedWidth, resolvedHeight) * (GLASS_MAP_BORDER_RATIO * 0.5);
  const innerWidth = Math.max(1, resolvedWidth - inset * 2);
  const innerHeight = Math.max(1, resolvedHeight - inset * 2);

  const svg =
    `<svg viewBox="0 0 ${resolvedWidth} ${resolvedHeight}" xmlns="http://www.w3.org/2000/svg">` +
    "<defs>" +
    '<linearGradient id="red" x1="100%" y1="0%" x2="0%" y2="0%">' +
    '<stop offset="0%" stop-color="#000"/>' +
    '<stop offset="100%" stop-color="red"/>' +
    "</linearGradient>" +
    '<linearGradient id="blue" x1="0%" y1="0%" x2="0%" y2="100%">' +
    '<stop offset="0%" stop-color="#000"/>' +
    '<stop offset="100%" stop-color="blue"/>' +
    "</linearGradient>" +
    "</defs>" +
    `<rect width="${resolvedWidth}" height="${resolvedHeight}" fill="black"/>` +
    `<rect width="${resolvedWidth}" height="${resolvedHeight}" rx="${radius}" fill="url(#red)"/>` +
    `<rect width="${resolvedWidth}" height="${resolvedHeight}" rx="${radius}" fill="url(#blue)" style="mix-blend-mode:difference"/>` +
    `<rect x="${inset}" y="${inset}" width="${innerWidth}" height="${innerHeight}" rx="${radius}" fill="hsl(0 0% 50% / ${GLASS_MAP_ALPHA_PERCENT}%)" style="filter:blur(${GLASS_MAP_BLUR}px)"/>` +
    "</svg>";

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
