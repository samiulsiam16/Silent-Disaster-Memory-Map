import { useState, useEffect, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion, AnimatePresence } from 'motion/react';
import { Globe } from './Globe';
import { InfoPanel } from './InfoPanel';
import { Timeline } from './Timeline';
import { SubmissionForm } from './SubmissionForm';
import { INITIAL_DISASTERS } from './data/disasters';
import { Disaster } from './types';
import { Layers, BookOpen, Plus, Volume2, VolumeX, LogIn, User as UserIcon, LogOut, ShieldCheck, Activity } from 'lucide-react';
import { Howl } from 'howler';
import { auth, db, googleProvider, onAuthStateChanged, collection, onSnapshot, query, orderBy, User, OperationType, handleFirestoreError } from './firebase';
import { signInWithPopup, signOut } from 'firebase/auth';

// Cinematic Intro Component
function CinematicIntro({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1000),
      setTimeout(() => setStep(2), 3000),
      setTimeout(() => setStep(3), 5000),
      setTimeout(() => onComplete(), 8000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const lines = [
    "Some disasters were never reported.",
    "Some stories were never heard.",
    "This map remembers."
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center space-y-8 p-12 text-center">
      <AnimatePresence mode="wait">
        {step >= 1 && step <= 3 && (
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="text-xl md:text-3xl font-exo font-extralight tracking-[0.2em] text-white/80"
          >
            {lines[step - 1]}
          </motion.p>
        )}
      </AnimatePresence>
      
      {/* Background Pulse */}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1.2, opacity: 0.05 }}
        transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
        className="absolute inset-0 bg-blue-500 rounded-full blur-[200px] pointer-events-none"
      />
    </div>
  );
}

