import { ColorPalette, LiveAcousticFeatures } from '../types';

/**
 * Converts Hex string to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return { r, g, b };
}

/**
 * Converts RGB values to Hex string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  const componentToHex = (c: number) => {
    const hex = clamp(c).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
}

/**
 * Interpolates between two hex colors
 */
export function interpolateColor(hex1: string, hex2: string, factor: number): string {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  const r = c1.r + (c2.r - c1.r) * factor;
  const g = c1.g + (c2.g - c1.g) * factor;
  const b = c1.b + (c2.b - c1.b) * factor;
  return rgbToHex(r, g, b);
}

/**
 * HSL to Hex helper
 */
export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return rgbToHex(
    Math.round(255 * f(0)),
    Math.round(255 * f(8)),
    Math.round(255 * f(4))
  );
}

/**
 * Procedural color mapping based on live or average acoustic features.
 * 
 * Rules requested:
 * - Strong Bass -> Warm Reds / deep oranges
 * - Bright Treble -> Cyan / teal / neon blue
 * - High Energy -> Orange / gold / electric yellow
 * - Soft Music -> Deep blues / indigo
 * - Calm -> Purple / violet / lavender
 */
export function generatePaletteFromFeatures(features: LiveAcousticFeatures, isLightMode = false): ColorPalette {
  const { bassEnergy, midEnergy, trebleEnergy, peakEnergy, rmsLoudness, zeroCrossingRate } = features;

  // Let's analyze the dominant audio characteristics
  // We normalize feature priorities
  const totalEnergy = bassEnergy + midEnergy + trebleEnergy || 1;
  const bassRatio = bassEnergy / totalEnergy;
  const midRatio = midEnergy / totalEnergy;
  const trebleRatio = trebleEnergy / totalEnergy;

  // 1. Determine dominant Hue (0 - 360) based on audio metrics
  let primaryHue = 220; // Default: clean blue
  let primarySat = 85;
  let primaryLight = isLightMode ? 50 : 60;

  if (bassRatio > 0.45) {
    // Bass Dominant: Warm Reds to deep Oranges (0 - 25)
    primaryHue = 5 + (midEnergy * 20); // 5 to 25
    primarySat = 90 + (peakEnergy * 10); // Very vibrant
  } else if (trebleRatio > 0.40 || zeroCrossingRate > 0.5) {
    // Treble Dominant: Cyan to Neon Blue (170 - 210)
    primaryHue = 175 + (trebleEnergy * 35); // 175 to 210
    primarySat = 85;
  } else if (rmsLoudness > 0.6 && totalEnergy > 1.8) {
    // High Energy overall: Golden Orange to Electric Yellow (35 - 50)
    primaryHue = 35 + (trebleRatio * 15); // 35 to 50
    primarySat = 95;
  } else if (rmsLoudness < 0.25 && totalEnergy < 0.8) {
    // Soft/Calm Music: Royal Blues & Indigo (220 - 245)
    primaryHue = 225 + (midRatio * 20); // 225 to 245
    primarySat = 75;
    primaryLight = isLightMode ? 45 : 55;
  } else {
    // Balanced/Mid Dominant: Purple to Magenta (260 - 310)
    primaryHue = 265 + (trebleRatio * 45); // 265 to 310
    primarySat = 80;
  }

  // Generate primary hex
  const primary = hslToHex(primaryHue, primarySat, primaryLight);

  // 2. Secondary Color: Analogous Hue (shifted by 30-40 degrees)
  const secondaryHue = (primaryHue + 35) % 360;
  const secondarySat = primarySat - 10;
  const secondaryLight = isLightMode ? primaryLight + 5 : primaryLight - 5;
  const secondary = hslToHex(secondaryHue, secondarySat, secondaryLight);

  // 3. Accent Color: Highly energetic contrast/complementary color
  // Contrast hue is approx opposite (+180 deg) or neon-accent shifted
  const accentHue = (primaryHue + 150) % 360;
  const accentSat = 95; // Always highly saturated
  const accentLight = isLightMode ? 45 : 65;
  const accent = hslToHex(accentHue, accentSat, accentLight);

  // 4. Highlight: Radiant version of the accent or neon white/cyan
  const highlightHue = (accentHue + 30) % 360;
  const highlightSat = 100;
  const highlightLight = isLightMode ? 55 : 75;
  const highlight = hslToHex(highlightHue, highlightSat, highlightLight);

  // 5. Neutral (Text/Borders)
  // Dark mode: cool off-white/silvers. Light mode: deep slate/charcoal.
  const neutral = isLightMode 
    ? hslToHex((primaryHue + 180) % 360, 15, 12)  // deep charcoal
    : hslToHex(primaryHue, 15, 94);              // cool ice-silver

  // 6. Background (Rich, themed backdrop)
  // Dark mode: very deep, luxury dark with a trace of the dominant hue.
  // Light mode: very clean, ultra-soft off-white with a trace of the primary hue.
  const background = isLightMode
    ? hslToHex(primaryHue, 12, 98)   // soft pearl off-white
    : hslToHex(primaryHue, 18, 7);   // deep obsidian base

  return {
    primary,
    secondary,
    accent,
    highlight,
    neutral,
    background,
  };
}

/**
 * Returns formatted CSS custom properties from a palette
 */
export function exportToCSS(palette: ColorPalette): string {
  return `:root {
  --chromatune-primary: ${palette.primary};
  --chromatune-secondary: ${palette.secondary};
  --chromatune-accent: ${palette.accent};
  --chromatune-highlight: ${palette.highlight};
  --chromatune-neutral: ${palette.neutral};
  --chromatune-background: ${palette.background};
}`;
}

/**
 * Returns a JSON configuration for Tailwind CSS extend block
 */
export function exportToTailwind(palette: ColorPalette): string {
  const block = {
    theme: {
      extend: {
        colors: {
          chromatune: {
            primary: palette.primary,
            secondary: palette.secondary,
            accent: palette.accent,
            highlight: palette.highlight,
            neutral: palette.neutral,
            background: palette.background,
          }
        }
      }
    }
  };
  return JSON.stringify(block, null, 2);
}

/**
 * Generates Adobe Swatch Exchange (ASE) compatible JSON swatch structure
 * Since native .ase is a binary format, design programs (like Adobe Illustrator,
 * Photoshop, Figma plugins) accept JSON Swatch Exchanges that map directly.
 */
export function exportToASE(palette: ColorPalette): string {
  const swatches = Object.entries(palette).map(([key, hex]) => {
    const rgb = hexToRgb(hex);
    // Convert to normalized 0-1 range as Adobe Swatches use internally
    const r = parseFloat((rgb.r / 255).toFixed(4));
    const g = parseFloat((rgb.g / 255).toFixed(4));
    const b = parseFloat((rgb.b / 255).toFixed(4));

    return {
      name: key.charAt(0).toUpperCase() + key.slice(1),
      model: 'RGB',
      color: [r, g, b],
      type: 'global'
    };
  });

  const aseJson = {
    version: '1.0',
    generator: 'ChromaTune Audio Swatch Swapper',
    groups: [
      {
        name: 'ChromaTune Swatches',
        swatches: swatches
      }
    ]
  };

  return JSON.stringify(aseJson, null, 2);
}
