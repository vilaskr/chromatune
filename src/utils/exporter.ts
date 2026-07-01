import { ColorPalette, SongMetadata, TimelinePoint, FullSongStats } from '../types';
import { hexToRgb } from './paletteGenerator';

/**
 * Downloads a text-based file (JSON, CSS, etc.)
 */
export function downloadTextFile(content: string, fileName: string, contentType: string) {
  const a = document.createElement('a');
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
}

/**
 * Adds beautiful analog noise/grain to a canvas context
 */
export function addGrain(ctx: CanvasRenderingContext2D, width: number, height: number, opacity = 0.04) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * opacity * 255;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
    data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise)); // G
    data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise)); // B
  }
  ctx.putImageData(imgData, 0, 0);
}

/**
 * Draws a beautiful organic mesh gradient on a canvas
 */
export function drawMeshGradient(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  palette: ColorPalette,
  useGrain = true
) {
  // Clear with background color
  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, width, height);

  // We will draw 4-5 overlapping glowing radial gradient blobs with primary, secondary, accent, and highlight colors
  const blobs = [
    { x: width * 0.25, y: height * 0.25, r: Math.max(width, height) * 0.5, c: palette.primary },
    { x: width * 0.75, y: height * 0.35, r: Math.max(width, height) * 0.6, c: palette.secondary },
    { x: width * 0.45, y: height * 0.75, r: Math.max(width, height) * 0.55, c: palette.accent },
    { x: width * 0.8, y: height * 0.8, r: Math.max(width, height) * 0.45, c: palette.highlight },
    { x: width * 0.5, y: height * 0.4, r: Math.max(width, height) * 0.35, c: palette.primary }
  ];

  ctx.globalCompositeOperation = 'screen'; // gorgeous screen blend mode for glowing colors

  blobs.forEach((blob) => {
    const grad = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.r);
    const rgb = hexToRgb(blob.c);
    grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.75)`);
    grad.addColorStop(0.3, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.45)`);
    grad.addColorStop(0.6, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(blob.x, blob.y, blob.r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalCompositeOperation = 'source-over'; // restore default

  // Draw procedural organic wave shapes across the canvas
  ctx.strokeStyle = `rgba(255, 255, 255, 0.08)`;
  ctx.lineWidth = 1.5;
  for (let offset = 0; offset < 4; offset++) {
    ctx.beginPath();
    for (let x = 0; x <= width; x += 20) {
      const y = height * (0.4 + offset * 0.1) + Math.sin(x * 0.003 + offset) * 80;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Add warm grain overlay for Apple design vibe
  if (useGrain) {
    addGrain(ctx, width, height, 0.06);
  }
}

/**
 * Render and download PNG gradient
 */
export function downloadGradientPNG(palette: ColorPalette) {
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    drawMeshGradient(ctx, 1920, 1080, palette, true);
    
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `chromatune-gradient.png`;
    a.click();
  }
}

/**
 * Render and download Desktop Wallpaper (2560x1440)
 */
export function downloadWallpaperDesktop(palette: ColorPalette, metadata: SongMetadata) {
  const canvas = document.createElement('canvas');
  canvas.width = 2560;
  canvas.height = 1440;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    drawMeshGradient(ctx, 2560, 1440, palette, true);

    // Subtle Apple-style watermark/tag in bottom center
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '300 18px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${metadata.name.toUpperCase()}  //  CHROMATUNE COLOR PALETTE`, 2560 / 2, 1440 - 60);

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metadata.name.replace(/\s+/g, '-').toLowerCase()}-wallpaper-desktop.png`;
    a.click();
  }
}

/**
 * Render and download Phone Wallpaper (1440x3120)
 */
export function downloadWallpaperPhone(palette: ColorPalette, metadata: SongMetadata) {
  const canvas = document.createElement('canvas');
  canvas.width = 1440;
  canvas.height = 3120;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    drawMeshGradient(ctx, 1440, 3120, palette, true);

    // Subtle Apple-style watermark/tag in center bottom
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '300 24px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${metadata.name.toUpperCase()}`, 1440 / 2, 3120 - 200);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.font = '300 16px "JetBrains Mono", monospace';
    ctx.fillText(`CHROMA COLOR SIGNATURE`, 1440 / 2, 3120 - 160);

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metadata.name.replace(/\s+/g, '-').toLowerCase()}-wallpaper-phone.png`;
    a.click();
  }
}

/**
 * Render and download Tablet Wallpaper (2048x1536)
 */
export function downloadWallpaperTablet(palette: ColorPalette, metadata: SongMetadata) {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1536;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    drawMeshGradient(ctx, 2048, 1536, palette, true);

    // Subtle Apple-style watermark/tag
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '300 18px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${metadata.name.toUpperCase()}  //  CHROMATUNE`, 2048 / 2, 1536 - 80);

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metadata.name.replace(/\s+/g, '-').toLowerCase()}-wallpaper-tablet.png`;
    a.click();
  }
}

/**
 * Render and download Minimalist Poster (1200x1600)
 */
export function downloadMinimalPoster(
  palette: ColorPalette,
  metadata: SongMetadata,
  timeline: TimelinePoint[],
  stats: FullSongStats
) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1600;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // 1. Draw elegant, slightly warm off-white or deep obsidian background
    ctx.fillStyle = '#0b0c10'; // Dark premium aesthetic for high-end poster
    ctx.fillRect(0, 0, 1200, 1600);

    // 2. Draw a beautiful, glowing mesh orb in the upper-middle section
    const orbX = 1200 / 2;
    const orbY = 550;
    const orbRadius = 380;

    const grad = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, orbRadius);
    const primaryRGB = hexToRgb(palette.primary);
    const secondaryRGB = hexToRgb(palette.secondary);
    const highlightRGB = hexToRgb(palette.highlight);
    
    grad.addColorStop(0, `rgba(${highlightRGB.r}, ${highlightRGB.g}, ${highlightRGB.b}, 0.95)`);
    grad.addColorStop(0.3, `rgba(${primaryRGB.r}, ${primaryRGB.g}, ${primaryRGB.b}, 0.75)`);
    grad.addColorStop(0.6, `rgba(${secondaryRGB.r}, ${secondaryRGB.g}, ${secondaryRGB.b}, 0.35)`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(orbX, orbY, orbRadius, 0, Math.PI * 2);
    ctx.fill();

    // 3. Overlay minimal wireframe waves representing the exact timeline frequency of the song
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    
    // Circle spectrogram/waveform inside the poster
    const circlePoints = 120;
    ctx.beginPath();
    for (let j = 0; j < circlePoints; j++) {
      const angle = (j / circlePoints) * Math.PI * 2;
      const timelineIdx = Math.floor((j / circlePoints) * timeline.length);
      const point = timeline[timelineIdx] || timeline[0];
      const energyMod = point ? (point.features.bass * 0.5 + point.features.mid * 0.3 + point.features.treble * 0.2) : 0.5;
      
      const r = 240 + energyMod * 70;
      const x = orbX + Math.cos(angle) * r;
      const y = orbY + Math.sin(angle) * r;

      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    // Inner orbiting waveform
    ctx.strokeStyle = `rgba(${highlightRGB.r}, ${highlightRGB.g}, ${highlightRGB.b}, 0.45)`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let j = 0; j < circlePoints; j++) {
      const angle = (j / circlePoints) * Math.PI * 2;
      const timelineIdx = Math.floor(((j + 30) % circlePoints / circlePoints) * timeline.length);
      const point = timeline[timelineIdx] || timeline[0];
      const energyMod = point ? (point.features.mid * 0.4 + point.features.treble * 0.4) : 0.4;
      
      const r = 180 + energyMod * 40;
      const x = orbX + Math.cos(angle) * r;
      const y = orbY + Math.sin(angle) * r;

      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    // 4. DRAW GRAPHIC POSTER TEXT
    // Apple-style display typography: "Space Grotesk" or "Helvetica Neue"
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 48px sans-serif';
    ctx.textAlign = 'center';
    
    // Capitalize Title
    ctx.fillText(metadata.name.toUpperCase(), 1200 / 2, 1080);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '300 24px sans-serif';
    ctx.fillText(metadata.artist, 1200 / 2, 1130);

    // Waveform line underneath the artist
    const waveY = 1200;
    const waveWidth = 500;
    const waveX = (1200 - waveWidth) / 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let j = 0; j < timeline.length; j++) {
      const point = timeline[j];
      const x = waveX + (j / timeline.length) * waveWidth;
      const height = point.features.energy * 24;
      ctx.moveTo(x, waveY - height / 2);
      ctx.lineTo(x, waveY + height / 2);
    }
    ctx.stroke();

    // 5. DRAW THE PALETTE BLOCKS IN THE POSTER
    const colors = [palette.primary, palette.secondary, palette.accent, palette.highlight, palette.neutral];
    const swatchWidth = 75;
    const swatchHeight = 75;
    const swatchSpacing = 24;
    const startSwatchX = (1200 - (colors.length * swatchWidth + (colors.length - 1) * swatchSpacing)) / 2;
    const swatchY = 1280;

    colors.forEach((col, idx) => {
      const sx = startSwatchX + idx * (swatchWidth + swatchSpacing);
      
      // Rounded swatch
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.roundRect(sx, swatchY, swatchWidth, swatchHeight, 12);
      ctx.fill();

      // Outline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Hex code Label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(col.toUpperCase(), sx + swatchWidth / 2, swatchY + swatchHeight + 20);
    });

    // 6. DRAW FINE-PRINT META DETAILS IN FOOTER
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`MOOD: ${stats.mood.toUpperCase()}`, 120, 1480);
    ctx.fillText(`TEMPO: ${stats.tempoBpm} BPM`, 120, 1510);
    ctx.fillText(`DYNAMIC RANGE: ${Math.round(stats.energyLevel)}%`, 120, 1540);

    ctx.textAlign = 'right';
    ctx.fillText(`SPECTRAL WARMTH: ${Math.round(stats.warmth)}%`, 1200 - 120, 1480);
    ctx.fillText(`SPECTRAL BRIGHTNESS: ${Math.round(stats.brightness)}%`, 1200 - 120, 1510);
    ctx.fillText(`CHROMATUNE // VECTOR SPECTRUM SIGNATURE`, 1200 - 120, 1540);

    // Grid details
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(120, 1440);
    ctx.lineTo(1200 - 120, 1440);
    ctx.stroke();

    // Grain
    addGrain(ctx, 1200, 1600, 0.05);

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metadata.name.replace(/\s+/g, '-').toLowerCase()}-poster.png`;
    a.click();
  }
}

/**
 * Export and Download an SVG representation of the gradient
 */
export function downloadGradientSVG(palette: ColorPalette, metadata: SongMetadata) {
  const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <radialGradient id="grad-primary" cx="25%" cy="25%" r="50%">
      <stop offset="0%" stop-color="${palette.primary}" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="${palette.background}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="grad-secondary" cx="75%" cy="35%" r="60%">
      <stop offset="0%" stop-color="${palette.secondary}" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="${palette.background}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="grad-accent" cx="45%" cy="75%" r="55%">
      <stop offset="0%" stop-color="${palette.accent}" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="${palette.background}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="grad-highlight" cx="80%" cy="80%" r="45%">
      <stop offset="0%" stop-color="${palette.highlight}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="${palette.background}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  
  <!-- Backdrop -->
  <rect width="1920" height="1080" fill="${palette.background}"/>
  
  <!-- Mesh Layers -->
  <rect width="1920" height="1080" fill="url(#grad-primary)"/>
  <rect width="1920" height="1080" fill="url(#grad-secondary)"/>
  <rect width="1920" height="1080" fill="url(#grad-accent)"/>
  <rect width="1920" height="1080" fill="url(#grad-highlight)"/>

  <!-- Footer Watermark -->
  <text x="960" y="1030" fill="#ffffff" font-size="14" font-family="sans-serif" letter-spacing="4" text-anchor="middle" opacity="0.3">${metadata.name.toUpperCase()} // CHROMATUNE</text>
</svg>
`;

  downloadTextFile(svgContent, `${metadata.name.replace(/\s+/g, '-').toLowerCase()}-gradient.svg`, 'image/svg+xml');
}
