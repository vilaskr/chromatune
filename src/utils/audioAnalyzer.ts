import { FullSongStats, LiveAcousticFeatures, TimelinePoint, SongMetadata } from '../types';
import { generatePaletteFromFeatures } from './paletteGenerator';

/**
 * Applies a Hann window to reduce spectral leakage in DFT
 */
function applyHannWindow(samples: Float32Array): Float32Array {
  const N = samples.length;
  const windowed = new Float32Array(N);
  for (let n = 0; n < N; n++) {
    const w = 0.5 * (1 - Math.cos((2 * Math.PI * n) / (N - 1)));
    windowed[n] = samples[n] * w;
  }
  return windowed;
}

/**
 * Simple, fast Discrete Fourier Transform (DFT) for a real-valued signal
 * Returns the magnitude spectrum for the first N/2 bins
 */
function computeDFT(samples: Float32Array): Float32Array {
  const N = samples.length;
  const numBins = Math.floor(N / 2);
  const magnitudes = new Float32Array(numBins);
  
  const windowed = applyHannWindow(samples);

  for (let k = 0; k < numBins; k++) {
    let real = 0;
    let imag = 0;
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N;
      real += windowed[n] * Math.cos(angle);
      imag -= windowed[n] * Math.sin(angle);
    }
    // Compute magnitude and normalize by N
    magnitudes[k] = Math.sqrt(real * real + imag * imag) / N;
  }
  return magnitudes;
}

/**
 * Format file size helper
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Analyze an AudioBuffer to extract FullSongStats and TimelinePoints
 */
