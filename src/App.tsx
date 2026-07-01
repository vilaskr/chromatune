import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, RefreshCw, Upload, Sparkles, Sliders, Palette, Calendar, Grid, Compass, Layout } from 'lucide-react';

// Hooks & Utils
import { useAudioEngine } from './hooks/useAudioEngine';
import { generatePaletteFromFeatures } from './utils/paletteGenerator';

// Components
import ProceduralBackground from './components/ProceduralBackground';
import Navbar from './components/Navbar';
import UploadArea from './components/UploadArea';
import AudioPlayer from './components/AudioPlayer';
import LiveAnalysis from './components/LiveAnalysis';
import Visualizer from './components/Visualizer';
import PaletteDisplay from './components/PaletteDisplay';
import ColorTimeline from './components/ColorTimeline';
import AudioDNA from './components/AudioDNA';
import StatsDashboard from './components/StatsDashboard';
import WallpaperGenerator from './components/WallpaperGenerator';
import PosterGenerator from './components/PosterGenerator';
import { AppTheme, ColorPalette } from './types';

export default function App() {
  const [theme, setTheme] = useState<AppTheme>('dark');
  const [activeOutputTab, setActiveOutputTab] = useState<'palette' | 'timeline' | 'wallpapers' | 'poster' | 'dna' | 'stats'>('palette');

  // Load our fully client-side audio engine
  const {
    isLoading,
    isPlaying,
    isLooping,
    volume,
    playbackTime,
    duration,
    metadata,
    stats,
    timeline,
    liveFeatures,
    analyserNode,
    loadAudioFile,
    togglePlay,
    toggleLoop,
    seekTo,
    setVolume,
    resetEngine
  } = useAudioEngine();

  // 1. Generate standard default palette if no song is loaded
  const defaultPalette: ColorPalette = useMemo(() => ({
    primary: '#0A84FF',      // Apple System Blue
    secondary: '#5E5CE6',    // Apple System Indigo
    accent: '#BF5AF2',       // Apple System Purple
    highlight: '#64D2FF',    // Apple System Teal
    neutral: '#F2F2F7',      // Cool light-grey text label
    background: '#090A0F'    // Obsidian depth
  }), []);

  // 2. Compute a stable track palette based on the pre-analyzed summary features
  const songPalette: ColorPalette | null = useMemo(() => {
    if (!metadata || timeline.length === 0) return null;
    
    // We synthesize the average values from the entire timeline for stability
    let sumBass = 0;
    let sumMid = 0;
    let sumTreble = 0;
    let sumRMS = 0;
    
    timeline.forEach((pt) => {
      sumBass += pt.features.bass;
      sumMid += pt.features.mid;
      sumTreble += pt.features.treble;
      sumRMS += pt.features.energy;
    });

    const avgFeatures = {
      bassEnergy: sumBass / timeline.length,
      midEnergy: sumMid / timeline.length,
      trebleEnergy: sumTreble / timeline.length,
      peakEnergy: 0.8,
      rmsLoudness: sumRMS / timeline.length,
      spectralCentroid: 0.5,
      spectralRolloff: 0.5,
      zeroCrossingRate: 0.2,
      dynamicRange: 5
    };

    return generatePaletteFromFeatures(avgFeatures, false);
  }, [metadata, timeline]);

  // Current active palette: loaded song palette or default
  const activePalette = songPalette || defaultPalette;

  // Render dark/ambient background cleanly
  const themeClass = 'bg-[#09090b] text-zinc-100';

  return (
    <div className={`min-h-screen pb-10 font-sans transition-colors duration-1000 ${themeClass} relative overflow-hidden flex flex-col justify-between`}>
      {/* Reactive background canvases */}
      <ProceduralBackground 
        palette={activePalette} 
        features={liveFeatures} 
        isPlaying={isPlaying} 
        theme={theme} 
      />

      {/* Dynamic Background Glows */}
      <>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full -z-10 pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-600/10 blur-[120px] rounded-full -z-10 pointer-events-none"></div>
      </>

      {/* Top Header/Navigation */}
      <Navbar theme={theme} setTheme={setTheme} palettePrimary={activePalette.primary} />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        
        <AnimatePresence mode="wait">
          {/* STATE A: LOADING DECODER PROGRESS */}
          {isLoading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-32 space-y-6 text-center"
            >
              <div className="relative flex h-20 w-20 items-center justify-center">
                <RefreshCw className="h-10 w-10 text-cyan-400 animate-spin" />
                <div 
                  className="absolute inset-0 rounded-full border border-dashed animate-spin"
                  style={{ borderColor: activePalette.primary, animationDuration: '6s' }}
                />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold font-sans tracking-tight text-white">Decompressing Audio Spectrum</h3>
                <p className="text-xs font-mono text-white/40 tracking-widest uppercase">
                  Performing Client-Side DFT waveform scan...
                </p>
              </div>
            </motion.div>
          ) : !metadata ? (
            
            // STATE B: NO SONG LOADED -> SHOW HERO & DRAG ZONE
            <motion.div
              key="upload-zone"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <UploadArea onFileSelect={loadAudioFile} palettePrimary={activePalette.primary} />
            </motion.div>
          ) : (
            
            // STATE C: ACTIVE PLAYBACK DASHBOARD
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              {/* Back to upload trigger button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono text-white/30 uppercase">CURRENTLY LOADING:</span>
                  <span className="text-xs font-mono font-semibold text-cyan-400 truncate max-w-xs">{metadata.name}</span>
                </div>
                
                <button
                  onClick={resetEngine}
                  className="flex items-center space-x-1.5 rounded-full bg-white/[0.04] px-4 py-1.5 text-xs font-semibold text-white/60 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white transition-all active:scale-95"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Another Track</span>
                </button>
              </div>

              {/* TWO COLUMN GRID Layout (Main controls & active scopes) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left side: Audio player controls & Visualizer */}
                <div className="lg:col-span-7 flex flex-col space-y-8">
                  <AudioPlayer
                    metadata={metadata}
                    isPlaying={isPlaying}
                    isLooping={isLooping}
                    volume={volume}
                    playbackTime={playbackTime}
                    duration={duration}
                    liveFeatures={liveFeatures}
                    palette={activePalette}
                    togglePlay={togglePlay}
                    toggleLoop={toggleLoop}
                    seekTo={seekTo}
                    setVolume={setVolume}
                  />

                  {/* Canvas Spectrogram/Visualizer */}
                  <Visualizer
                    analyserNode={analyserNode}
                    isPlaying={isPlaying}
                    palette={activePalette}
                  />
                </div>

                {/* Right side: Numerical Telemetry / Meters */}
                <div className="lg:col-span-5">
                  <LiveAnalysis
                    liveFeatures={liveFeatures}
                    stats={stats}
                    palette={activePalette}
                  />
                </div>
              </div>

              {/* GENERATED OUTPUTS SECTION */}
              <div className="rounded-3xl border border-white/10 bg-black/40 p-6 md:p-8 backdrop-blur-md space-y-6">
                
                {/* Generated outputs headers & sub-selectors */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-white flex items-center space-x-2">
                      <Layout className="h-5 w-5 text-purple-400 animate-pulse" />
                      <span>Synthesized Canvas Artworks</span>
                    </h3>
                    <p className="text-xs text-zinc-400 font-light mt-0.5">
                      Procedurally compiled creative exports derived from audio features
                    </p>
                  </div>

                  {/* Output tabs selector */}
                  <div className="flex flex-wrap items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-2xl">
                    {[
                      { id: 'palette', label: 'Palette & CSS', icon: <Palette className="h-3.5 w-3.5" /> },
                      { id: 'timeline', label: 'Color Timeline', icon: <Calendar className="h-3.5 w-3.5" /> },
                      { id: 'wallpapers', label: 'Wallpapers', icon: <Layout className="h-3.5 w-3.5" /> },
                      { id: 'poster', label: 'Designer Poster', icon: <Sliders className="h-3.5 w-3.5" /> },
                      { id: 'dna', label: 'Audio DNA', icon: <Grid className="h-3.5 w-3.5" /> },
                      { id: 'stats', label: 'Insights & Stats', icon: <Compass className="h-3.5 w-3.5" /> },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveOutputTab(tab.id as any)}
                        className={`flex items-center space-x-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                          activeOutputTab === tab.id
                            ? 'bg-white/10 text-white shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {tab.icon}
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* TAB CONTROLLERS CONTENT PANELS */}
                <div className="pt-2">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeOutputTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                    >
                      {activeOutputTab === 'palette' && (
                        <PaletteDisplay palette={activePalette} metadata={metadata} />
                      )}
                      {activeOutputTab === 'timeline' && (
                        <ColorTimeline
                          timeline={timeline}
                          playbackTime={playbackTime}
                          seekTo={seekTo}
                          duration={duration}
                        />
                      )}
                      {activeOutputTab === 'wallpapers' && (
                        <WallpaperGenerator palette={activePalette} metadata={metadata} />
                      )}
                      {activeOutputTab === 'poster' && (
                        <PosterGenerator
                          palette={activePalette}
                          metadata={metadata}
                          timeline={timeline}
                          stats={stats}
                        />
                      )}
                      {activeOutputTab === 'dna' && (
                        <AudioDNA
                          timeline={timeline}
                          palette={activePalette}
                          songName={metadata.name}
                        />
                      )}
                      {activeOutputTab === 'stats' && (
                        <StatsDashboard stats={stats} palette={activePalette} />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Status Bar */}
      <footer className="h-10 bg-black/40 border-t border-white/10 px-8 flex items-center justify-between text-[10px] font-mono text-zinc-500 z-10">
        <div className="flex gap-6">
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500'}`}></span> 
            {metadata ? 'Audio Engine Active' : 'Audio Engine Ready'}
          </span>
          <span>Buffer: {metadata ? '2048 samples' : 'Idle'}</span>
        </div>
        <div className="flex gap-4">
          <span>V0.8.2-Beta</span>
          <span className="text-white/20 hidden sm:inline">© 2026 ChromaTune Studio</span>
        </div>
      </footer>
    </div>
  );
}