export default function App() {
  const [isIntroComplete, setIsIntroComplete] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [selectedDisaster, setSelectedDisaster] = useState<Disaster | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [currentYear, setCurrentYear] = useState(1950);
  const [isSubmissionOpen, setIsSubmissionOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isHeatmapMode, setIsHeatmapMode] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [disasters, setDisasters] = useState<Disaster[]>(INITIAL_DISASTERS);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Audio Refs
  const spaceHum = useRef<Howl | null>(null);
  const resonantTone = useRef<Howl | null>(null);
  const heartbeat = useRef<Howl | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Initialize Audio
  useEffect(() => {
    spaceHum.current = new Howl({
      src: ['https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'],
      loop: true,
      volume: 0.15,
      html5: true
    });

    resonantTone.current = new Howl({
      src: ['https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'],
      volume: 0.4
    });

    heartbeat.current = new Howl({
      src: ['https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3'],
      loop: true,
      volume: 0.3
    });

    return () => {
      spaceHum.current?.unload();
      resonantTone.current?.unload();
      heartbeat.current?.unload();
    };
  }, []);

  // Handle Audio Transitions
  useEffect(() => {
    if (isStarted && !isMuted) {
      spaceHum.current?.play();
    } else {
      spaceHum.current?.pause();
    }
  }, [isStarted, isMuted]);

  useEffect(() => {
    if (selectedDisaster && !isMuted) {
      resonantTone.current?.play();
      heartbeat.current?.play();
      heartbeat.current?.fade(0, 0.3, 2000);
    } else {
      heartbeat.current?.fade(0.3, 0, 1000);
      setTimeout(() => heartbeat.current?.pause(), 1000);
    }
  }, [selectedDisaster, isMuted]);

  // Fetch disasters from Firestore
  useEffect(() => {
    const q = query(collection(db, 'disasters'), orderBy('year', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const firestoreDisasters = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Disaster[];
      
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
    Math.abs(d.year - currentYear) <= 30
  );

  const activeDisaster = disasters.find(d => d.id === hoveredId) || selectedDisaster;

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
      <AnimatePresence>
        {!isIntroComplete && (
          <CinematicIntro onComplete={() => {
            setIsIntroComplete(true);
            setIsStarted(true);
          }} />
        )}
      </AnimatePresence>

      {/* 4K UI Polish Layers */}
      <div className="vignette" />
      <div className="scanline" />

      {/* 3D Scene */}
      <motion.div 
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: isIntroComplete ? 1 : 0, scale: isIntroComplete ? 1 : 1.1 }}
        transition={{ duration: 3, ease: "easeOut" }}
        className="absolute inset-0 z-0"
      >
        <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
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
      </motion.div>

      {/* UI Overlays */}
      {isIntroComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 1 }}
          className="relative w-full h-full pointer-events-none"
        >
          {/* Top Navigation */}
          <div className="fixed top-8 left-8 z-30 flex items-center gap-6 pointer-events-auto">
            <div className="flex flex-col">
              <h1 className="text-2xl font-rajdhani font-light tracking-[0.3em] text-white/90 uppercase">
                Silent Memory Map
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[9px] uppercase tracking-[0.4em] text-blue-400 font-mono">
                  Digital Memorial Interface v4.0
                </span>
                <div className="w-12 h-[1px] bg-blue-500/30" />
                <Activity size={10} className="text-blue-500 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Right Controls */}
          <div className="fixed top-8 right-8 z-30 flex flex-col gap-4 pointer-events-auto">
            {user ? (
              <div className="flex flex-col gap-4">
                <div className="p-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex flex-col items-center gap-2 shadow-[0_0_15px_rgba(0,150,255,0.1)]">
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
                className="p-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-all shadow-[0_0_15px_rgba(0,150,255,0.1)]"
                title="Login with Google"
              >
                <LogIn size={18} />
              </button>
            )}
            
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="p-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-all shadow-[0_0_15px_rgba(0,150,255,0.1)]"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button 
              onClick={() => setIsHeatmapMode(!isHeatmapMode)}
              className={`p-3 backdrop-blur-xl border border-white/10 rounded-full transition-all shadow-[0_0_15px_rgba(0,150,255,0.1)] ${isHeatmapMode ? 'bg-blue-500 text-white' : 'bg-black/40 text-zinc-400 hover:text-white hover:bg-white/10'}`}
            >
              <Layers size={18} />
            </button>
          </div>

          {/* Bottom Left: Detailed Description Card */}
          <AnimatePresence mode="wait">
            {activeDisaster && (
              <motion.div
                key={activeDisaster.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="fixed bottom-12 left-8 z-30 w-96 p-8 holographic-card pointer-events-auto"
              >
                <div className="flex items-center gap-3 mb-4">
                  <ShieldCheck size={14} className="text-blue-400" />
                  <span className="text-[10px] uppercase tracking-[0.3em] text-blue-400 font-mono">
                    Verified Archive Record
                  </span>
                </div>
                
                <h2 className="text-xl font-rajdhani font-medium text-white mb-4 tracking-wider uppercase">
                  {activeDisaster.title}
                </h2>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono">Primary Cause</span>
                    <p className="text-xs text-zinc-300 font-light leading-relaxed">
                      {activeDisaster.cause || "Atmospheric instability and regional neglect."}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono">Scale of Impact</span>
                    <p className="text-xs text-zinc-300 font-light leading-relaxed">
                      {activeDisaster.effect || "Widespread displacement and ecological collapse."}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono">Suppression Context</span>
                    <p className="text-xs text-zinc-400 font-light italic leading-relaxed">
                      {activeDisaster.underreportedReason || "Information suppressed by regional authorities."}
                    </p>
                  </div>

                  {activeDisaster.survivorQuotes && (
                    <div className="pt-4 border-t border-white/5">
                      <p className="text-xs text-blue-200/70 italic font-serif leading-relaxed">
                        "{activeDisaster.survivorQuotes[0]}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Scanline Sweep Effect */}
                <motion.div 
                  initial={{ top: "-100%" }}
                  animate={{ top: "200%" }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 w-full h-20 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent pointer-events-none"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Timeline */}
          <div className="pointer-events-auto">
            <Timeline 
              currentYear={currentYear} 
              onYearChange={setCurrentYear} 
            />
          </div>

          {/* Info Panel (Holographic) */}
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
              <div className="pointer-events-auto">
                <SubmissionForm 
                  user={user} 
                  onLogin={handleLogin}
                  onClose={() => setIsSubmissionOpen(false)} 
                />
              </div>
            )}
          </AnimatePresence>

          {/* Global Scanline Reveal */}
          <motion.div 
            initial={{ height: "100%" }}
            animate={{ height: "0%" }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="fixed top-0 left-0 w-full bg-black z-[90] pointer-events-none"
          />
        </motion.div>
      )}
    </div>
  );
}


