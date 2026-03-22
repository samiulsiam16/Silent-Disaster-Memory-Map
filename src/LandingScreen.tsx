import { motion, AnimatePresence } from 'framer-motion';
import { Globe as GlobeIcon } from 'lucide-react';

export function LandingScreen({ onStart }: { onStart: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white p-6"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-900/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="text-center max-w-2xl relative z-10"
      >
        <div className="flex justify-center mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <GlobeIcon size={48} className="text-blue-400 opacity-50" />
          </motion.div>
        </div>

        <h1 className="text-4xl md:text-6xl font-light tracking-tighter mb-6 font-serif italic">
          Silent Disaster Memory Map
        </h1>

        <div className="space-y-4 text-lg text-zinc-400 font-light leading-relaxed">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            Some disasters were never reported.
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
          >
            Some stories were never heard.
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.5 }}
            className="text-white font-medium"
          >
            This map remembers.
          </motion.p>
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 5 }}
          onClick={onStart}
          className="mt-12 px-8 py-3 border border-white/20 rounded-full hover:bg-white hover:text-black transition-all duration-500 tracking-widest text-xs uppercase"
        >
          Initialize Interface
        </motion.button>
      </motion.div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.3em] text-zinc-600">
        Global Digital Memorial • v1.0.0
      </div>
    </motion.div>
  );
}
