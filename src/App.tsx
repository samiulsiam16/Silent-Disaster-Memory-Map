import { useState, useEffect, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe } from './Globe';
import { InfoPanel } from './InfoPanel';
import { Timeline } from './Timeline';
import { SubmissionForm } from './SubmissionForm';
import { INITIAL_DISASTERS } from './data/disasters';
import { Disaster } from './types';
import { Layers, Volume2, VolumeX, LogIn, LogOut, Activity, ShieldCheck } from 'lucide-react';
import { auth, db, googleProvider, onAuthStateChanged, collection, onSnapshot, query, orderBy, User, OperationType, handleFirestoreError } from './firebase';
import { signInWithPopup, signOut } from 'firebase/auth';

// IDEA 6 — Audio Layer (Procedural)
class ProceduralAudio {
  private ctx: AudioContext | null = null;
  private spaceHum: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;

  init() {
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = 0.04;
    this.gainNode.connect(this.ctx.destination);

    this.spaceHum = this.ctx.createOscillator();
    this.spaceHum.type = 'sine';
    this.spaceHum.frequency.setValueAtTime(40, this.ctx.currentTime);
    this.spaceHum.connect(this.gainNode);
    this.spaceHum.start();
  }

  playHeartbeat() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    const playBurst = (time: number) => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(60, time);
      g.gain.setValueAtTime(0.1, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
      osc.connect(g);
      g.connect(this.ctx!.destination);
      osc.start(time);
      osc.stop(time + 0.1);
    };

    playBurst(now);
    playBurst(now + 0.2);
  }

  setMute(mute: boolean) {
    if (this.gainNode) {
      this.gainNode.gain.setTargetAtTime(mute ? 0 : 0.04, this.ctx!.currentTime, 0.1);
    }
  }
}

const audio = new ProceduralAudio();

// IDEA 9 — Opening Cinematic
function CinematicIntro({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1000),
      setTimeout(() => setStep(2), 3000),
      setTimeout(() => setStep(3), 5000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const lines = [
    "Some disasters were never reported.",
    "Some stories were never heard.",
    "This map remembers."
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-12 text-center">
      <div className="max-w-2xl space-y-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="text-[10px] uppercase tracking-[0.5em] text-blue-500 font-mono mb-4"
        >
          Initializing Archive Connection...
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 2 }}
          className="text-5xl md:text-7xl font-rajdhani font-light text-white leading-tight tracking-widest uppercase"
        >
          SILENT DISASTER <br />
          <span className="text-blue-500">MEMORY MAP</span>
        </motion.h1>

        <div className="space-y-4">
          {lines.map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: step > i ? 1 : 0 }}
              transition={{ duration: 1.5 }}
              className="text-sm md:text-lg font-rajdhani font-extralight tracking-[0.2em] text-zinc-400"
            >
              {line}
            </motion.p>
          ))}
        </div>
        
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            <button
              onClick={() => {
                audio.init();
                onComplete();
              }}
              className="px-12 py-4 border border-blue-500/30 hover:bg-blue-500/10 text-blue-400 text-[10px] uppercase tracking-[0.3em] font-medium transition-all group relative overflow-hidden"
            >
              <span className="relative z-10">Enter Interface</span>
              <div className="absolute inset-0 bg-blue-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function TypewriterText({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    let i = 0;
    setDisplayedText('');
    const timer = setInterval(() => {
      setDisplayedText(text.slice(0, i));
      i++;
      if (i > text.length) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [text]);

  return <span>{displayedText}</span>;
}

