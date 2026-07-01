import React, { useState } from 'react';
import { Calendar, HelpCircle, Activity } from 'lucide-react';
import { TimelinePoint } from '../types';

interface ColorTimelineProps {
  timeline: TimelinePoint[];
  playbackTime: number;
  seekTo: (seconds: number) => void;
  duration: number;
}

export default function ColorTimeline({ timeline, playbackTime, seekTo, duration }: ColorTimelineProps) {
  const [hoveredPoint, setHoveredPoint] = useState<TimelinePoint | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredX, setHoveredX] = useState<number>(0);

  const formatTimestamp = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, point: TimelinePoint, index: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const timelineRect = e.currentTarget.parentElement?.getBoundingClientRect();
    
    if (timelineRect) {
      // Calculate local mouse position relative to timeline container
      const localX = (rect.left - timelineRect.left) + rect.width / 2;
      setHoveredX(localX);
    }
    
    setHoveredPoint(point);
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
    setHoveredIndex(null);
  };

  const handleSegmentClick = (point: TimelinePoint) => {
    seekTo(point.time);
  };

  // Determine which segment is currently playing
  const currentSegmentIndex = timeline.findIndex((point, idx) => {
    const nextPoint = timeline[idx + 1];
    if (nextPoint) {
      return playbackTime >= point.time && playbackTime < nextPoint.time;
    }
    return playbackTime >= point.time;
  });

  return (
    <div className="flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4.5 w-4.5 text-blue-400" />
          <h3 className="text-base font-bold text-white">Chromative Timeline</h3>
        </div>
        <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">
          Interactive Chronological Color progression
        </span>
      </div>

      <p className="text-xs text-zinc-400 font-light max-w-2xl">
        Hover over the timeline blocks to inspect timestamps and acoustic energy densities. 
        Click any segment block to automatically seek playback to that exact point in the song.
      </p>

      {/* Timeline Bar Container */}
      <div className="relative pt-8 pb-4 select-none">
        
        {/* Dynamic Interactive Floating Popover */}
        {hoveredPoint && hoveredIndex !== null && (
          <div
            className="absolute top-[-25px] transform -translate-x-1/2 rounded-xl bg-black border border-white/10 p-2 text-center text-xs font-mono shadow-xl z-10 transition-all duration-150 flex flex-col space-y-1"
            style={{ left: `${hoveredX}px` }}
          >
            <div className="flex items-center justify-between space-x-4">
              <span className="text-emerald-400 font-bold">{formatTimestamp(hoveredPoint.time)}</span>
              <span className="text-zinc-500 text-[9px]">SEG {hoveredIndex + 1}</span>
            </div>
            
            <div className="flex items-center space-x-2 text-[9px] text-zinc-400">
              <span style={{ color: hoveredPoint.color }}>■</span>
              <span>B: {Math.round(hoveredPoint.features.bass * 100)}%</span>
              <span>M: {Math.round(hoveredPoint.features.mid * 100)}%</span>
              <span>T: {Math.round(hoveredPoint.features.treble * 100)}%</span>
            </div>
          </div>
        )}

        {/* Timeline Tracks Grid */}
        <div className="flex w-full items-center h-12 gap-[3px] rounded-2xl overflow-hidden bg-white/5 p-1.5 border border-white/10">
          {timeline.map((point, idx) => {
            const isCurrent = idx === currentSegmentIndex;
            
            return (
              <div
                key={idx}
                onMouseMove={(e) => handleMouseMove(e, point, idx)}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleSegmentClick(point)}
                className="flex-1 h-full cursor-pointer rounded-md transition-all duration-200 relative overflow-hidden"
                style={{
                  backgroundColor: point.color,
                  opacity: isCurrent ? 1.0 : 0.6,
                  transform: isCurrent ? 'scaleY(1.08)' : 'scaleY(1)',
                  boxShadow: isCurrent ? `0 0 12px ${point.color}` : 'none'
                }}
              >
                {/* Visual cursor sheen if active */}
                {isCurrent && (
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                )}
              </div>
            );
          })}
        </div>

        {/* Sub-labels representing seconds */}
        <div className="flex justify-between text-[9px] font-mono text-zinc-500 px-1 pt-1.5">
          <span>0:00</span>
          <span>{formatTimestamp(duration * 0.25)}</span>
          <span>{formatTimestamp(duration * 0.5)}</span>
          <span>{formatTimestamp(duration * 0.75)}</span>
          <span>{formatTimestamp(duration)}</span>
        </div>

      </div>
    </div>
  );
}
