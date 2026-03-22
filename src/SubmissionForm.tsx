import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Upload, Mic, LogIn, Loader2 } from 'lucide-react';
import { db, collection, addDoc, User, handleFirestoreError, OperationType } from './firebase';
import { serverTimestamp } from 'firebase/firestore';

export function SubmissionForm({ user, onLogin, onClose }: { 
  user: User | null; 
  onLogin: () => void;
  onClose: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    year: '',
    category: 'flood',
    summary: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onLogin();
      return;
    }

    if (!formData.title || !formData.location || !formData.year || !formData.summary) {
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'submissions'), {
        ...formData,
        year: parseInt(formData.year),
        submitterUid: user.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'submissions');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
    >
      <div className="w-full max-w-2xl glass-panel rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] heartbeat-pulse">
        <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div>
            <h2 className="text-2xl font-rajdhani font-light text-white uppercase tracking-widest">Submit a Memory</h2>
            <p className="text-[9px] text-blue-400 tracking-[0.3em] uppercase mt-1 font-mono">Archive Contribution v1.0</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400">
            <X size={20} />
          </button>
        </div>

        {!user ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-8">
            <div className="p-6 bg-blue-500/10 rounded-full border border-blue-500/20">
              <LogIn size={32} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-rajdhani text-white uppercase tracking-widest">Authentication Required</h3>
              <p className="text-sm text-zinc-400 mt-4 max-w-xs mx-auto font-light leading-relaxed">
                Please sign in to submit a memory to the digital memorial. This helps us maintain the credibility of our records.
              </p>
            </div>
            <button 
              onClick={onLogin}
              className="px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-[10px] uppercase tracking-[0.3em] font-medium transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]"
            >
              Sign In with Google
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col scrollbar-hide">
            <div className="p-8 space-y-8 flex-1">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-mono">Disaster Title</label>
                  <input 
                    required
                    type="text" 
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. The Silent Flood"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-zinc-600"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-mono">Location</label>
                  <input 
                    required
                    type="text" 
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Region, Country"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-zinc-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-mono">Year / Period</label>
                  <input 
                    required
                    type="number" 
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    placeholder="e.g. 1954"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-zinc-600"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-mono">Category</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors appearance-none"
                  >
                    <option value="flood">Flood</option>
                    <option value="famine">Famine</option>
                    <option value="epidemic">Epidemic</option>
                    <option value="conflict">Conflict</option>
                    <option value="environmental">Environmental</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-mono">Summary & Narrative</label>
                <textarea 
                  required
                  rows={4}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Describe what happened, who was affected, and why it was forgotten..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors resize-none placeholder:text-zinc-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-8">
                <button type="button" className="flex items-center justify-center gap-4 p-5 bg-white/5 border border-dashed border-white/20 rounded-3xl hover:bg-white/10 transition-all group">
                  <Upload size={20} className="text-zinc-500 group-hover:text-blue-400" />
                  <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 group-hover:text-white font-mono">Upload Evidence</span>
                </button>
                <button type="button" className="flex items-center justify-center gap-4 p-5 bg-white/5 border border-dashed border-white/20 rounded-3xl hover:bg-white/10 transition-all group">
                  <Mic size={20} className="text-zinc-500 group-hover:text-red-400" />
                  <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 group-hover:text-white font-mono">Voice Testimony</span>
                </button>
              </div>
            </div>

            <div className="p-8 border-t border-white/10 bg-white/5 flex justify-end gap-6">
              <button 
                type="button"
                onClick={onClose}
                className="px-8 py-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors font-mono"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-3 px-12 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full text-[10px] uppercase tracking-[0.3em] font-medium transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {isSubmitting ? 'Transmitting...' : 'Transmit Record'}
              </button>
            </div>
          </form>
        )}
      </div>
    </motion.div>
  );
}