// IDEA 7 — Heatmap Overlay
function HeatmapOverlay({ disasters }: { disasters: Disaster[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      disasters.forEach(d => {
        // Simple projection for heatmap (rough approximation for 2D overlay)
        const x = ((d.lng + 180) / 360) * canvas.width;
        const y = ((90 - d.lat) / 180) * canvas.height;
        
        const grad = ctx.createRadialGradient(x, y, 0, x, y, 50);
        grad.addColorStop(0, 'rgba(255, 100, 0, 0.4)');
        grad.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      draw();
    };

    window.addEventListener('resize', resize);
    resize();
    return () => window.removeEventListener('resize', resize);
  }, [disasters]);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-10 opacity-50" />;
}

export default function App() {
  const [isIntroComplete, setIsIntroComplete] = useState(true);
  const [selectedDisaster, setSelectedDisaster] = useState<Disaster | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [currentYear, setCurrentYear] = useState(1950);
  const [isSubmissionOpen, setIsSubmissionOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isHeatmapMode, setIsHeatmapMode] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [disasters, setDisasters] = useState<Disaster[]>(INITIAL_DISASTERS);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    audio.setMute(isMuted);
  }, [isMuted]);

  useEffect(() => {
    if (selectedDisaster) {
      audio.playHeartbeat();
    }
  }, [selectedDisaster]);

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
        if (index !== -1) merged[index] = fd;
        else merged.push(fd);
      });
      setDisasters(merged);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'disasters');
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); } 
    catch (error) { console.error("Login failed:", error); }
  };

  const handleLogout = async () => {
    try { await signOut(auth); } 
    catch (error) { console.error("Logout failed:", error); }
  };

  const filteredDisasters = disasters.filter(d => Math.abs(d.year - currentYear) <= 30);
  const activeDisaster = disasters.find(d => d.id === hoveredId) || selectedDisaster;

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
      <div className="fixed top-0 left-0 z-[999] bg-red-500 text-white p-2 text-xs">APP RENDERING</div>
      {!isIntroComplete && (
        <CinematicIntro onComplete={() => setIsIntroComplete(true)} />
      )}

      {/* IDEA 10 — 4K UI Polish Layers (temporarily removed for debugging) */}
      {/* <div className="grid-overlay" />
      <div className="vignette" />
      <div className="scanline" /> */}

      {isHeatmapMode && <HeatmapOverlay disasters={filteredDisasters} />}

      {/* 3D Scene */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: isIntroComplete ? 1 : 0 }}
        transition={{ duration: 3 }}
        className="absolute inset-0 z-0"
      >
        <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="red" />
          </mesh>
          <Suspense fallback={<div className="flex items-center justify-center w-full h-full text-blue-500 font-mono text-xs">LOADING 3D SCENE...</div>}>
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
          transition={{ duration: 2 }}
          className="relative w-full h-full pointer-events-none"
        >
          {/* Top Navigation */}
          <div className="fixed top-8 left-8 z-30 flex flex-col pointer-events-auto">
            <h1 className="text-2xl font-rajdhani font-light tracking-[0.3em] text-white/90 uppercase">
              Silent Memory Map
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[9px] uppercase tracking-[0.4em] text-blue-400 font-mono">
                Digital Memorial Interface v4.0
              </span>
              <Activity size={10} className="text-blue-500 animate-pulse" />
            </div>
          </div>

          {/* Right Controls */}
          <div className="fixed top-8 right-8 z-30 flex flex-col gap-4 pointer-events-auto">
            {user ? (
              <div className="p-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex flex-col items-center gap-2">
                <img src={user.photoURL || ''} alt="User" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                <button onClick={handleLogout} className="p-2 text-zinc-500 hover:text-red-400"><LogOut size={16} /></button>
              </div>
            ) : (
              <button onClick={handleLogin} className="p-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full text-zinc-400 hover:text-white"><LogIn size={18} /></button>
            )}
            <button onClick={() => setIsMuted(!isMuted)} className="p-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full text-zinc-400 hover:text-white">
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button onClick={() => setIsHeatmapMode(!isHeatmapMode)} className={`p-3 backdrop-blur-xl border border-white/10 rounded-full ${isHeatmapMode ? 'bg-blue-500 text-white' : 'bg-black/40 text-zinc-400'}`}>
              <Layers size={18} />
            </button>
          </div>

          {/* IDEA 8 — Corner Description Card */}
          <AnimatePresence mode="wait">
            {activeDisaster && (
              <motion.div
                key={activeDisaster.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed bottom-12 left-8 z-30 w-96 p-8 holographic-card pointer-events-auto"
              >
                <div className="scanline-sweep" />
                <div className="flex items-center gap-3 mb-4">
                  <ShieldCheck size={14} className="text-blue-400" />
                  <span className="text-[10px] uppercase tracking-[0.3em] text-blue-400 font-mono">Archive Record</span>
                </div>
                <h2 className="text-xl font-rajdhani font-medium text-white mb-4 tracking-wider uppercase">{activeDisaster.title}</h2>
                <div className="space-y-4 text-xs text-zinc-300 font-light leading-relaxed">
                  <p>{activeDisaster.cause}</p>
                  <p>{activeDisaster.effect}</p>
                  {activeDisaster.survivorQuotes && (
                    <p className="pt-4 border-t border-white/5 text-blue-200/70 italic min-h-[60px]">
                      "<TypewriterText text={activeDisaster.survivorQuotes[0]} />"
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pointer-events-auto">
            <Timeline currentYear={currentYear} onYearChange={setCurrentYear} />
          </div>

          <AnimatePresence>
            {selectedDisaster && <InfoPanel disaster={selectedDisaster} onClose={() => setSelectedDisaster(null)} />}
          </AnimatePresence>

          {isSubmissionOpen && <SubmissionForm user={user} onLogin={handleLogin} onClose={() => setIsSubmissionOpen(false)} />}

          {/* IDEA 9 — Scan-line reveal (removed cinematic-reveal class for reliability) */}
          <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[90] bg-black/20" />
        </motion.div>
      )}
    </div>
  );
}


