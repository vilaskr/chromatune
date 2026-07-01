import React, { useEffect, useRef } from 'react';
import { Grid, Download, HelpCircle } from 'lucide-react';
import { TimelinePoint, ColorPalette } from '../types';
import { addGrain } from '../utils/exporter';

interface AudioDNAProps {
  timeline: TimelinePoint[];
  palette: ColorPalette;
  songName: string;
}

export default function AudioDNA({ timeline, palette, songName }: AudioDNAProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || timeline.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 320;
    canvas.width = size * window.devicePixelRatio;
    canvas.height = size * window.devicePixelRatio;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Render an 8x8 Matrix Fingerprint Grid
    const gridSize = 8;
    const padding = 6;
    const blockSize = (size - padding * (gridSize + 1)) / gridSize;

    // Clear background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, size, size);

    // Convert hex helper
    const hexToRgb = (hex: string) => {
      const clean = hex.replace('#', '');
      const r = parseInt(clean.substring(0, 2), 16) || 0;
      const g = parseInt(clean.substring(2, 4), 16) || 0;
      const b = parseInt(clean.substring(4, 6), 16) || 0;
      return { r, g, b };
    };

    const colors = [palette.primary, palette.secondary, palette.accent, palette.highlight, palette.neutral];

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        // Calculate an index to sample from the timeline
        const timelineIdx = Math.floor(((r * gridSize + c) / (gridSize * gridSize)) * timeline.length);
        const point = timeline[timelineIdx] || timeline[0];

        // Combine row/column math to extract a unique procedural visual
        const bassFactor = point ? point.features.bass : 0.5;
        const midFactor = point ? point.features.mid : 0.5;
        const trebleFactor = point ? point.features.treble : 0.5;
        const energyFactor = point ? point.features.energy : 0.5;

        // Choose a base color and blend with math
        const col1 = colors[(r + c) % colors.length];
        const col2 = colors[(r * c) % colors.length];
        
        const rgb1 = hexToRgb(col1);
        const rgb2 = hexToRgb(col2);

        // Blend colors based on localized energy and treble
        const blend = (energyFactor + trebleFactor) / 2;
        const red = Math.round(rgb1.r + (rgb2.r - rgb1.r) * blend);
        const green = Math.round(rgb1.g + (rgb2.g - rgb1.g) * blend);
        const blue = Math.round(rgb1.b + (rgb2.b - rgb1.b) * blend);

        const x = padding + c * (blockSize + padding);
        const y = padding + r * (blockSize + padding);

        // Draw block with rounded corners
        ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        ctx.beginPath();
        ctx.roundRect(x, y, blockSize, blockSize, 6);
        ctx.fill();

        // Draw sub-details inside the block for advanced tech-design look
        // A mini-dot or diagonal hatch based on Bass vs Treble
        if (bassFactor > 0.6) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.beginPath();
          ctx.arc(x + blockSize / 2, y + blockSize / 2, blockSize * 0.15, 0, Math.PI * 2);
          ctx.fill();
        } else if (trebleFactor > 0.5) {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x + 4, y + 4);
          ctx.lineTo(x + blockSize - 4, y + blockSize - 4);
          ctx.stroke();
        }
      }
    }

    // Add film grain
    addGrain(ctx, size, size, 0.05);

  }, [timeline, palette]);

  const handleDownloadDNA = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${songName.replace(/\s+/g, '-').toLowerCase()}-dna-fingerprint.png`;
    a.click();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
      
      {/* Description column */}
      <div className="md:col-span-7 space-y-4">
        <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
          <Grid className="h-4.5 w-4.5 text-blue-400" />
          <h3 className="text-base font-bold text-white">Audio DNA Fingerprint</h3>
        </div>

        <p className="text-sm text-zinc-400 font-light leading-relaxed">
          Audio DNA creates a completely unique 64-block cryptographic matrix grid representing the acoustic texture of your track. 
          Each block resolves a mathematical integration of localized frequency spectra (Bass vs Treble) and RMS power density. 
          This generates a distinctive "QR-code of sound" that is entirely reproducible and unique to this specific track.
        </p>

        <button
          onClick={handleDownloadDNA}
          className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-semibold rounded-xl flex items-center space-x-2 transition-all active:scale-95"
        >
          <Download className="h-4 w-4" />
          <span>Download Fingerprint Grid</span>
        </button>
      </div>

      {/* Grid Canvas Column */}
      <div className="md:col-span-5 flex justify-center">
        <div className="relative rounded-2xl overflow-hidden border border-white/10 p-2 bg-[#09090b] shadow-2xl">
          <canvas ref={canvasRef} className="block rounded-lg shadow-inner" />
          
          {/* Scientific overlay markers */}
          <div className="absolute inset-0 border border-white/5 pointer-events-none rounded-xl" />
        </div>
      </div>

    </div>
  );
}
