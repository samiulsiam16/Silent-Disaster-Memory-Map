import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Calendar, Info, Quote, BookOpen, ShieldCheck, Heart, Headphones } from 'lucide-react';
import { Disaster, DisasterCategory } from './types';
import Markdown from 'react-markdown';

const CATEGORY_LABELS: Record<DisasterCategory, string> = {
  flood: 'Hydrological Event',
  famine: 'Food Insecurity',
  epidemic: 'Biological Crisis',
  conflict: 'Humanitarian Fracture',
  environmental: 'Ecological Collapse',
};

export function InfoPanel({ disaster, onClose }: { disaster: Disaster; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: "spring", damping: 20, stiffness: 100 }}
      className="fixed top-8 right-8 z-50 w-[450px] h-[calc(100vh-64px)] holographic-card flex flex-col overflow-hidden pointer-events-auto"
    >
      {/* Heartbeat Border Pulse */}
      <motion.div 
        animate={{ opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 border-2 border-blue-500/30 rounded-3xl pointer-events-none"
      />

      {/* Scanline Sweep */}
      <motion.div 
        initial={{ top: "-100%" }}
        animate={{ top: "200%" }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 w-full h-32 bg-gradient-to-b from-transparent via-blue-400/10 to-transparent pointer-events-none"
      />

      {/* Header */}
      <div className="relative p-8 border-b border-white/10">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-[9px] uppercase tracking-[0.2em] text-blue-400 font-mono flex items-center gap-2">
            <ShieldCheck size={10} />
            {disaster.credibility} credibility
          </div>
          <div className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 font-mono">
            Archive ID: {disaster.id.padStart(4, '0')}
          </div>
        </div>

        <h2 className="text-3xl font-rajdhani font-light text-white leading-tight tracking-wider uppercase">
          {disaster.title}
        </h2>
        <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 mt-2 block">
          {CATEGORY_LABELS[disaster.category]}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 relative">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 text-zinc-500 mb-1">
              <Calendar size={12} />
              <span className="text-[10px] uppercase tracking-widest">Year</span>
            </div>
            <div className="text-lg font-mono text-blue-400">{disaster.year}</div>
          </div>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 text-zinc-500 mb-1">
              <MapPin size={12} />
              <span className="text-[10px] uppercase tracking-widest">Location</span>
            </div>
            <div className="text-sm text-white truncate">{disaster.location}</div>
          </div>
        </div>

        {/* Narrative */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-blue-400">
            <Info size={14} />
            <span className="text-[10px] uppercase tracking-[0.3em] font-mono">Historical Narrative</span>
          </div>
          <div className="text-sm text-zinc-300 leading-relaxed font-light">
            <Markdown>{disaster.summary}</Markdown>
          </div>
        </div>

        {/* Impact */}
        <div className="p-6 bg-blue-500/5 rounded-3xl border border-blue-500/10 space-y-4">
          <div className="flex items-center gap-2 text-blue-400">
            <Quote size={14} />
            <span className="text-[10px] uppercase tracking-[0.3em] font-mono">Human Impact</span>
          </div>
          <div className="text-2xl font-rajdhani text-white">
            {disaster.estimatedImpact}
          </div>
        </div>

        {/* Historian Notes */}
        {disaster.historianNotes && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-500">
              <BookOpen size={14} />
              <span className="text-[10px] uppercase tracking-[0.3em] font-mono">Archive Notes</span>
            </div>
            <div className="p-6 bg-white/5 rounded-3xl border border-white/5 text-xs text-zinc-400 leading-relaxed italic">
              {disaster.historianNotes}
            </div>
          </div>
        )}

        {/* Heartbeat Indicator */}
        <div className="flex items-center justify-center py-8">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="text-blue-500/30"
          >
            <Heart size={24} fill="currentColor" />
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-8 border-t border-white/10 bg-black/20">
        <button className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] uppercase tracking-[0.3em] font-medium transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]">
          Explore Related Records
        </button>
      </div>
    </motion.div>
  );
}
