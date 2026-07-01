import React from 'react';
import { motion } from 'motion/react';
import { Monitor, Tablet, Smartphone, Download, Layers } from 'lucide-react';
import { ColorPalette, SongMetadata } from '../types';
import { downloadWallpaperDesktop, downloadWallpaperPhone, downloadWallpaperTablet } from '../utils/exporter';

interface WallpaperGeneratorProps {
  palette: ColorPalette;
  metadata: SongMetadata;
}

export default function WallpaperGenerator({ palette, metadata }: WallpaperGeneratorProps) {
  const gradientStyle = {
    background: `radial-gradient(circle at 30% 30%, ${palette.primary}ee, transparent 60%), 
                 radial-gradient(circle at 80% 40%, ${palette.secondary}ee, transparent 60%), 
                 radial-gradient(circle at 40% 80%, ${palette.accent}ee, transparent 60%), 
                 radial-gradient(circle at 80% 80%, ${palette.highlight}dd, transparent 60%), 
                 ${palette.background}`
  };

  return (
    <div className="flex flex-col space-y-6">
      
      {/* Tab/Panel Header */}
      <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
        <Layers className="h-4.5 w-4.5 text-rose-400" />
        <h3 className="text-base font-bold text-white">System Wallpapers</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* DESKTOP DEVICE CARD */}
        <div className="rounded-2xl border border-white/10 bg-black/40 p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-xs text-zinc-300 font-medium">
              <Monitor className="h-4 w-4 text-cyan-400" />
              <span>Desktop (2560 x 1440)</span>
            </span>
            <button
              onClick={() => downloadWallpaperDesktop(palette, metadata)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-all duration-200 active:scale-95"
              title="Download Desktop PNG"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Device Mock Frame */}
          <div className="aspect-[16/10] w-full bg-black rounded-xl border border-white/10 p-1 overflow-hidden relative group">
            <div 
              className="w-full h-full rounded-lg relative overflow-hidden flex items-end justify-center pb-2 select-none"
              style={gradientStyle}
            >
              {/* Wallpaper overlay content inside desktop mock */}
              <div className="text-[6px] text-white/30 font-sans tracking-widest uppercase">
                {metadata.name} // CHROMA
              </div>
            </div>
          </div>
          
          <button
            onClick={() => downloadWallpaperDesktop(palette, metadata)}
            className="w-full py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-xl border border-white/10 transition-colors"
          >
            Export Desktop Wallpaper
          </button>
        </div>

        {/* PHONE DEVICE CARD */}
        <div className="rounded-2xl border border-white/10 bg-black/40 p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-xs text-zinc-300 font-medium">
              <Smartphone className="h-4 w-4 text-red-400" />
              <span>Mobile Phone (1440 x 3120)</span>
            </span>
            <button
              onClick={() => downloadWallpaperPhone(palette, metadata)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-all duration-200 active:scale-95"
              title="Download Mobile Phone PNG"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Device Mock Frame */}
          <div className="aspect-[9/16] w-28 mx-auto bg-black rounded-2xl border border-white/10 p-1 overflow-hidden relative group">
            <div 
              className="w-full h-full rounded-xl relative overflow-hidden flex items-end justify-center pb-3 select-none"
              style={gradientStyle}
            >
              {/* Wallpaper overlay content inside mobile mock */}
              <div className="text-[5px] text-white/30 font-sans font-light text-center leading-none tracking-widest uppercase truncate max-w-[80px]">
                {metadata.name}
              </div>
            </div>
          </div>
          
          <button
            onClick={() => downloadWallpaperPhone(palette, metadata)}
            className="w-full py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-xl border border-white/10 transition-colors"
          >
            Export Mobile Wallpaper
          </button>
        </div>

        {/* TABLET DEVICE CARD */}
        <div className="rounded-2xl border border-white/10 bg-black/40 p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-xs text-zinc-300 font-medium">
              <Tablet className="h-4 w-4 text-purple-400" />
              <span>Tablet / iPad (2048 x 1536)</span>
            </span>
            <button
              onClick={() => downloadWallpaperTablet(palette, metadata)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-all duration-200 active:scale-95"
              title="Download Tablet PNG"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Device Mock Frame */}
          <div className="aspect-[4/3] w-full bg-black rounded-xl border border-white/10 p-1 overflow-hidden relative group">
            <div 
              className="w-full h-full rounded-lg relative overflow-hidden flex items-end justify-center pb-2 select-none"
              style={gradientStyle}
            >
              <div className="text-[6px] text-white/30 font-sans tracking-widest uppercase">
                {metadata.name} // CHROMA
              </div>
            </div>
          </div>
          
          <button
            onClick={() => downloadWallpaperTablet(palette, metadata)}
            className="w-full py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-xl border border-white/10 transition-colors"
          >
            Export Tablet Wallpaper
          </button>
        </div>

      </div>

    </div>
  );
}
