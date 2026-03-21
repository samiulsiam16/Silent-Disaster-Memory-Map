import { motion } from 'motion/react';
import { X, MapPin, Calendar, Info, Quote, BookOpen, AlertCircle, Headphones } from 'lucide-react';
import { Disaster, DisasterCategory } from './types';
import Markdown from 'react-markdown';

const CATEGORY_LABELS: Record<DisasterCategory, string> = {
  flood: 'Hydrological Event',
  famine: 'Food Insecurity',
  epidemic: 'Biological Crisis',
  conflict: 'Humanitarian Fracture',
  environmental: 'Ecological Collapse',
};

const CREDIBILITY_COLORS = {
  verified: 'text-emerald-400 bg-emerald-400/10',
  historian: 'text-blue-400 bg-blue-400/10',
  oral: 'text-amber-400 bg-amber-400/10',
  unverified: 'text-zinc-400 bg-zinc-400/10',
};

export function InfoPanel({ disaster, onClose }: { disaster: Disaster; onClose: () => void }) {
  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="fixed right-6 top-6 bottom-6 w-full max-w-md bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden flex flex-col z-40 shadow-2xl"
    >
      <div className="p-6 flex justify-between items-start">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1 block">
            {CATEGORY_LABELS[disaster.category]}
          </span>
          <h2 className="text-2xl font-serif italic text-white leading-tight">
            {disaster.title}
          </h2>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-8 custom-scrollbar">
        {/* Meta Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
            <MapPin size={16} className="text-zinc-500" />
            <div className="text-xs">
              <div className="text-zinc-500 uppercase tracking-tighter text-[9px]">Location</div>
              <div className="text-white font-medium">{disaster.location}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
            <Calendar size={16} className="text-zinc-500" />
            <div className="text-xs">
              <div className="text-zinc-500 uppercase tracking-tighter text-[9px]">Year</div>
              <div className="text-white font-medium">{disaster.year}</div>
            </div>
          </div>
        </div>

        {/* Credibility */}
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-medium ${CREDIBILITY_COLORS[disaster.credibility]}`}>
          <AlertCircle size={10} />
          {disaster.credibility} Source
        </div>

        {/* Summary */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-zinc-500">
            <Info size={14} />
            <h3 className="text-[10px] uppercase tracking-widest">Summary</h3>
          </div>
          <div className="text-zinc-300 leading-relaxed font-light text-sm">
            <Markdown>{disaster.summary}</Markdown>
          </div>
        </section>

        {/* Survivor Quotes */}
        {disaster.survivorQuotes && disaster.survivorQuotes.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-zinc-500">
              <Quote size={14} />
              <h3 className="text-[10px] uppercase tracking-widest">Survivor Testimony</h3>
            </div>
            <div className="space-y-4">
              {disaster.survivorQuotes.map((quote, i) => (
                <blockquote key={i} className="border-l border-white/10 pl-4 italic text-zinc-400 text-sm">
                  "{quote}"
                </blockquote>
              ))}
            </div>
          </section>
        )}

        {/* Historian Notes */}
        {disaster.historianNotes && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-zinc-500">
              <BookOpen size={14} />
              <h3 className="text-[10px] uppercase tracking-widest">Historian Notes</h3>
            </div>
            <p className="text-zinc-400 text-sm font-light leading-relaxed">
              {disaster.historianNotes}
            </p>
          </section>
        )}

        {/* Impact */}
        {disaster.estimatedImpact && (
          <section className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
            <div className="text-[9px] uppercase tracking-widest text-red-400/60 mb-1">Estimated Impact</div>
            <p className="text-red-400 text-sm font-medium">
              {disaster.estimatedImpact}
            </p>
          </section>
        )}

        {/* Audio Placeholder */}
        {disaster.audioUrl && (
          <button className="w-full flex items-center justify-center gap-3 py-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all group">
            <Headphones size={20} className="text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs uppercase tracking-widest text-white">Play Audio Testimony</span>
          </button>
        )}
      </div>

      <div className="p-6 border-t border-white/5 bg-white/5">
        <button className="w-full py-3 text-[10px] uppercase tracking-[0.3em] text-zinc-500 hover:text-white transition-colors">
          Read Deeper Analysis
        </button>
      </div>
    </motion.div>
  );
}
