import type { CSSProperties } from "react";

const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function expandHexColor(color: string) {
  if (color.length === 7) {
    return color.toLowerCase();
  }

  const [r, g, b] = color.slice(1).split("");
  return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
}

function hexToRgb(color: string) {
  const normalized = expandHexColor(color);
  const value = normalized.slice(1);

  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

export function normalizeTagColor(color?: string | null) {
  const value = color?.trim();

  if (!value || !HEX_COLOR_PATTERN.test(value)) {
    return null;
  }

  return expandHexColor(value);
}

export function getTagBadgeStyle(color?: string | null): CSSProperties | undefined {
  const normalized = normalizeTagColor(color);

  if (!normalized) {
    return undefined;
  }

  const { r, g, b } = hexToRgb(normalized);

  return {
    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.1)`,
    borderColor: `rgba(${r}, ${g}, ${b}, 0.24)`,
  };
}

export function getTagDotStyle(color?: string | null): CSSProperties | undefined {
  const normalized = normalizeTagColor(color);

  if (!normalized) {
    return undefined;
  }

  return {
    backgroundColor: normalized,
  };
}
