import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { BarChart2, Activity, Disc, Sparkles } from 'lucide-react';
import { VisualizerMode, ColorPalette } from '../types';

interface VisualizerProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
  palette: ColorPalette;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  alpha: number;
  color: string;
  binIndex: number;
  speedFactor: number;
}

export default function Visualizer({ analyserNode, isPlaying, palette }: VisualizerProps) {
  const [mode, setMode] = useState<VisualizerMode>('circle');
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef<VisualizerMode>(mode);
  const particlesRef = useRef<Particle[]>([]);

  // Keep modeRef in sync to avoid reloading animation frames on state change
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Handle Resize via ResizeObserver (Guideline requirement)
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Set up particles once
  useEffect(() => {
    const particles: Particle[] = [];
    const colors = [palette.primary, palette.secondary, palette.accent, palette.highlight];
    
    for (let i = 0; i < 120; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 1.5 + 0.5;
      particles.push({
        x: 400, // will be dynamically set to canvas center on first frame
        y: 200, // will be dynamically set to canvas center on first frame
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 2 + 1,
        baseRadius: Math.random() * 2 + 1,
        alpha: Math.random(),
        color: colors[Math.floor(Math.random() * colors.length)],
        binIndex: Math.floor(Math.random() * 128),
        speedFactor: Math.random() * 0.8 + 0.2
      });
    }
    particlesRef.current = particles;
  }, [palette]);

  // Visualizer Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let rotationAngle = 0;

    // Buffer arrays
    const bufferLength = analyserNode ? analyserNode.frequencyBinCount : 256;
    const freqData = new Uint8Array(bufferLength);
    const timeData = new Uint8Array(bufferLength);

    const draw = () => {
      const currentMode = modeRef.current;
      const width = canvas.width;
      const height = canvas.height;

      // Clear with soft trails for smooth motions (especially for wave & circle)
      if (currentMode === 'particles') {
        ctx.fillStyle = 'rgba(9, 9, 11, 0.2)'; // trail effect
      } else {
        ctx.fillStyle = '#09090b';
      }
      ctx.fillRect(0, 0, width, height);

      if (analyserNode) {
        analyserNode.getByteFrequencyData(freqData);
        analyserNode.getByteTimeDomainData(timeData);
      } else {
        // Fallback procedural visual data if paused or no audio
        for (let i = 0; i < bufferLength; i++) {
          freqData[i] = isPlaying ? Math.sin(i * 0.1 + Date.now() * 0.01) * 60 + 80 : 0;
          timeData[i] = 128 + (isPlaying ? Math.sin(i * 0.05 + Date.now() * 0.01) * 30 : 0);
        }
      }

      // Convert Hex to RGBA strings easily
      const hexToRgbaStr = (hex: string, alpha: number) => {
        const clean = hex.replace('#', '');
        const r = parseInt(clean.substring(0, 2), 16) || 0;
        const g = parseInt(clean.substring(2, 4), 16) || 0;
        const b = parseInt(clean.substring(4, 6), 16) || 0;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      };

      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      const renderWidth = width / window.devicePixelRatio;
      const renderHeight = height / window.devicePixelRatio;

      // Draw relative visualizers
      if (currentMode === 'bars') {
        // --- 1. FREQUENCY BARS ---
        // Logarithmic-like bin mapping to mimic professional octave band analyzers
        const barCount = 48; 
        const gap = 5;
        const barWidth = (renderWidth - (barCount - 1) * gap) / barCount;

        for (let i = 0; i < barCount; i++) {
          const percent = i / barCount;
          // Exponential curve maps low/mid indices more accurately than linear mapping
          const startBin = Math.floor(Math.pow(percent, 1.8) * (bufferLength * 0.85));
          const nextPercent = (i + 1) / barCount;
          const endBin = Math.max(startBin + 1, Math.floor(Math.pow(nextPercent, 1.8) * (bufferLength * 0.85)));
          
          let sum = 0;
          let count = 0;
          for (let b = startBin; b < endBin && b < bufferLength; b++) {
            sum += freqData[b];
            count++;
          }
          const val = (count > 0 ? sum / count : freqData[startBin]) / 255.0;
          const barHeight = Math.max(6, val * (renderHeight - 40));
          const x = i * (barWidth + gap);
          const y = renderHeight - barHeight;

          // Beautiful top-to-bottom color gradient
          const grad = ctx.createLinearGradient(x, y, x, renderHeight);
          grad.addColorStop(0, palette.highlight);
          grad.addColorStop(0.3, palette.accent);
          grad.addColorStop(0.6, palette.primary);
          grad.addColorStop(1, palette.secondary);

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [barWidth / 2, barWidth / 2, 0, 0]);
          ctx.fill();
        }

      } else if (currentMode === 'circle') {
        // --- 2. RADIAL SPECTRUM CIRCLE ---
        const centerX = renderWidth / 2;
        const centerY = renderHeight / 2;
        const baseRadius = Math.min(renderWidth, renderHeight) * 0.24;
        
        // Accumulate a bit of rotation
        if (isPlaying) {
          // React rotation speed to bass
          const bassVal = freqData[2] / 255.0;
          rotationAngle += 0.005 + bassVal * 0.015;
        }

        // Draw central ambient glow sphere
        const glow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius * 1.6);
        glow.addColorStop(0, hexToRgbaStr(palette.primary, 0.28));
        glow.addColorStop(0.5, hexToRgbaStr(palette.secondary, 0.12));
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * 1.6, 0, Math.PI * 2);
        ctx.fill();

        // Draw actual central ring
        ctx.strokeStyle = hexToRgbaStr(palette.highlight, 0.4);
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Symmetric mirrored mapping for balanced left/right pumping
        const maxPoints = 120;
        for (let i = 0; i < maxPoints; i++) {
          const halfIdx = i < maxPoints / 2 ? i : maxPoints - i;
          const percent = halfIdx / (maxPoints / 2);
          const rawIdx = Math.floor(Math.pow(percent, 1.5) * (bufferLength * 0.6));
          const val = freqData[Math.min(bufferLength - 1, rawIdx)] / 255.0;
          
          const angle = (i / maxPoints) * Math.PI * 2 + rotationAngle;
          const amplitude = Math.max(3, val * (baseRadius * 0.85));

          const startX = centerX + Math.cos(angle) * baseRadius;
          const startY = centerY + Math.sin(angle) * baseRadius;
          const endX = centerX + Math.cos(angle) * (baseRadius + amplitude);
          const endY = centerY + Math.sin(angle) * (baseRadius + amplitude);

          // Beautiful outer color fade
          const grad = ctx.createLinearGradient(startX, startY, endX, endY);
          grad.addColorStop(0, palette.primary);
          grad.addColorStop(0.5, palette.accent);
          grad.addColorStop(1, palette.highlight);

          ctx.strokeStyle = grad;
          ctx.lineWidth = (baseRadius * 2 * Math.PI) / maxPoints * 0.45;
          ctx.lineCap = 'round';
          
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }

      } else if (currentMode === 'wave') {
        // --- 3. TIME-DOMAIN OSCILLOSCOPE WAVE ---
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';

        // Trigger Sync Algorithm: locks starting phase at a zero-crossing point for a clean, stable static waveform display!
        let triggerOffset = 0;
        for (let i = 0; i < bufferLength / 2; i++) {
          if (timeData[i] < 128 && timeData[i + 1] >= 128) {
            triggerOffset = i;
            break;
          }
        }

        // Draw overlapping beautiful layers of stabilized waves
        const layers = [
          { color: palette.highlight, opacity: 1, offset: 0, ampMult: 0.9 },
          { color: palette.primary, opacity: 0.5, offset: 20, ampMult: 0.75 },
          { color: palette.accent, opacity: 0.35, offset: -20, ampMult: 0.6 }
        ];

        layers.forEach((layer) => {
          ctx.strokeStyle = hexToRgbaStr(layer.color, layer.opacity);
          ctx.beginPath();
          
          const sampleLength = Math.min(256, bufferLength - triggerOffset);
          const sliceWidth = renderWidth / (sampleLength - 1);
          let x = 0;

          for (let i = 0; i < sampleLength; i++) {
            const v = timeData[triggerOffset + i] / 128.0 - 1.0; // scale -1 to 1
            const waveY = (renderHeight / 2) + v * (renderHeight * 0.42) * layer.ampMult + Math.sin(i * 0.05 + layer.offset + Date.now() * 0.003) * (isPlaying ? 3 : 0);

            if (i === 0) {
              ctx.moveTo(x, waveY);
            } else {
              ctx.lineTo(x, waveY);
            }
            x += sliceWidth;
          }
          ctx.stroke();
        });

      } else if (currentMode === 'particles') {
        // --- 4. REACTIVE PARTICLES ---
        const particles = particlesRef.current;
        const centerX = renderWidth / 2;
        const centerY = renderHeight / 2;

        const bassVal = freqData[2] / 255.0;

        particles.forEach((p) => {
          // Initialize/Center if starting coordinates are dummy
          if (p.x === 400 && p.y === 200) {
            p.x = centerX;
            p.y = centerY;
          }

          // Fetch volume for this particle's specific mapped frequency bin
          const binVal = freqData[p.binIndex % bufferLength] / 255.0;
          
          // Erupt outward from center. Speed scales with frequency intensity and global bass kicks!
          const currentSpeed = (2.2 + binVal * 7.5 + bassVal * 11) * p.speedFactor;
          p.x += p.vx * currentSpeed * 0.15;
          p.y += p.vy * currentSpeed * 0.15;

          // React radius & glow to mapped bin intensity
          p.radius = p.baseRadius * (1 + binVal * 2.8);
          p.alpha = Math.min(1.0, Math.max(0.15, binVal * 1.5));

          // Draw the space particle
          ctx.fillStyle = hexToRgbaStr(p.color, p.alpha);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();

          // Reset particle to center with new random vectors once it leaves the boundaries
          const buffer = 40;
          if (p.x < -buffer || p.x > renderWidth + buffer || p.y < -buffer || p.y > renderHeight + buffer) {
            p.x = centerX;
            p.y = centerY;
            const newAngle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 1.6 + 0.4;
            p.vx = Math.cos(newAngle) * speed;
            p.vy = Math.sin(newAngle) * speed;
            p.alpha = 0;
          }
        });

        // Glowing Core representing an acoustic singularity
        const coreRadius = 16 + bassVal * 24;
        const coreGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreRadius * 2.2);
        coreGlow.addColorStop(0, hexToRgbaStr(palette.highlight, 0.4));
        coreGlow.addColorStop(0.4, hexToRgbaStr(palette.primary, 0.16));
        coreGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = coreGlow;
        ctx.beginPath();
        ctx.arc(centerX, centerY, coreRadius * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.scale(1 / window.devicePixelRatio, 1 / window.devicePixelRatio); // restore
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [analyserNode, palette, isPlaying]);

  const modes: { id: VisualizerMode; label: string; icon: React.ReactNode }[] = [
    { id: 'bars', label: 'Frequency Bars', icon: <BarChart2 className="h-4 w-4" /> },
    { id: 'circle', label: 'Circular Ring', icon: <Disc className="h-4 w-4" /> },
    { id: 'wave', label: 'Oscilloscope', icon: <Activity className="h-4 w-4" /> },
    { id: 'particles', label: 'Space Particles', icon: <Sparkles className="h-4 w-4" /> }
  ];

  return (
    <div className="flex flex-col space-y-4 rounded-3xl border border-white/10 bg-black/40 p-4 md:p-6 backdrop-blur-md shadow-2xl">
      
      {/* Tab selectors for modes */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <h3 className="text-sm font-semibold text-zinc-300 select-none">Live Hologram Renderer</h3>
        
        <div className="flex items-center space-x-1 rounded-full bg-white/5 p-1 border border-white/10">
          {modes.map((item) => (
            <button
              key={item.id}
              onClick={() => setMode(item.id)}
              className={`flex items-center space-x-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                mode === item.id
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Visualizer Canvas Container */}
      <div 
        ref={containerRef} 
        className="relative aspect-video w-full overflow-hidden rounded-2xl bg-[#09090b] border border-white/10 flex items-center justify-center min-h-[300px]"
      >
        <canvas ref={canvasRef} className="block w-full h-full" />
        
        {/* Subtle calibration visual grid */}
        <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 pointer-events-none opacity-[0.02] border border-white" />
      </div>
    </div>
  );
}
