/**
 * ChromaTune Types & Interfaces
 */

export interface SongMetadata {
  name: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  size: string; // formatted file size
  type: string; // mime type
  coverUrl?: string; // extracted or procedurally generated cover
}

export interface LiveAcousticFeatures {
  bassEnergy: number;      // 0 to 1
  midEnergy: number;       // 0 to 1
  trebleEnergy: number;    // 0 to 1
  peakEnergy: number;      // 0 to 1
  rmsLoudness: number;     // 0 to 1
  spectralCentroid: number;// normalized
  spectralRolloff: number; // normalized
  zeroCrossingRate: number;// normalized
  dynamicRange: number;    // peak to RMS ratio or dB
}

export interface FullSongStats {
  tempoBpm: number;
  mood: string;
  energyLevel: number;     // 0 to 100
  brightness: number;      // 0 to 100
  warmth: number;          // 0 to 100
  danceability: number;    // 0 to 100
  acousticness: number;    // 0 to 100
  valence: number;         // 0 to 100 (emotional positivity)
}

export interface ColorPalette {
  primary: string;         // Hex code
  secondary: string;       // Hex code
  accent: string;          // Hex code
  highlight: string;       // Hex code
  neutral: string;         // Hex code
  background: string;      // Hex code
}

export interface TimelinePoint {
  time: number;            // seconds
  color: string;           // Hex representing the dominant mood/frequency at this point
  features: {
    bass: number;
    mid: number;
    treble: number;
    energy: number;
  };
}

export type VisualizerMode = 'bars' | 'circle' | 'wave' | 'particles';

export type AppTheme = 'dark' | 'ambient';
