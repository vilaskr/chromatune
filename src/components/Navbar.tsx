import React from 'react';
import { Music, Sun, Moon, Sparkles, Github } from 'lucide-react';
import { AppTheme } from '../types';

interface NavbarProps {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  palettePrimary: string;
}

export default function Navbar({ theme, setTheme, palettePrimary }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/40 backdrop-blur-xl transition-colors duration-500">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3 select-none group">
          <div 
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr transition-all duration-500 group-hover:scale-105 shadow-lg"
            style={{
              backgroundImage: `linear-gradient(135deg, ${palettePrimary || '#6366f1'}, #ec4899)`,
              boxShadow: `0 0 20px -3px ${palettePrimary || '#6366f1'}66`
            }}
          >
            <Music className="h-5 w-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="font-sans text-lg font-bold tracking-tight text-white flex items-center">
              Chroma<span className="font-light text-zinc-400">Tune</span>
            </h1>
            <p className="text-[9px] font-mono text-zinc-500 tracking-wider">AUDIO SPECTRAL COLOR ENGINE</p>
          </div>
        </div>

        {/* Theme select & Links */}
        <div className="flex items-center space-x-4">
          {/* Custom Theme Selector segment */}
          <div className="flex items-center rounded-full bg-white/5 p-1 border border-white/10">
            <button
              onClick={() => setTheme('dark')}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
                theme === 'dark' 
                  ? 'bg-white/10 text-white shadow-sm' 
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Dark Mode"
            >
              <Moon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setTheme('ambient')}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
                theme === 'ambient' 
                  ? 'bg-white/10 text-white shadow-sm' 
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Reactive Ambient Mode"
            >
              <Sparkles className="h-4 w-4" />
            </button>
          </div>

          {/* GitHub button */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center justify-center rounded-full bg-white/5 p-2 text-zinc-400 border border-white/10 transition-all duration-200 hover:bg-white/10 hover:text-white sm:flex"
            title="View Code on GitHub"
          >
            <Github className="h-4 w-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
