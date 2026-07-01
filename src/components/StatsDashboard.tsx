import React from 'react';
import { HelpCircle, Sparkles, Activity, Heart, ShieldAlert, Zap, Compass } from 'lucide-react';
import { FullSongStats, ColorPalette } from '../types';

interface StatsDashboardProps {
  stats: FullSongStats | null;
  palette: ColorPalette;
}

export default function StatsDashboard({ stats, palette }: StatsDashboardProps) {
  // Fallbacks if stats not fully loaded
  const tempo = stats ? stats.tempoBpm : 120;
  const mood = stats ? stats.mood : 'Balanced & Harmonious';
  const energy = stats ? stats.energyLevel : 50;
  const brightness = stats ? stats.brightness : 50;
  const warmth = stats ? stats.warmth : 50;
  const danceability = stats ? stats.danceability : 50;
  const valence = stats ? stats.valence : 50;
  const acousticness = stats ? stats.acousticness : 30;

  return (
    <div className="flex flex-col space-y-6">
      
      {/* Tab/Panel Header */}
      <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
        <Compass className="h-4.5 w-4.5 text-amber-400" />
        <h3 className="text-base font-bold text-white">Acoustic Insights & Profiling</h3>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* BIG CARD 1: Estimated Mood Profile */}
        <div className="md:col-span-6 rounded-2xl border border-white/10 bg-black/40 p-6 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle colored background wash */}
          <div 
            className="absolute -right-16 -top-16 h-32 w-32 rounded-full opacity-10 blur-2xl pointer-events-none"
            style={{ backgroundColor: palette.primary }}
          />

          <div className="space-y-1">
            <span className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase">DECISION Mood profile</span>
            <h4 className="text-2xl font-bold tracking-tight text-white">{mood}</h4>
          </div>

          <p className="text-xs text-zinc-400 font-light mt-4 leading-relaxed">
            The profile engine correlates spectral centroid (brightness) and average root-mean-square loudness to estimate emotional character. High-energy, warm, and highly danceable tracks yield vibrant, energetic classifications, while low-amplitude, low-crossing-rate signals represent serene or melancholic atmospheres.
          </p>

          <div className="mt-6 flex items-center space-x-2">
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-mono text-emerald-400">
              DSP DECISION ACTIVE
            </span>
          </div>
        </div>

        {/* CARD 2: Estimated Tempo */}
        <div className="md:col-span-3 rounded-2xl border border-white/10 bg-black/40 p-6 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase">PEAK ENVELOPE TEMPO</span>
            <h4 className="text-xs font-semibold text-zinc-300">Estimated Beats</h4>
          </div>

          <div className="my-3 flex items-baseline space-x-1 select-none">
            <span className="text-5xl font-black tracking-tight text-white font-mono">{tempo}</span>
            <span className="text-sm font-mono text-zinc-500">BPM</span>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] text-zinc-400 font-light">Interval gap resolution</p>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-400 to-amber-400 rounded-full" 
                style={{ width: `${Math.min(100, (tempo / 180) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* CARD 3: Valence & Danceability */}
        <div className="md:col-span-3 rounded-2xl border border-white/10 bg-black/40 p-6 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase">SPECTRAL Valences</span>
            <h4 className="text-xs font-semibold text-zinc-300">Rhythmic Scores</h4>
          </div>

          <div className="space-y-4 my-4">
            {/* Danceability */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-zinc-400">Danceability</span>
                <span className="font-mono text-white/80">{danceability}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${danceability}%`, backgroundColor: palette.accent }} />
              </div>
            </div>

            {/* Valence */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-zinc-400">Acoustic Valence</span>
                <span className="font-mono text-white/80">{valence}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${valence}%`, backgroundColor: palette.highlight }} />
              </div>
            </div>
          </div>

          <p className="text-[9px] text-zinc-500 font-light leading-none">Acoustics profile metrics</p>
        </div>

      </div>

      {/* LOWER GAUGES LIST */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* Gauge: Energy */}
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Overall Energy</span>
            <span className="font-mono text-white">{energy}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${energy}%` }} />
          </div>
        </div>

        {/* Gauge: Brightness */}
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Brightness</span>
            <span className="font-mono text-white">{brightness}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${brightness}%` }} />
          </div>
        </div>

        {/* Gauge: Warmth */}
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Warmth</span>
            <span className="font-mono text-white">{warmth}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-rose-500 rounded-full" style={{ width: `${warmth}%` }} />
          </div>
        </div>

        {/* Gauge: Acousticness */}
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Acousticness</span>
            <span className="font-mono text-white">{acousticness}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${acousticness}%` }} />
          </div>
        </div>

      </div>

    </div>
  );
}
