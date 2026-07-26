export const NAVIGATION_CONDENSE_ON = 64; // 向下滚动超过此值后收缩
export const NAVIGATION_CONDENSE_OFF = 24; // 回到此值以下后展开

const GLASS_MAP_BORDER_RATIO = 0.5; // 只在边缘形成较窄的折射带
const GLASS_MAP_ALPHA = 5; // 中心保持完全中性，避免上下背景在中间镜像
const GLASS_MAP_BLUR = 10; // 仅柔化边缘，过大会让上下位移扩散到中心

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
    `<rect x="0" y="0" width="${resolvedWidth}" height="${resolvedHeight}" fill="black"/>` +
    `<rect x="0" y="0" width="${resolvedWidth}" height="${resolvedHeight}" rx="${radius}" fill="url(#red)"/>` +
    `<rect x="0" y="0" width="${resolvedWidth}" height="${resolvedHeight}" rx="${radius}" fill="url(#blue)" style="mix-blend-mode:difference"/>` +
    `<rect x="${inset}" y="${inset}" width="${resolvedWidth - inset * 2}" height="${resolvedHeight - inset * 2}" rx="${radius}" fill="hsl(0 0% 50% / ${GLASS_MAP_ALPHA})" style="filter:blur(${GLASS_MAP_BLUR}px)"/>` +
    "</svg>";

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
