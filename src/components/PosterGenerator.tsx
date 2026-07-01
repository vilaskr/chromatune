import React from 'react';
import { motion } from 'motion/react';
import { FileImage, Download, Sparkles } from 'lucide-react';
import { ColorPalette, SongMetadata, TimelinePoint, FullSongStats } from '../types';
import { downloadMinimalPoster } from '../utils/exporter';

interface PosterGeneratorProps {
  palette: ColorPalette;
  metadata: SongMetadata;
  timeline: TimelinePoint[];
  stats: FullSongStats | null;
}

export default function PosterGenerator({ palette, metadata, timeline, stats }: PosterGeneratorProps) {
  
  const handleExport = () => {
    if (!stats) return;
    downloadMinimalPoster(palette, metadata, timeline, stats);
  };

  // Safe subset for mini waveform preview in poster
  const wavePoints = timeline.slice(0, 48);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
      
      {/* LEFT COLUMN: Visual Description & Action Button */}
      <div className="md:col-span-5 space-y-5">
        <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
          <FileImage className="h-4.5 w-4.5 text-emerald-400" />
          <h3 className="text-base font-bold text-white">Minimalist Poster</h3>
        </div>

        <p className="text-sm text-zinc-400 font-light leading-relaxed">
          Generate an Apple-inspired gallery-grade art print featuring your audio fingerprint. 
          The design embeds a central glowing vector orb, dual timeline spectrograms (circular and linear), 
          the 5-color swatch scale, and detailed metadata stats printed in sleek monospace.
        </p>

        <div className="space-y-3 pt-2">
          <div className="flex items-center space-x-2 text-xs font-mono text-zinc-500">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span>Format: 1200 x 1600 px (PNG)</span>
          </div>
          
          <button
            onClick={handleExport}
            disabled={!stats}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-tr from-cyan-400 to-purple-500 hover:from-cyan-500 hover:to-purple-600 text-black text-xs font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export Designer Poster</span>
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: Realistic Live Frame Preview */}
      <div className="md:col-span-7 flex justify-center">
        
        {/* Poster Frame Container */}
        <div className="relative w-full max-w-[340px] aspect-[3/4] bg-[#09090b] rounded-3xl border border-white/10 shadow-2xl overflow-hidden p-6 select-none">
          
          {/* Subtle sheen */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/[0.02] to-white/0 pointer-events-none" />

          {/* Central glowing mesh orb */}
          <div 
            className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-2xl opacity-60 animate-pulse"
            style={{
              background: `radial-gradient(circle, ${palette.highlight}ee, ${palette.primary}aa, transparent 70%)`
            }}
          />

          {/* Inner Circular Spectrogram */}
          <div className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full border border-white/5 flex items-center justify-center">
            {/* Animated waveforms inside circular orbit */}
            <div className="absolute w-28 h-28 rounded-full border border-white/10 flex items-center justify-center">
              <div 
                className="w-16 h-16 rounded-full border border-dashed"
                style={{ borderColor: palette.primary }}
              />
            </div>
          </div>

          {/* Typography Bottom Group */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-col items-center text-center space-y-4">
            
            {/* Title & Artist */}
            <div className="space-y-0.5">
              <h4 className="text-white text-xs font-bold tracking-widest uppercase truncate max-w-[280px]">
                {metadata.name}
              </h4>
              <p className="text-[9px] text-zinc-400 font-sans tracking-wide truncate max-w-[280px]">
                {metadata.artist}
              </p>
            </div>

            {/* Linear Timeline Waveform representation */}
            <div className="flex items-center justify-center space-x-0.5 w-full h-5 px-4">
              {wavePoints.map((point, idx) => (
                <div
                  key={idx}
                  className="w-0.5 rounded-full bg-white/20"
                  style={{
                    height: `${Math.max(4, point.features.energy * 18)}px`,
                    backgroundColor: idx % 3 === 0 ? palette.primary : 'rgba(255, 255, 255, 0.15)'
                  }}
                />
              ))}
            </div>

            {/* Five Color Swatches */}
            <div className="flex justify-center space-x-2">
              {[palette.primary, palette.secondary, palette.accent, palette.highlight, palette.neutral].map((col, idx) => (
                <div
                  key={idx}
                  className="w-4.5 h-4.5 rounded-md border border-white/10"
                  style={{ backgroundColor: col }}
                  title={col}
                />
              ))}
            </div>

            {/* Monospace Poster Footer details */}
            <div className="flex justify-between w-full text-[6px] font-mono text-zinc-500 border-t border-white/10 pt-2">
              <span>BPM: {stats ? stats.tempoBpm : '120'}</span>
              <span>MOOD: {stats ? stats.mood.toUpperCase() : 'BALANCED'}</span>
              <span>CHROMATUNE © 2026</span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
