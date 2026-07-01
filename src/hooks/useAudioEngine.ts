import { useState, useEffect, useRef } from 'react';
import { SongMetadata, LiveAcousticFeatures, FullSongStats, TimelinePoint } from '../types';
import { analyzeAudioBuffer } from '../utils/audioAnalyzer';

export interface AudioEngine {
  isLoading: boolean;
  isPlaying: boolean;
  isLooping: boolean;
  volume: number;
  playbackTime: number;
  duration: number;
  metadata: SongMetadata | null;
  stats: FullSongStats | null;
  timeline: TimelinePoint[];
  liveFeatures: LiveAcousticFeatures | null;
  analyserNode: AnalyserNode | null;
  loadAudioFile: (file: File) => Promise<void>;
  togglePlay: () => void;
  toggleLoop: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (vol: number) => void;
  resetEngine: () => void;
}

export function useAudioEngine(): AudioEngine {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const [metadata, setMetadata] = useState<SongMetadata | null>(null);
  const [stats, setStats] = useState<FullSongStats | null>(null);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [liveFeatures, setLiveFeatures] = useState<LiveAcousticFeatures | null>(null);

  // Web Audio references
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);

  // Time tracking references
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const timeUpdateTimerRef = useRef<number | null>(null);

  // Fast feature extraction loop timer
  const analysisTimerRef = useRef<number | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopTimeUpdates();
      stopLiveAnalysis();
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
        } catch (e) {}
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const resetEngine = () => {
    stopTimeUpdates();
    stopLiveAnalysis();
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) {}
      sourceNodeRef.current = null;
    }
    bufferRef.current = null;
    setPlaybackTime(0);
    pausedTimeRef.current = 0;
    setIsPlaying(false);
    setMetadata(null);
    setStats(null);
    setTimeline([]);
    setLiveFeatures(null);
  };

  const loadAudioFile = async (file: File) => {
    setIsLoading(true);
    resetEngine();

    try {
      // 1. Initialize AudioContext lazy to pass autoplay policies
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioCtx = audioCtxRef.current;

      // 2. Read file as ArrayBuffer and decode audio
      const arrayBuffer = await file.arrayBuffer();
      const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      bufferRef.current = decodedBuffer;
      setDuration(decodedBuffer.duration);

      // 3. Extract metadata, full-song stats, timeline
      const fileSizeFormatted = formatBytes(file.size);
      const analysisResult = analyzeAudioBuffer(decodedBuffer, fileSizeFormatted, file.name);

      setMetadata(analysisResult.metadata);
      setStats(analysisResult.stats);
      setTimeline(analysisResult.timeline);

      // 4. Initialize Gain and Analyser nodes if not already present
      if (!gainNodeRef.current) {
        gainNodeRef.current = audioCtx.createGain();
        gainNodeRef.current.gain.value = volume;
      }
      if (!analyserNodeRef.current) {
        analyserNodeRef.current = audioCtx.createAnalyser();
        analyserNodeRef.current.fftSize = 512; // Balanced resolution for bars & circles
        analyserNodeRef.current.smoothingTimeConstant = 0.85;
      }

      // Chain: Source -> Analyser -> Gain -> Destination
      analyserNodeRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(audioCtx.destination);

      // Seed initial static features
      setLiveFeatures(analysisResult.acousticFeatures);

    } catch (err) {
      console.error('Audio loading/decoding error:', err);
      alert('Could not decode this audio file. Please make sure it is a valid, uncorrupted audio format.');
    } finally {
      setIsLoading(false);
    }
  };

  const startSourceNode = (offset: number) => {
    const audioCtx = audioCtxRef.current;
    const buffer = bufferRef.current;
    if (!audioCtx || !buffer || !analyserNodeRef.current) return;

    // Discard any current source
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) {}
      sourceNodeRef.current = null;
    }

    // AudioBufferSourceNodes are single-use, so create a new one
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.loop = isLooping;

    // Listen to stop event for looping/auto-advance
    source.onended = () => {
      // If loop is false, stop when we reach the end of the song
      if (!source.loop) {
        const elapsed = audioCtx.currentTime - startTimeRef.current;
        if (elapsed >= buffer.duration - 0.1) {
          setIsPlaying(false);
          setPlaybackTime(0);
          pausedTimeRef.current = 0;
          stopTimeUpdates();
          stopLiveAnalysis();
        }
      }
    };

    source.connect(analyserNodeRef.current);
    
    // Safety check: clip offset within range
    const startOffset = Math.max(0, Math.min(buffer.duration, offset));
    
    startTimeRef.current = audioCtx.currentTime - startOffset;
    source.start(0, startOffset);
    sourceNodeRef.current = source;
  };

  const togglePlay = () => {
    const audioCtx = audioCtxRef.current;
    const buffer = bufferRef.current;
    if (!audioCtx || !buffer) return;

    // Resume context if suspended (autoplay restriction)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    if (isPlaying) {
      // Pause
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
        } catch (e) {}
        sourceNodeRef.current = null;
      }
      pausedTimeRef.current = audioCtx.currentTime - startTimeRef.current;
      setIsPlaying(false);
      stopTimeUpdates();
      stopLiveAnalysis();
    } else {
      // Resume or Play from beginning if ended
      let resumeTime = pausedTimeRef.current;
      if (resumeTime >= buffer.duration) {
        resumeTime = 0;
      }
      startSourceNode(resumeTime);
      setIsPlaying(true);
      startTimeUpdates();
      startLiveAnalysis();
    }
  };

  const seekTo = (seconds: number) => {
    const audioCtx = audioCtxRef.current;
    const buffer = bufferRef.current;
    if (!audioCtx || !buffer) return;

    const targetTime = Math.max(0, Math.min(buffer.duration, seconds));
    setPlaybackTime(targetTime);

    if (isPlaying) {
      startSourceNode(targetTime);
    } else {
      pausedTimeRef.current = targetTime;
    }
  };

  const setVolume = (vol: number) => {
    const targetVolume = Math.max(0, Math.min(1, vol));
    setVolumeState(targetVolume);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = targetVolume;
    }
  };

  const toggleLoop = () => {
    const nextLoop = !isLooping;
    setIsLooping(nextLoop);
    if (sourceNodeRef.current) {
      sourceNodeRef.current.loop = nextLoop;
    }
  };

  // Timekeeper
  const startTimeUpdates = () => {
    stopTimeUpdates();
    timeUpdateTimerRef.current = window.setInterval(() => {
      const audioCtx = audioCtxRef.current;
      const buffer = bufferRef.current;
      if (!audioCtx || !buffer) return;

      const elapsed = audioCtx.currentTime - startTimeRef.current;
      if (isLooping) {
        setPlaybackTime(elapsed % buffer.duration);
      } else {
        setPlaybackTime(Math.min(buffer.duration, elapsed));
      }
    }, 100);
  };

  const stopTimeUpdates = () => {
    if (timeUpdateTimerRef.current) {
      clearInterval(timeUpdateTimerRef.current);
      timeUpdateTimerRef.current = null;
    }
  };

  // Real-time feature extractor (FFT analysis)
  const startLiveAnalysis = () => {
    stopLiveAnalysis();
    
    const analyser = analyserNodeRef.current;
    if (!analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const timeArray = new Uint8Array(bufferLength);

    analysisTimerRef.current = window.setInterval(() => {
      if (!analyser) return;
      
      analyser.getByteFrequencyData(dataArray);
      analyser.getByteTimeDomainData(timeArray);

      // Freq Bins: Low (Bass) -> High (Treble)
      // FFT size = 512, bin count = 256
      // For sampleRate=44100, bin spacing = 44100/512 = 86Hz
      // Bass: 20-250Hz -> Bins 0-3
      // Mid: 250-2000Hz -> Bins 3-23
      // Treble: 2000-20000Hz -> Bins 23-256

      let bassSum = 0;
      let midSum = 0;
      let trebleSum = 0;

      for (let i = 0; i < bufferLength; i++) {
        const val = dataArray[i] / 255.0; // scale to 0-1
        if (i <= 3) {
          bassSum += val;
        } else if (i <= 23) {
          midSum += val;
        } else {
          trebleSum += val;
        }
      }

      // Normalization
      const bassEnergy = Math.min(1, (bassSum / 4) * 1.5);
      const midEnergy = Math.min(1, (midSum / 20) * 1.8);
      const trebleEnergy = Math.min(1, (trebleSum / (bufferLength - 24)) * 2.2);
      const peakEnergy = Math.max(...Array.from(dataArray)) / 255.0;

      // Time Domain: RMS and Zero Crossing
      let sumSquared = 0;
      let zeroCrossings = 0;

      for (let i = 0; i < bufferLength; i++) {
        const val = (timeArray[i] - 128) / 128.0; // scale -1.0 to 1.0
        sumSquared += val * val;

        if (i > 0) {
          const prevVal = (timeArray[i - 1] - 128) / 128.0;
          if ((prevVal >= 0 && val < 0) || (prevVal < 0 && val >= 0)) {
            zeroCrossings++;
          }
        }
      }

      const rmsLoudness = Math.min(1, Math.sqrt(sumSquared / bufferLength) * 1.6);
      const zeroCrossingRate = Math.min(1, (zeroCrossings / bufferLength) * 2.5);

      const centroid = (midEnergy * 0.4 + trebleEnergy * 0.8) / (bassEnergy + midEnergy + trebleEnergy || 0.001);
      const spectralCentroid = Math.min(1, centroid);
      const spectralRolloff = Math.min(1, trebleEnergy * 1.5);
      const dynamicRange = Math.min(10, peakEnergy / (rmsLoudness || 0.001));

      setLiveFeatures({
        bassEnergy,
        midEnergy,
        trebleEnergy,
        peakEnergy,
        rmsLoudness,
        spectralCentroid,
        spectralRolloff,
        zeroCrossingRate,
        dynamicRange
      });

    }, 33); // ~30 FPS for active live stats tracking
  };

  const stopLiveAnalysis = () => {
    if (analysisTimerRef.current) {
      clearInterval(analysisTimerRef.current);
      analysisTimerRef.current = null;
    }
  };

  // Format Helper
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return {
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
    analyserNode: analyserNodeRef.current,
    loadAudioFile,
    togglePlay,
    toggleLoop,
    seekTo,
    setVolume,
    resetEngine
  };
}
