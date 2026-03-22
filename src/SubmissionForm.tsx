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
      alert('Please fill in all required fields.');
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
      alert('Memory submitted successfully for verification.');
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'submissions');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
    >
      <div className="w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div>
            <h2 className="text-xl font-serif italic text-white">Submit a Memory</h2>
            <p className="text-xs text-zinc-500 tracking-widest uppercase mt-1">Help us document the forgotten</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400">
            <X size={20} />
          </button>
        </div>

        {!user ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
            <div className="p-4 bg-blue-500/10 rounded-full">
              <LogIn size={32} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">Authentication Required</h3>
              <p className="text-sm text-zinc-500 mt-2 max-w-xs mx-auto">
                Please sign in to submit a memory to the digital memorial. This helps us maintain the credibility of our records.
              </p>
            </div>
            <button 
              onClick={onLogin}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs uppercase tracking-widest font-medium transition-all"
            >
              Sign In with Google
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col">
            <div className="p-8 space-y-6 flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500">Disaster Title</label>
                  <input 
                    required
                    type="text" 
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. The Silent Flood"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500">Location</label>
                  <input 
                    required
                    type="text" 
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Region, Country"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500">Year / Period</label>
                  <input 
                    required
                    type="number" 
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    placeholder="e.g. 1954"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500">Category</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors appearance-none"
                  >
                    <option value="flood">Flood</option>
                    <option value="famine">Famine</option>
                    <option value="epidemic">Epidemic</option>
                    <option value="conflict">Conflict</option>
                    <option value="environmental">Environmental</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-zinc-500">Summary & Narrative</label>
                <textarea 
                  required
                  rows={4}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Describe what happened, who was affected, and why it was forgotten..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <button type="button" className="flex items-center justify-center gap-3 p-4 bg-white/5 border border-dashed border-white/20 rounded-2xl hover:bg-white/10 transition-all group">
                  <Upload size={18} className="text-zinc-500 group-hover:text-blue-400" />
                  <span className="text-[10px] uppercase tracking-widest text-zinc-400 group-hover:text-white">Upload Images</span>
                </button>
                <button type="button" className="flex items-center justify-center gap-3 p-4 bg-white/5 border border-dashed border-white/20 rounded-2xl hover:bg-white/10 transition-all group">
                  <Mic size={18} className="text-zinc-500 group-hover:text-red-400" />
                  <span className="text-[10px] uppercase tracking-widest text-zinc-400 group-hover:text-white">Record Audio</span>
                </button>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 bg-white/5 flex justify-end gap-4">
              <button 
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full text-[10px] uppercase tracking-widest font-medium transition-all"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
              </button>
            </div>
          </form>
        )}
      </div>
    </motion.div>
  );
}

