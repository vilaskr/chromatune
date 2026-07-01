import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Disc } from 'lucide-react';
import { SongMetadata, LiveAcousticFeatures, ColorPalette } from '../types';

interface AudioPlayerProps {
  metadata: SongMetadata;
  isPlaying: boolean;
  isLooping: boolean;
  volume: number;
  playbackTime: number;
  duration: number;
  liveFeatures: LiveAcousticFeatures | null;
  palette: ColorPalette;
  togglePlay: () => void;
  toggleLoop: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (vol: number) => void;
}

export default function AudioPlayer({
  metadata,
  isPlaying,
  isLooping,
  volume,
  playbackTime,
  duration,
  liveFeatures,
  palette,
  togglePlay,
  toggleLoop,
  seekTo,
  setVolume
}: AudioPlayerProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.8);

  // Format seconds to MM:SS
  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return '0:00';
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (vol > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(prevVolume);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetSeconds = parseFloat(e.target.value);
    seekTo(targetSeconds);
  };

  // Acoustic multipliers for live animated cover art
  const bassScale = liveFeatures ? 1 + liveFeatures.bassEnergy * 0.15 : 1;
  const rotationSpeed = isPlaying ? (liveFeatures ? 3 + liveFeatures.midEnergy * 15 : 4) : 0;

  return (
    <div className="flex flex-col space-y-6 rounded-3xl border border-white/10 bg-black/40 p-6 md:p-8 backdrop-blur-md shadow-2xl">
      {/* Album Cover Art / Details section */}
      <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-center sm:space-x-6 space-y-6 sm:space-y-0">
        
        {/* Procedural Reactive Vinyl Art */}
        <motion.div
          animate={{ scale: bassScale }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-2xl overflow-hidden shadow-2xl border border-white/10"
          style={{
            background: `radial-gradient(circle, ${palette.primary}aa, ${palette.secondary}88, ${palette.background}ff)`
          }}
        >
          {/* Moving vinyl grooves */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              repeat: Infinity,
              duration: rotationSpeed > 0 ? 60 / rotationSpeed : 0,
              ease: 'linear'
            }}
            className="absolute inset-2 rounded-full border border-white/5 flex items-center justify-center"
            style={{
              background: `repeating-radial-gradient(circle, transparent, transparent 4px, rgba(0,0,0,0.15) 5px, rgba(255,255,255,0.05) 6px)`
            }}
          >
            {/* Inner center labels */}
            <div 
              className="h-10 w-10 rounded-full border-2 border-black/20 flex items-center justify-center transition-colors duration-1000"
              style={{ backgroundColor: palette.accent }}
            >
              <Disc className="h-4 w-4 text-white animate-spin-slow" />
            </div>
          </motion.div>
        </motion.div>

        {/* Track Details */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="space-y-0.5">
            <h3 className="truncate text-xl font-bold tracking-tight text-white">{metadata.name}</h3>
            <p className="truncate text-sm text-zinc-400 font-light">{metadata.artist}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-zinc-500">
            <span className="rounded bg-zinc-800 text-zinc-300 px-2 py-0.5 border border-white/10">
              {formatTime(metadata.duration)}
            </span>
            <span>•</span>
            <span>{metadata.size}</span>
            <span>•</span>
            <span className="uppercase text-[9px] font-semibold text-zinc-400 tracking-wider">
              {metadata.album}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Slider (Seek Bar) */}
      <div className="space-y-1.5 pt-4">
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={playbackTime}
          onChange={handleSeek}
          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 outline-none transition-all hover:h-1.5 focus:outline-none [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md"
          style={{
            backgroundImage: `linear-gradient(to right, ${palette.primary} 0%, ${palette.primary} ${(playbackTime / (duration || 1)) * 100}%, transparent ${(playbackTime / (duration || 1)) * 100}%)`
          }}
        />
        
        {/* Time Indicators */}
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400 select-none">
          <span>{formatTime(playbackTime)}</span>
          <span>{formatTime(Math.max(0, duration - playbackTime))}</span>
        </div>
      </div>

      {/* Primary Audio Controls */}
      <div className="flex items-center justify-between pt-2">
        
        {/* Loop Toggle Button */}
        <button
          onClick={toggleLoop}
          className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 active:scale-95 ${
            isLooping 
              ? 'bg-white/10 text-white border-white/20' 
              : 'text-zinc-400 border-white/10 bg-white/5 hover:text-white'
          }`}
          title="Toggle Repeat / Loop"
        >
          <RotateCcw className={`h-4.5 w-4.5 ${isLooping ? 'rotate-180 text-emerald-400' : ''}`} />
        </button>

        {/* Play/Pause Button */}
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={togglePlay}
          className="flex h-16 w-16 items-center justify-center rounded-full text-black shadow-xl hover:shadow-2xl transition-all duration-300 focus:outline-none"
          style={{
            background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})`,
            boxShadow: `0 12px 36px -8px ${palette.primary}aa`
          }}
        >
          {isPlaying ? (
            <Pause className="h-6 w-6 text-black fill-current" />
          ) : (
            <Play className="h-6 w-6 text-black fill-current ml-1" />
          )}
        </motion.button>

        {/* Volume System */}
        <div className="flex items-center space-x-3 w-32 shrink-0">
          <button
            onClick={toggleMute}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 transition-all hover:text-white hover:bg-white/10"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4.5 w-4.5 text-rose-400" />
            ) : (
              <Volume2 className="h-4.5 w-4.5" />
            )}
          </button>
          
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 outline-none hover:h-1.5 focus:outline-none [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            style={{
              backgroundImage: `linear-gradient(to right, ${palette.secondary} 0%, ${palette.secondary} ${(isMuted ? 0 : volume) * 100}%, transparent ${(isMuted ? 0 : volume) * 100}%)`
            }}
          />
        </div>

      </div>
    </div>
  );
}
