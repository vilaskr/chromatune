import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Copy, Check, Download, Code, Palette, Grid } from 'lucide-react';
import { ColorPalette, SongMetadata } from '../types';
import { exportToCSS, exportToTailwind, exportToASE } from '../utils/paletteGenerator';
import { downloadGradientPNG, downloadGradientSVG, downloadTextFile } from '../utils/exporter';

interface PaletteDisplayProps {
  palette: ColorPalette;
  metadata: SongMetadata;
}

export default function PaletteDisplay({ palette, metadata }: PaletteDisplayProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'css' | 'tailwind' | 'ase'>('css');

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const paletteSwatches = [
    { key: 'primary', label: 'Primary', hex: palette.primary, desc: 'Acoustic Dominant' },
    { key: 'secondary', label: 'Secondary', hex: palette.secondary, desc: 'Acoustic Analogous' },
    { key: 'accent', label: 'Accent', hex: palette.accent, desc: 'Spectral Vibrancy' },
    { key: 'highlight', label: 'Highlight', hex: palette.highlight, desc: 'Peak Treble Impulse' },
    { key: 'neutral', label: 'Neutral', hex: palette.neutral, desc: 'Text & Contrast' },
    { key: 'background', label: 'Background', hex: palette.background, desc: 'Base Atmosphere' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT SUB-PANEL: 6 Color Cards */}
      <div className="lg:col-span-7 flex flex-col space-y-4">
        <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
          <Palette className="h-4.5 w-4.5 text-purple-400" />
          <h3 className="text-base font-bold text-white">Analyzed Swatches</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {paletteSwatches.map((swatch, idx) => (
            <motion.div
              key={swatch.key}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              whileHover={{ y: -4 }}
              className="relative rounded-2xl border border-white/10 bg-black/40 p-3 flex flex-col space-y-3 group cursor-pointer"
              onClick={() => copyToClipboard(swatch.hex, swatch.key)}
            >
              {/* Swatch color block */}
              <div
                className="h-20 w-full rounded-xl border border-white/5 transition-all duration-300 relative overflow-hidden"
                style={{ backgroundColor: swatch.hex }}
              >
                {/* Subtle sheen */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0" />
                
                {/* Copy pill overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <div className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-black flex items-center space-x-1 shadow-md">
                    {copiedKey === swatch.key ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 text-black" />
                        <span>Copy Hex</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Labels */}
              <div>
                <h4 className="text-xs font-semibold text-white">{swatch.label}</h4>
                <p className="text-[10px] font-mono text-zinc-500 truncate uppercase mt-0.5">{swatch.hex}</p>
                <p className="text-[9px] text-zinc-400 mt-1 truncate font-light leading-none">{swatch.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* RIGHT SUB-PANEL: CSS Gradient & Developers exports */}
      <div className="lg:col-span-5 flex flex-col space-y-4">
        <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
          <Code className="h-4.5 w-4.5 text-cyan-400" />
          <h3 className="text-base font-bold text-white">Dynamic Gradient & Exports</h3>
        </div>

        {/* Gradient Display Box */}
        <div 
          className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-white/10 shadow-xl group"
          style={{
            background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary}, ${palette.accent})`
          }}
        >
          {/* Pulsing overlay mesh blob simulating ambient mesh gradients */}
          <div 
            className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full opacity-60 blur-2xl animate-pulse"
            style={{ backgroundColor: palette.highlight }}
          />
          <div 
            className="absolute -left-10 -top-10 h-32 w-32 rounded-full opacity-40 blur-2xl animate-pulse"
            style={{ backgroundColor: palette.primary }}
          />

          {/* Download and copy handles */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
            <span className="text-[10px] font-mono font-semibold text-white/60 tracking-wider">GENERATED ACCENT GRADIENT</span>
            
            <div className="flex items-center space-x-2 justify-end">
              <button
                onClick={() => copyToClipboard(`background: linear-gradient(135deg, ${palette.primary}, ${palette.secondary}, ${palette.accent});`, 'gradient-css')}
                className="rounded-lg bg-white/10 hover:bg-white/20 px-2.5 py-1.5 text-xs text-white font-medium flex items-center space-x-1 backdrop-blur-md transition-all active:scale-95"
              >
                {copiedKey === 'gradient-css' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy CSS</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => downloadGradientPNG(palette)}
                className="rounded-lg bg-white/10 hover:bg-white/20 px-2.5 py-1.5 text-xs text-white font-medium flex items-center space-x-1 backdrop-blur-md transition-all active:scale-95"
                title="Download 1920x1080 gradient PNG"
              >
                <Download className="h-3.5 w-3.5" />
                <span>PNG</span>
              </button>
              
              <button
                onClick={() => downloadGradientSVG(palette, metadata)}
                className="rounded-lg bg-white/10 hover:bg-white/20 px-2.5 py-1.5 text-xs text-white font-medium flex items-center space-x-1 backdrop-blur-md transition-all active:scale-95"
                title="Download vector SVG"
              >
                <Download className="h-3.5 w-3.5" />
                <span>SVG</span>
              </button>
            </div>
          </div>
        </div>

        {/* Developer Export Codes tabs */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
          <div className="flex space-x-2 border-b border-white/10 pb-2">
            {(['css', 'tailwind', 'ase'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded transition-all uppercase ${
                  activeTab === tab
                    ? 'bg-white/10 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tab === 'ase' ? 'Adobe ASE' : tab}
              </button>
            ))}
          </div>

          <div className="relative">
            <pre className="text-[10px] font-mono text-zinc-400 bg-[#09090b] rounded-lg p-3 max-h-[100px] overflow-y-auto border border-white/10">
              {activeTab === 'css' && exportToCSS(palette)}
              {activeTab === 'tailwind' && exportToTailwind(palette)}
              {activeTab === 'ase' && exportToASE(palette)}
            </pre>

            <button
              onClick={() => {
                let text = '';
                let file = 'chromatune-palette';
                let type = 'text/plain';

                if (activeTab === 'css') {
                  text = exportToCSS(palette);
                  file += '.css';
                } else if (activeTab === 'tailwind') {
                  text = exportToTailwind(palette);
                  file += '.json';
                } else {
                  text = exportToASE(palette);
                  file += '.ase.json';
                  type = 'application/json';
                }
                
                downloadTextFile(text, file, type);
              }}
              className="absolute right-2 bottom-2 p-1.5 rounded bg-white/10 text-zinc-400 hover:text-white transition-colors border border-white/10"
              title="Download File"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
