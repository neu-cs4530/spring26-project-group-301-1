import type { CSSProperties } from "react";

export function isHexColor(value: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
}

export function getCustomBackgroundStyle(customBackgroundRaw?: string): CSSProperties {
  const customBackground = (customBackgroundRaw || "").trim();
  if (!customBackground) {
    return {};
  }

  if (isHexColor(customBackground)) {
    return { backgroundColor: customBackground };
  }

  return {
    backgroundImage: `url("${customBackground}")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  };
}

export function isLightHexColor(valueRaw?: string): boolean {
  const value = (valueRaw || "").trim();
  const fullHexMatch = /^#([0-9a-fA-F]{6})$/.exec(value);
  if (fullHexMatch) {
    const hex = fullHexMatch[1];
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance >= 0.68;
  }

  const shortHexMatch = /^#([0-9a-fA-F]{3})$/.exec(value);
  if (shortHexMatch) {
    const shortHex = shortHexMatch[1];
    const expanded = `#${shortHex[0]}${shortHex[0]}${shortHex[1]}${shortHex[1]}${shortHex[2]}${shortHex[2]}`;
    return isLightHexColor(expanded);
  }

  return false;
}
