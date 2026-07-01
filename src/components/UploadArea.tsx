import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { UploadCloud, Music, FileAudio, AlertCircle } from 'lucide-react';

interface UploadAreaProps {
  onFileSelect: (file: File) => void;
  palettePrimary: string;
}

export default function UploadArea({ onFileSelect, palettePrimary }: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedFormats = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/flac', 'audio/ogg', 'audio/aac', 'audio/m4a', 'audio/x-m4a', 'audio/mp4'];
  const extensions = ['.mp3', '.wav', '.flac', '.ogg', '.aac', '.m4a'];

  const validateFile = (file: File): boolean => {
    setError(null);
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    
    const isValidType = supportedFormats.includes(file.type);
    const isValidExt = extensions.includes(fileExt);

    if (isValidType || isValidExt) {
      return true;
    }
    
    setError(`Unsupported format. Please upload one of: ${extensions.join(', ').toUpperCase()}`);
    return false;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center px-4 max-w-4xl mx-auto animate-fade-in">
      {/* Intro Hero Typography */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-4 mb-10 md:mb-14"
      >
        <div className="inline-flex items-center space-x-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs font-mono text-emerald-400 font-medium tracking-wider">100% CLIENT-SIDE ANALYSIS</span>
        </div>
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold font-sans tracking-tight leading-none text-white max-w-3xl">
          Convert Your Music <br className="hidden sm:inline" />
          Into Dynamic <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-rose-400 animate-gradient">Color Signatures</span>.
        </h2>
        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed">
          Upload an audio file. ChromaTune decodes, processes, and extracts frequency-energy patterns locally using Web Audio DSP to generate custom palettes, gradients, posters, wallpapers, and organic timeline DNA.
        </p>
      </motion.div>

      {/* Upload Zone Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`relative w-full max-w-2xl overflow-hidden rounded-3xl border p-10 md:p-14 cursor-pointer select-none transition-all duration-300 ${
          isDragging 
            ? 'border-transparent bg-white/10 shadow-2xl scale-[1.01]' 
            : 'border-white/10 bg-black/40 hover:bg-white/5'
        }`}
        style={{
          boxShadow: isDragging 
            ? `0 20px 80px -20px ${palettePrimary || '#6366f1'}40, inset 0 0 0 2px ${palettePrimary || '#6366f1'}` 
            : '0 8px 32px -10px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Decorative ambient background glow inside upload box */}
        <div 
          className="absolute -right-24 -top-24 h-48 w-48 rounded-full opacity-10 blur-3xl transition-colors duration-1000 pointer-events-none"
          style={{ backgroundColor: palettePrimary || '#6366f1' }}
        />
        <div 
          className="absolute -left-24 -bottom-24 h-48 w-48 rounded-full opacity-10 blur-3xl transition-colors duration-1000 pointer-events-none"
          style={{ backgroundColor: '#ec4899' }}
        />

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={extensions.join(',')}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-6">
          <div 
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white shadow-inner transition-all duration-300 group-hover:scale-105"
            style={{
              borderColor: isDragging ? `${palettePrimary}60` : 'rgba(255, 255, 255, 0.1)'
            }}
          >
            {isDragging ? (
              <FileAudio className="h-8 w-8 text-white animate-bounce" />
            ) : (
              <UploadCloud className="h-8 w-8 text-white/80" />
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium text-white">
              {isDragging ? 'Drop your audio file here' : 'Drag & drop your audio file'}
            </h3>
            <p className="text-sm text-zinc-400 font-light">
              or <span className="text-white hover:underline font-normal">browse directories</span> on your device
            </p>
          </div>

          <button 
            type="button" 
            className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 animate-fade-in"
          >
            Select Audio File
          </button>

          <div className="flex flex-col items-center justify-center space-y-1.5 pt-4 border-t border-white/10 w-full">
            <p className="text-xs font-mono text-zinc-500 tracking-wider">SUPPORTED FORMATS</p>
            <div className="flex flex-wrap justify-center gap-2">
              {extensions.map((ext) => (
                <span 
                  key={ext}
                  className="rounded px-2 py-0.5 text-[10px] font-mono font-medium border border-white/10 bg-white/5 text-zinc-400"
                >
                  {ext.slice(1).toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex items-center space-x-2 rounded-2xl border border-rose-500/10 bg-rose-500/5 px-4 py-3 text-sm text-rose-400 text-left max-w-md"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}
    </div>
  );
}
