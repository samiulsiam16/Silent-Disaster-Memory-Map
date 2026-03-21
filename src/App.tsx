import { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion, AnimatePresence } from 'motion/react';
import { Globe } from './Globe';
import { LandingScreen } from './LandingScreen';
import { InfoPanel } from './InfoPanel';
import { Timeline } from './Timeline';
import { SubmissionForm } from './SubmissionForm';
import { INITIAL_DISASTERS } from './data/disasters';
import { Disaster } from './types';
import { Layers, BookOpen, Plus, Volume2, VolumeX, LogIn, User as UserIcon, LogOut } from 'lucide-react';
import { Howl } from 'howler';
import { auth, db, googleProvider, onAuthStateChanged, collection, onSnapshot, query, orderBy, User, OperationType, handleFirestoreError } from './firebase';
import { signInWithPopup, signOut } from 'firebase/auth';

export default function App() {
  const [isStarted, setIsStarted] = useState(false);
  const [selectedDisaster, setSelectedDisaster] = useState<Disaster | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [currentYear, setCurrentYear] = useState(1950);
  const [isSubmissionOpen, setIsSubmissionOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isHeatmapMode, setIsHeatmapMode] = useState(false);
  const [ambientSound, setAmbientSound] = useState<Howl | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [disasters, setDisasters] = useState<Disaster[]>(INITIAL_DISASTERS);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const sound = new Howl({
      src: ['https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'], // Ambient wind/echo
      loop: true,
      volume: 0.2,
      html5: true
    });
    setAmbientSound(sound);
    return () => sound.unload();
  }, []);

  useEffect(() => {
    if (isStarted && !isMuted && ambientSound) {
      ambientSound.play();
    } else if (ambientSound) {
      ambientSound.pause();
    }
  }, [isStarted, isMuted, ambientSound]);

  // Fetch disasters from Firestore
  useEffect(() => {
    const q = query(collection(db, 'disasters'), orderBy('year', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const firestoreDisasters = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Disaster[];
      
      // Merge with initial disasters to ensure we always have some data
      const merged = [...INITIAL_DISASTERS];
      firestoreDisasters.forEach(fd => {
        const index = merged.findIndex(m => m.id === fd.id);
        if (index !== -1) {
          merged[index] = fd;
        } else {
          merged.push(fd);
        }
      });
      setDisasters(merged);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'disasters');
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const filteredDisasters = disasters.filter(d => 
    Math.abs(d.year - currentYear) <= 20
  );

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
      <AnimatePresence>
        {!isStarted && (
          <LandingScreen onStart={() => setIsStarted(true)} />
        )}
      </AnimatePresence>

      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <Suspense fallback={null}>
            <Globe 
              disasters={filteredDisasters} 
              onSelect={setSelectedDisaster}
              hoveredId={hoveredId}
              setHoveredId={setHoveredId}
              selectedDisaster={selectedDisaster}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* UI Overlays */}
      {isStarted && (
        <>
          {/* Top Navigation */}
          <div className="fixed top-8 left-8 z-30 flex items-center gap-6">
            <div className="flex flex-col">
              <h1 className="text-xl font-serif italic tracking-tight text-white/90">
                Silent Disaster Memory Map
              </h1>
              <span className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 mt-1">
                Digital Memorial Interface
              </span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="fixed top-8 right-8 z-30 flex flex-col gap-4">
            {user ? (
              <div className="flex flex-col gap-4">
                <div className="p-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex flex-col items-center gap-2">
                  <img 
                    src={user.photoURL || ''} 
                    alt={user.displayName || 'User'} 
                    className="w-8 h-8 rounded-full border border-white/20"
                    referrerPolicy="no-referrer"
                  />
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                    title="Logout"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="p-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                title="Login with Google"
              >
                <LogIn size={18} />
              </button>
            )}
            
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="p-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
              title="Toggle Audio"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button 
              onClick={() => setIsHeatmapMode(!isHeatmapMode)}
              className={`p-3 backdrop-blur-xl border border-white/10 rounded-full transition-all ${isHeatmapMode ? 'bg-blue-500 text-white' : 'bg-black/40 text-zinc-400 hover:text-white hover:bg-white/10'}`}
              title="Heatmap Mode"
            >
              <Layers size={18} />
            </button>
            <button 
              className="p-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
              title="Story Mode"
            >
              <BookOpen size={18} />
            </button>
          </div>

          {/* Bottom Left: Submission Trigger */}
          <div className="fixed bottom-12 left-8 z-30">
            <button 
              onClick={() => setIsSubmissionOpen(true)}
              className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 rounded-full transition-all group"
            >
              <Plus size={18} className="text-blue-400 group-hover:rotate-90 transition-transform duration-500" />
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 group-hover:text-white">Submit Memory</span>
            </button>
          </div>

          {/* Timeline */}
          <Timeline 
            currentYear={currentYear} 
            onYearChange={setCurrentYear} 
          />

          {/* Quick Summary Corner Overlay */}
          <AnimatePresence>
            {selectedDisaster && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-24 right-8 z-30 w-80 p-6 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl pointer-events-none"
              >
                <div className="text-[10px] uppercase tracking-[0.3em] text-blue-400 mb-2 font-mono">
                  Memory Fragment #{selectedDisaster.id}
                </div>
                <h3 className="text-lg font-serif italic text-white mb-3">
                  {selectedDisaster.title}
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed font-light">
                  {selectedDisaster.summary.split('.').slice(0, 2).join('.')}. 
                  The impact was profound, affecting the region for decades. 
                  This event remains a critical point in local oral history.
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-[9px] uppercase tracking-widest text-zinc-500">
                    Analyzing Cause & Effect...
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info Panel */}
          <AnimatePresence>
            {selectedDisaster && (
              <InfoPanel 
                disaster={selectedDisaster} 
                onClose={() => setSelectedDisaster(null)} 
              />
            )}
          </AnimatePresence>

          {/* Submission Form */}
          <AnimatePresence>
            {isSubmissionOpen && (
              <SubmissionForm 
                user={user} 
                onLogin={handleLogin}
                onClose={() => setIsSubmissionOpen(false)} 
              />
            )}
          </AnimatePresence>

          {/* Atmospheric Overlays */}
          <div className="fixed inset-0 pointer-events-none z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
            
            {/* Scanning Line Effect */}
            <motion.div 
              animate={{ y: ['0%', '100%', '0%'] }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute top-0 left-0 w-full h-px bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
            />
          </div>

          {/* Status Bar */}
          <div className="fixed bottom-6 right-8 z-30 flex items-center gap-4 text-[9px] uppercase tracking-[0.2em] text-zinc-600">
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
              System Active
            </div>
            <div className="w-px h-3 bg-zinc-800" />
            <div>Lat: {selectedDisaster?.lat.toFixed(2) || '0.00'}</div>
            <div>Lng: {selectedDisaster?.lng.toFixed(2) || '0.00'}</div>
          </div>
        </>
      )}
    </div>
  );
}


