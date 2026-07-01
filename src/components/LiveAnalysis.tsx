import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Zap, Drum, Activity, Moon, Radio } from 'lucide-react';
import { LiveAcousticFeatures, FullSongStats, ColorPalette } from '../types';

interface LiveAnalysisProps {
  liveFeatures: LiveAcousticFeatures | null;
  stats: FullSongStats | null;
  palette: ColorPalette;
}

export default function LiveAnalysis({ liveFeatures, stats, palette }: LiveAnalysisProps) {
  // Safe defaults if audio has loaded but is paused
  const bassVal = liveFeatures ? liveFeatures.bassEnergy : 0.05;
  const midVal = liveFeatures ? liveFeatures.midEnergy : 0.05;
  const trebleVal = liveFeatures ? liveFeatures.trebleEnergy : 0.05;
  const energyVal = liveFeatures ? liveFeatures.rmsLoudness : 0.05;

  const centroidVal = liveFeatures ? liveFeatures.spectralCentroid : 0.3;
  const zcrVal = liveFeatures ? liveFeatures.zeroCrossingRate : 0.1;
  const dynamicVal = liveFeatures ? liveFeatures.dynamicRange : 2.5;

  // Formatting percentages
  const toPercent = (val: number) => Math.round(Math.max(0, Math.min(1, val)) * 100);

  return (
    <div className="flex flex-col space-y-6 rounded-3xl border border-white/10 bg-black/40 p-6 md:p-8 backdrop-blur-md shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <h3 className="text-lg font-bold tracking-tight text-white flex items-center space-x-2">
          <Activity className="h-4.5 w-4.5 text-cyan-400 animate-pulse" />
          <span>Live Acoustic Telemetry</span>
        </h3>
        <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-mono font-medium text-emerald-400 border border-emerald-500/20 uppercase tracking-widest select-none">
          Live Audio Analysis
        </span>
      </div>

      {/* Rhythmic meters (Bass, Mids, Treble, and Energy) */}
      <div className="space-y-4">
        
        {/* Total Energy */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center space-x-1.5 text-zinc-400 font-light">
              <Zap className="h-4 w-4 text-amber-400" />
              <span>Overall Energy (RMS)</span>
            </span>
            <span className="font-mono text-white font-medium">{toPercent(energyVal)}%</span>
          </div>
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/5 border border-white/10">
            <div
              className="h-full rounded-full transition-all duration-75 ease-out"
              style={{
                width: `${toPercent(energyVal)}%`,
                background: `linear-gradient(to right, ${palette.primary}, ${palette.secondary})`
              }}
            />
          </div>
        </div>

        {/* Bass */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center space-x-1.5 text-zinc-400 font-light">
              <Drum className="h-4 w-4 text-red-500" />
              <span>Sub & Bass Energy</span>
            </span>
            <span className="font-mono text-white font-medium">{toPercent(bassVal)}%</span>
          </div>
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/5 border border-white/10">
            <div
              className="h-full rounded-full transition-all duration-75 ease-out"
              style={{
                width: `${toPercent(bassVal)}%`,
                background: `linear-gradient(to right, ${palette.primary}, ${palette.accent})`
              }}
            />
          </div>
        </div>

        {/* Mid */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center space-x-1.5 text-zinc-400 font-light">
              <Radio className="h-4 w-4 text-orange-400" />
              <span>Midrange / Vocal Presence</span>
            </span>
            <span className="font-mono text-white font-medium">{toPercent(midVal)}%</span>
          </div>
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/5 border border-white/10">
            <div
              className="h-full rounded-full transition-all duration-75 ease-out"
              style={{
                width: `${toPercent(midVal)}%`,
                background: `linear-gradient(to right, ${palette.secondary}, ${palette.highlight})`
              }}
            />
          </div>
        </div>

        {/* Treble */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center space-x-1.5 text-zinc-400 font-light">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span>Presence & Treble</span>
            </span>
            <span className="font-mono text-white font-medium">{toPercent(trebleVal)}%</span>
          </div>
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/5 border border-white/10">
            <div
              className="h-full rounded-full transition-all duration-75 ease-out"
              style={{
                width: `${toPercent(trebleVal)}%`,
                background: `linear-gradient(to right, ${palette.accent}, ${palette.highlight})`
              }}
            />
          </div>
        </div>

      </div>

      {/* Grid of ancillary dynamic values */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
        
        {/* Estimated Tempo */}
        <div className="rounded-2xl bg-white/5 p-4 border border-white/10 flex flex-col justify-between">
          <p className="text-[10px] font-mono text-zinc-500 tracking-wider">TEMPO (BPM)</p>
          <div className="mt-1 flex items-baseline space-x-1">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">
              {stats ? stats.tempoBpm : '120'}
            </span>
            <span className="text-[10px] font-mono text-zinc-400">BPM</span>
          </div>
          <p className="text-[10px] text-zinc-500 font-light mt-1 truncate">Dynamic envelope count</p>
        </div>

        {/* Dynamic Range */}
        <div className="rounded-2xl bg-white/5 p-4 border border-white/10 flex flex-col justify-between">
          <p className="text-[10px] font-mono text-zinc-500 tracking-wider">DYNAMIC RANGE</p>
          <div className="mt-1 flex items-baseline space-x-1">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">
              {dynamicVal.toFixed(1)}
            </span>
            <span className="text-[10px] font-mono text-zinc-400">dB</span>
          </div>
          <p className="text-[10px] text-zinc-500 font-light mt-1 truncate">Peak-to-RMS ratio</p>
        </div>

        {/* Spectral Centroid */}
        <div className="rounded-2xl bg-white/5 p-4 border border-white/10 flex flex-col justify-between">
          <p className="text-[10px] font-mono text-zinc-500 tracking-wider">SPECTRAL BRIGHTNESS</p>
          <div className="mt-1 flex items-baseline space-x-1">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">
              {toPercent(centroidVal)}
            </span>
            <span className="text-[10px] font-mono text-zinc-400">%</span>
          </div>
          <p className="text-[10px] text-zinc-500 font-light mt-1 truncate">Center of spectral mass</p>
        </div>

        {/* Zero Crossing Rate */}
        <div className="rounded-2xl bg-white/5 p-4 border border-white/10 flex flex-col justify-between">
          <p className="text-[10px] font-mono text-zinc-500 tracking-wider">NOISINESS (ZCR)</p>
          <div className="mt-1 flex items-baseline space-x-1">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">
              {toPercent(zcrVal)}
            </span>
            <span className="text-[10px] font-mono text-zinc-400">%</span>
          </div>
          <p className="text-[10px] text-zinc-500 font-light mt-1 truncate">Wave polar boundary crossings</p>
        </div>

      </div>
    </div>
  );
}
