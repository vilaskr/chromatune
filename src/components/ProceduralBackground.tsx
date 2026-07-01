import React, { useEffect, useRef } from 'react';
import { ColorPalette, LiveAcousticFeatures } from '../types';

interface BackgroundProps {
  palette: ColorPalette;
  features: LiveAcousticFeatures | null;
  isPlaying: boolean;
  theme: 'dark' | 'ambient';
}

export default function ProceduralBackground({ palette, features, isPlaying, theme }: BackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Create a cached hardware-accelerated offscreen noise canvas for dynamic film grain (lag-free!)
    const noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = 128;
    noiseCanvas.height = 128;
    const noiseCtx = noiseCanvas.getContext('2d');
    if (noiseCtx) {
      const noiseData = noiseCtx.createImageData(128, 128);
      const d = noiseData.data;
      for (let i = 0; i < d.length; i += 4) {
        const val = Math.floor(Math.random() * 255);
        d[i] = val;     // R
        d[i+1] = val;   // G
        d[i+2] = val;   // B
        d[i+3] = 15;    // Alpha (very low opacity)
      }
      noiseCtx.putImageData(noiseData, 0, 0);
    }

    // Particle/Blob state
    const blobs = [
      { x: width * 0.2, y: height * 0.3, vx: 0.2, vy: 0.15, radius: 250, targetRadius: 250, baseRadius: 250, color: 'primary' },
      { x: width * 0.8, y: height * 0.4, vx: -0.15, vy: 0.2, radius: 300, targetRadius: 300, baseRadius: 300, color: 'secondary' },
      { x: width * 0.4, y: height * 0.8, vx: 0.1, vy: -0.12, radius: 280, targetRadius: 280, baseRadius: 280, color: 'accent' },
      { x: width * 0.7, y: height * 0.7, vx: -0.12, vy: -0.1, radius: 220, targetRadius: 220, baseRadius: 220, color: 'highlight' }
    ];

    let t = 0;

    const render = () => {
      t += 0.005;

      // Clear background with rich colors
      if (theme === 'ambient' && features) {
        // Rich pulsing ambient background colored by the active primary palette
        const rgbBg = hexToRgb(palette.background || '#09090b');
        const rgbPrimary = hexToRgb(palette.primary);
        const pulse = features.rmsLoudness * 0.12; // Pulse opacity based on RMS loudness
        const r = Math.round(rgbBg.r * (1 - pulse) + rgbPrimary.r * pulse * 0.35);
        const g = Math.round(rgbBg.g * (1 - pulse) + rgbPrimary.g * pulse * 0.35);
        const b = Math.round(rgbBg.b * (1 - pulse) + rgbPrimary.b * pulse * 0.35);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      } else {
        ctx.fillStyle = '#09090b';
      }
      ctx.fillRect(0, 0, width, height);

      // Get reactive modifiers
      const bassMod = features ? features.bassEnergy * 1.5 : 0;
      const energyMod = features ? features.rmsLoudness * 1.2 : 0;
      const trebleMod = features ? features.trebleEnergy * 1.5 : 0;

      // Update and draw blobs
      blobs.forEach((blob) => {
        // Move blobs slowly
        const speedMultiplier = isPlaying ? 1 + energyMod * 4 : 1;
        blob.x += blob.vx * speedMultiplier;
        blob.y += blob.vy * speedMultiplier;

        // Bounce off walls
        if (blob.x < -100 || blob.x > width + 100) blob.vx *= -1;
        if (blob.y < -100 || blob.y > height + 100) blob.vy *= -1;

        // Dynamic reactive sizing
        let activeMod = energyMod;
        if (blob.color === 'primary') activeMod = bassMod;
        if (blob.color === 'highlight') activeMod = trebleMod;

        blob.targetRadius = blob.baseRadius * (1 + activeMod * 0.45);
        blob.radius += (blob.targetRadius - blob.radius) * 0.1;

        // Determine blob color
        let col = palette.primary;
        if (blob.color === 'secondary') col = palette.secondary;
        if (blob.color === 'accent') col = palette.accent;
        if (blob.color === 'highlight') col = palette.highlight;

        const rgb = hexToRgb(col);
        const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.radius);
        
        // Soft glowing radial falloffs
        const opacity = theme === 'ambient' ? 0.22 + energyMod * 0.15 : 0.12;
        gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity * 1.2})`);
        gradient.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity * 0.4})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Ambient Theme Reactive Grid or Lines
      if (theme === 'ambient' && features) {
        const rgbPrimary = hexToRgb(palette.primary);
        const rgbAccent = hexToRgb(palette.accent);
        
        ctx.strokeStyle = `rgba(${rgbPrimary.r}, ${rgbPrimary.g}, ${rgbPrimary.b}, 0.04)`;
        ctx.lineWidth = 1;
        const lineSpacing = 60;
        
        ctx.beginPath();
        // Horizontal lines reacting like a grid wave
        for (let y = 60; y < height - 60; y += lineSpacing) {
          ctx.moveTo(0, y);
          for (let x = 0; x <= width; x += 30) {
            const freqFactor = Math.sin(x * 0.005 + t * 2) * Math.cos(y * 0.002 + t);
            const waveHeight = (features.bassEnergy * 35 + features.rmsLoudness * 25);
            const offset = freqFactor * waveHeight;
            ctx.lineTo(x, y + offset);
          }
        }
        ctx.stroke();

        // Vertical lines reacting with treble energy
        ctx.strokeStyle = `rgba(${rgbAccent.r}, ${rgbAccent.g}, ${rgbAccent.b}, 0.025)`;
        ctx.beginPath();
        for (let x = 60; x < width - 60; x += lineSpacing) {
          ctx.moveTo(x, 0);
          for (let y = 0; y <= height; y += 30) {
            const freqFactor = Math.cos(y * 0.005 + t * 1.5) * Math.sin(x * 0.002 + t);
            const waveWidth = (features.trebleEnergy * 25 + features.rmsLoudness * 15);
            const offset = freqFactor * waveWidth;
            ctx.lineTo(x + offset, y);
          }
        }
        ctx.stroke();
      }

      // Hardware accelerated dynamic Analog Film Grain tiling (super smooth!)
      const pattern = ctx.createPattern(noiseCanvas, 'repeat');
      if (pattern) {
        ctx.save();
        ctx.translate(Math.random() * 128, Math.random() * 128);
        ctx.fillStyle = pattern;
        ctx.fillRect(-128, -128, width + 128, height + 128);
        ctx.restore();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [palette, features, isPlaying, theme]);

  // Hex helper to avoid importing issues
  const hexToRgb = (hex: string) => {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
    return { r, g, b };
  };

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none -z-10 transition-colors duration-1000"
    />
  );
}