export function analyzeAudioBuffer(
  buffer: AudioBuffer,
  fileSize: string,
  fileName: string
): {
  metadata: SongMetadata;
  stats: FullSongStats;
  timeline: TimelinePoint[];
  acousticFeatures: LiveAcousticFeatures;
} {
  const sampleRate = buffer.sampleRate;
  const duration = buffer.duration;
  const channelData = buffer.getChannelData(0); // Analyze left channel for speed
  const totalSamples = channelData.length;

  // 1. CHRONOLOGICAL TIMELINE ANALYSIS
  // We want to slice the song into 60 segments to build a beautiful timeline
  const numTimelineSegments = 60;
  const segmentLength = Math.floor(totalSamples / numTimelineSegments);
  const timeline: TimelinePoint[] = [];

  let accumulatedBass = 0;
  let accumulatedMid = 0;
  let accumulatedTreble = 0;
  let accumulatedRMS = 0;
  let accumulatedZCR = 0;
  let maxPeak = 0;

  for (let i = 0; i < numTimelineSegments; i++) {
    const startSample = i * segmentLength;
    const timeInSeconds = (startSample / sampleRate);

    // We take a window of 512 samples in the middle of each segment to perform high-resolution DFT
    const dftWindowSize = 512;
    const dftStart = startSample + Math.floor((segmentLength - dftWindowSize) / 2);
    const dftSamples = new Float32Array(dftWindowSize);
    
    // Copy samples, handling bounds safely
    for (let s = 0; s < dftWindowSize; s++) {
      const idx = dftStart + s;
      dftSamples[s] = idx < totalSamples ? channelData[idx] : 0;
    }

    // Compute DFT magnitudes
    const dftMagnitudes = computeDFT(dftSamples);
    const numBins = dftMagnitudes.length;

    // Divide frequency spectrum (assuming standard audio, e.g., Nyquist = sampleRate / 2)
    // index in bins corresponds to frequency: freq = binIdx * (sampleRate / dftWindowSize)
    // For sampleRate = 44100, each bin is approx 44100 / 512 = 86.1 Hz
    // Bass: 20Hz - 250Hz -> Bins 0 to 3
    // Mids: 250Hz - 2000Hz -> Bins 3 to 23
    // Treble: 2000Hz - 20000Hz -> Bins 23 to numBins

    let bassEnergy = 0;
    let midEnergy = 0;
    let trebleEnergy = 0;

    for (let b = 0; b < numBins; b++) {
      const mag = dftMagnitudes[b];
      if (b <= 3) {
        bassEnergy += mag;
      } else if (b <= 23) {
        midEnergy += mag;
      } else {
        trebleEnergy += mag;
      }
    }

    // Boost ranges for visualization normalization
    bassEnergy = Math.min(1, bassEnergy * 4.0);
    midEnergy = Math.min(1, midEnergy * 6.0);
    trebleEnergy = Math.min(1, trebleEnergy * 8.0);

    // Compute RMS and ZCR over the entire segment for better stability
    let sumSquared = 0;
    let zeroCrossings = 0;
    let localPeak = 0;
    
    // Sub-sample the segment to stay extremely fast
    const subSampleStep = Math.max(1, Math.floor(segmentLength / 1000));
    let samplesCounted = 0;

    for (let s = 0; s < segmentLength; s += subSampleStep) {
      const idx = startSample + s;
      if (idx >= totalSamples) break;
      const val = channelData[idx];
      
      sumSquared += val * val;
      localPeak = Math.max(localPeak, Math.abs(val));

      if (idx > 0 && ((channelData[idx - 1] >= 0 && val < 0) || (channelData[idx - 1] < 0 && val >= 0))) {
        zeroCrossings++;
      }
      samplesCounted++;
    }

    const rms = Math.min(1, Math.sqrt(sumSquared / (samplesCounted || 1)) * 1.5);
    const zcr = Math.min(1, zeroCrossings / (samplesCounted || 1) * 10); // scale factor for visualizer
    const energy = Math.min(1, (bassEnergy * 0.4 + midEnergy * 0.4 + trebleEnergy * 0.2) * (1 + rms));

    // Accumulate total statistics
    accumulatedBass += bassEnergy;
    accumulatedMid += midEnergy;
    accumulatedTreble += trebleEnergy;
    accumulatedRMS += rms;
    accumulatedZCR += zcr;
    maxPeak = Math.max(maxPeak, localPeak);

    // Generate color palette for this segment to get the timeline color
    const segmentFeatures: LiveAcousticFeatures = {
      bassEnergy,
      midEnergy,
      trebleEnergy,
      peakEnergy: localPeak,
      rmsLoudness: rms,
      spectralCentroid: (midEnergy * 0.5 + trebleEnergy * 0.8) / (bassEnergy + midEnergy + trebleEnergy || 1),
      spectralRolloff: trebleEnergy * 1.2,
      zeroCrossingRate: zcr,
      dynamicRange: localPeak / (rms || 0.001)
    };

    const palette = generatePaletteFromFeatures(segmentFeatures, false);

    timeline.push({
      time: parseFloat(timeInSeconds.toFixed(1)),
      color: palette.primary,
      features: {
        bass: parseFloat(bassEnergy.toFixed(2)),
        mid: parseFloat(midEnergy.toFixed(2)),
        treble: parseFloat(trebleEnergy.toFixed(2)),
        energy: parseFloat(energy.toFixed(2))
      }
    });
  }

  // 2. AGGREGATE SUMMARY ACOUSTIC METRICS
  const avgBass = accumulatedBass / numTimelineSegments;
  const avgMid = accumulatedMid / numTimelineSegments;
  const avgTreble = accumulatedTreble / numTimelineSegments;
  const avgRMS = accumulatedRMS / numTimelineSegments;
  const avgZCR = accumulatedZCR / numTimelineSegments;

  const summaryFeatures: LiveAcousticFeatures = {
    bassEnergy: Math.min(1, avgBass * 1.2),
    midEnergy: Math.min(1, avgMid * 1.2),
    trebleEnergy: Math.min(1, avgTreble * 1.2),
    peakEnergy: Math.min(1, maxPeak),
    rmsLoudness: Math.min(1, avgRMS),
    spectralCentroid: Math.min(1, (avgMid * 0.4 + avgTreble * 0.8) / (avgBass + avgMid + avgTreble || 1)),
    spectralRolloff: Math.min(1, avgTreble * 1.4),
    zeroCrossingRate: Math.min(1, avgZCR),
    dynamicRange: Math.min(10, maxPeak / (avgRMS || 0.001))
  };

  // 3. TEMPO (BPM) DETECTION ALGORITHM (Acoustic peak interval histogram)
  // Extract energy envelope of the song downsampled to 100Hz (10ms steps)
  const intervalMs = 10;
  const samplesPerStep = Math.floor(sampleRate * (intervalMs / 1000));
  const envelope: number[] = [];
  
  // Scans up to 120 seconds max to preserve high performance
  const scanLimitSamples = Math.min(totalSamples, sampleRate * 120);

  for (let s = 0; s < scanLimitSamples; s += samplesPerStep) {
    let sumSq = 0;
    const count = Math.min(samplesPerStep, totalSamples - s);
    for (let j = 0; j < count; j++) {
      const v = channelData[s + j];
      sumSq += v * v;
    }
    envelope.push(Math.sqrt(sumSq / (count || 1)));
  }

  // Find energy onsets (peaks) above running average
  const thresholdFactor = 1.25;
  const peakIndices: number[] = [];
  const runningWindowSize = 15; // ~150ms

  for (let i = runningWindowSize; i < envelope.length - runningWindowSize; i++) {
    const currentVal = envelope[i];
    
    // Compute local average
    let localSum = 0;
    for (let j = -runningWindowSize; j <= runningWindowSize; j++) {
      localSum += envelope[i + j];
    }
    const localAvg = localSum / (runningWindowSize * 2 + 1);

    // Is it a local maximum and above threshold?
    if (currentVal > localAvg * thresholdFactor && currentVal > envelope[i - 1] && currentVal > envelope[i + 1]) {
      peakIndices.push(i);
    }
  }

  // Calculate beat intervals (delays in ms) and cluster them into BPM bins
  const bpmHistogram: Record<number, number> = {};
  
  for (let p = 0; p < peakIndices.length - 1; p++) {
    for (let next = p + 1; next < Math.min(p + 5, peakIndices.length); next++) {
      const gapSteps = peakIndices[next] - peakIndices[p];
      const gapMs = gapSteps * intervalMs;
      
      // Map gap to BPM: bpm = 60000 / gapMs
      const rawBpm = 60000 / gapMs;
      
      // Let's filter BPM into reasonable range (60 - 180)
      if (rawBpm >= 60 && rawBpm <= 180) {
        const roundedBpm = Math.round(rawBpm);
        bpmHistogram[roundedBpm] = (bpmHistogram[roundedBpm] || 0) + (5 - (next - p)); // weight closer peaks heavier
      }
    }
  }

  // Find most prominent BPM
  let estimatedBpm = 120; // Default placeholder fallback
  let maxWeight = 0;
  
  // Simple smoothing over neighboring BPMs
  Object.keys(bpmHistogram).forEach((bpmStr) => {
    const bpm = parseInt(bpmStr);
    let smoothedWeight = 0;
    for (let offset = -2; offset <= 2; offset++) {
      smoothedWeight += bpmHistogram[bpm + offset] || 0;
    }
    if (smoothedWeight > maxWeight) {
      maxWeight = smoothedWeight;
      estimatedBpm = bpm;
    }
  });

  // Safe bounds or default procedural BPM if not enough beats detected
  if (maxWeight < 5) {
    // Generate a beautiful procedural BPM based on energy
    estimatedBpm = Math.round(75 + (summaryFeatures.midEnergy * 45) + (summaryFeatures.bassEnergy * 30));
  }

  // 4. FULL SONG METRICS ESTIMATION
  const energyLevel = Math.round(summaryFeatures.rmsLoudness * 50 + summaryFeatures.bassEnergy * 30 + summaryFeatures.trebleEnergy * 20);
  const brightness = Math.round(summaryFeatures.spectralCentroid * 60 + summaryFeatures.zeroCrossingRate * 40);
  const warmth = Math.round(summaryFeatures.bassEnergy * 70 + (1 - summaryFeatures.spectralCentroid) * 30);
  
  // Danceability correlates to low-mid rhythmic consistency, tempo stability, and bass presence
  const danceability = Math.round(
    Math.min(100, (estimatedBpm > 105 && estimatedBpm < 145 ? 35 : 15) + summaryFeatures.bassEnergy * 45 + summaryFeatures.rmsLoudness * 20)
  );
  
  const valence = Math.round(
    Math.min(100, summaryFeatures.midEnergy * 40 + (1 - summaryFeatures.zeroCrossingRate) * 30 + avgRMS * 30)
  );
  
  const acousticness = Math.round(
    Math.min(100, (1 - summaryFeatures.rmsLoudness) * 60 + (1 - summaryFeatures.bassEnergy) * 40)
  );

  // Determine estimated mood
  let mood = 'Balanced & Melodic';
  if (energyLevel > 75 && valence > 60) {
    mood = 'Energetic & Vibrant';
  } else if (energyLevel > 70 && valence <= 60) {
    mood = 'Intense & Powerful';
  } else if (energyLevel < 40 && valence > 65) {
    mood = 'Serene & Uplifting';
  } else if (energyLevel < 35 && valence <= 45) {
    mood = 'Mellow & Melancholic';
  } else if (danceability > 75) {
    mood = 'Groovy & Dynamic';
  } else if (brightness > 75) {
    mood = 'Crisp & Ethereal';
  } else if (warmth > 75) {
    mood = 'Deep & Warm';
  } else if (energyLevel < 30) {
    mood = 'Ambient & Cinematic';
  }

  const stats: FullSongStats = {
    tempoBpm: estimatedBpm,
    mood,
    energyLevel,
    brightness,
    warmth,
    danceability,
    acousticness,
    valence
  };

  // 5. EXTRACT METADATA
  // Parse clean song name & artist from file name: e.g., "Daft Punk - One More Time.mp3"
  let parsedTitle = fileName.replace(/\.[^/.]+$/, ""); // Strip extension
  let parsedArtist = 'Unknown Artist';
  let parsedAlbum = 'Single';

  if (parsedTitle.includes(' - ')) {
    const parts = parsedTitle.split(' - ');
    parsedArtist = parts[0].trim();
    parsedTitle = parts[1].trim();
  }

  const metadata: SongMetadata = {
    name: parsedTitle,
    artist: parsedArtist,
    album: parsedAlbum,
    duration,
    size: fileSize,
    type: 'audio/mpeg'
  };

  return {
    metadata,
    stats,
    timeline,
    acousticFeatures: summaryFeatures
  };
}
