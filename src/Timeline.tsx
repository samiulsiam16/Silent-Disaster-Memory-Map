import { motion } from 'motion/react';
import { Calendar } from 'lucide-react';

export function Timeline({ currentYear, onYearChange }: { 
  currentYear: number; 
  onYearChange: (year: number) => void;
}) {
  const startYear = 1800;
  const endYear = 2026;
  
  return (
    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-30 w-full max-w-3xl px-8">
      <div className="p-6 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-6 shadow-[0_0_30px_rgba(0,150,255,0.1)]">
        <div className="flex items-center gap-3 text-blue-400">
          <Calendar size={18} />
          <span className="text-lg font-mono font-medium w-16">{currentYear}</span>
        </div>
        
        <div className="flex-1 relative group">
          <input 
            type="range" 
            min={startYear} 
            max={endYear} 
            value={currentYear} 
            onChange={(e) => onYearChange(parseInt(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
          />
          
          {/* Year Markers */}
          <div className="absolute -bottom-6 left-0 w-full flex justify-between px-1 pointer-events-none">
            {[1800, 1850, 1900, 1950, 2000, 2026].map(year => (
              <span key={year} className="text-[8px] uppercase tracking-widest text-zinc-600 font-mono">
                {year}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${currentYear < 1900 ? 'bg-zinc-500 grayscale' : 'bg-blue-500'} animate-pulse`} />
          <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 font-mono">
            {currentYear < 1900 ? 'Historical Archive' : 'Modern Record'}
          </span>
        </div>
      </div>
    </div>
  );
}
