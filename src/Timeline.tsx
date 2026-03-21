import { motion } from 'motion/react';

export function Timeline({ currentYear, onYearChange }: { 
  currentYear: number; 
  onYearChange: (year: number) => void 
}) {
  const years = Array.from({ length: 11 }, (_, i) => 1900 + i * 15);

  return (
    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 w-full max-w-3xl px-6 z-30">
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-full p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-blue-500/5 pointer-events-none" />
        
        <div className="flex justify-between mb-4 px-2">
          {years.map((year) => (
            <div key={year} className="flex flex-col items-center">
              <div className={`w-px h-2 ${year === currentYear ? 'bg-blue-400' : 'bg-zinc-700'}`} />
              <span className={`text-[8px] mt-1 tracking-tighter ${year === currentYear ? 'text-blue-400' : 'text-zinc-600'}`}>
                {year}
              </span>
            </div>
          ))}
        </div>

        <input
          type="range"
          min="1900"
          max="2050"
          value={currentYear}
          onChange={(e) => onYearChange(parseInt(e.target.value))}
          className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />

        <div className="mt-4 flex justify-center">
          <div className="px-4 py-1 bg-white/5 rounded-full border border-white/10">
            <span className="text-xs font-mono text-blue-400 tracking-widest">
              TEMPORAL FOCUS: {currentYear}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
