import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { cn } from '../utils';
import { startEngineHum, playRelayTick, updateCoreCharge, playCoreLock, playSystemOnline, playRelease } from '../utils/audio';

interface IntroSequenceProps {
  onComplete: () => void;
}

const INTRO_TIMELINE = {
  boot: 1100,
  core: 2700,
  network: 4700,
  online: 6000,
  collapse: 7000,
  complete: 8000,
} as const;

function BootNode({ label, delay }: { label: string, delay: number }) {
  const [status, setStatus] = useState('OFFLINE');
  useEffect(() => {
    const t1 = setTimeout(() => {
      setStatus('CONNECTING');
      playRelayTick();
    }, delay * 1000);
    const t2 = setTimeout(() => {
      setStatus('CONNECTED');
      playRelayTick();
    }, delay * 1000 + 400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [delay]);

  return (
    <div className="flex justify-between w-32 md:w-40 font-mono text-[10px] md:text-xs text-[#8AB8FF] mb-2">
      <span className="tracking-widest">{label}</span>
      <span className="text-right w-20">
         {status === 'OFFLINE' && <span className="opacity-30">OFFLINE</span>}
         {status === 'CONNECTING' && <span className="animate-pulse text-[#8AB8FF]">CONNECTING</span>}
         {status === 'CONNECTED' && <span className="text-[#4D8DFF]">CONNECTED</span>}
      </span>
    </div>
  )
}

function CSSLine({ className, origin, scaleAxis, delay }: any) {
  return (
    <motion.div 
      className={cn("absolute bg-[#4D8DFF] opacity-60", className)}
      style={{ transformOrigin: origin }}
      initial={{ [scaleAxis]: 0 }}
      animate={{ [scaleAxis]: 1 }}
      transition={{ duration: 0.4, delay }}
    />
  )
}

function NetworkNode({ top, left, label, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      className="absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
      style={{ left, top }}
    >
      <div className="w-2 h-2 bg-[#8AB8FF] rounded-full mb-1 shadow-[0_0_8px_#8AB8FF]" />
      <div className="font-mono text-[#8AB8FF] text-[10px] tracking-widest text-center whitespace-nowrap">
        {label}<br/>
        <span className="text-[#4D8DFF] text-[8px]">LINK ESTABLISHED</span>
      </div>
    </motion.div>
  )
}

function GridLines() {
  return (
    <div className="absolute inset-0 pointer-events-none opacity-20">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#4D8DFF" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        {/* Central Crosshair */}
        <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#4D8DFF" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#4D8DFF" strokeWidth="1" strokeDasharray="4 4" />
      </svg>
      {/* Corner brackets */}
      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#4D8DFF] opacity-50" />
      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#4D8DFF] opacity-50" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#4D8DFF] opacity-50" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#4D8DFF] opacity-50" />
    </div>
  );
}

export function IntroSequence({ onComplete }: IntroSequenceProps) {
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (phase === 0 && !prefersReducedMotion) {
       startEngineHum();
    } else if (phase === 4 && !prefersReducedMotion) {
       playSystemOnline();
    } else if (phase === 5 && !prefersReducedMotion) {
       playRelease();
    }
  }, [phase, prefersReducedMotion]);

  useEffect(() => {
    if (phase >= 2 && phase < 5) {
      updateCoreCharge(progress);
    }
  }, [progress, phase]);

  useEffect(() => {
    if (progress === 100) {
      playCoreLock();
    }
  }, [progress]);

  useEffect(() => {
    if (prefersReducedMotion) {
      const t1 = setTimeout(() => setPhase(4), 500); // ONLINE
      const t2 = setTimeout(() => {
        setPhase(6);
        onComplete();
      }, 2000);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }

    const t1 = setTimeout(() => setPhase(1), INTRO_TIMELINE.boot);
    const t2 = setTimeout(() => setPhase(2), INTRO_TIMELINE.core);
    const t3 = setTimeout(() => setPhase(3), INTRO_TIMELINE.network);
    const t4 = setTimeout(() => setPhase(4), INTRO_TIMELINE.online);
    const t5 = setTimeout(() => setPhase(5), INTRO_TIMELINE.collapse);
    const t6 = setTimeout(() => {
      setPhase(6);
      onComplete();
    }, INTRO_TIMELINE.complete);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
    };
  }, [prefersReducedMotion, onComplete]);

  useEffect(() => {
    if (phase >= 2 && phase < 5 && progress < 100) {
      const interval = setInterval(() => {
        setProgress(p => {
          const next = p + Math.floor(Math.random() * 11) + 8;
          return next >= 100 ? 100 : next;
        });
      }, 160);
      return () => clearInterval(interval);
    }
  }, [phase, progress]);

  return (
    <div className="fixed inset-0 z-[200] bg-[#080B0E] overflow-hidden pointer-events-none select-none">
      <button 
        onClick={onComplete} 
        className="fixed bottom-6 right-6 z-[210] text-[#4D8DFF] opacity-30 text-[10px] md:text-xs font-mono tracking-widest hover:opacity-100 transition-opacity pointer-events-auto cursor-pointer"
      >
        SKIP
      </button>

      <motion.div
        animate={{ 
          scale: phase >= 5 ? 0.9 : 1, 
          opacity: phase >= 5 ? 0 : 1 
        }}
        transition={{ duration: 0.6, ease: "anticipate" }}
        className="absolute inset-0"
      >
        <GridLines />

        {/* Phase 0: WAKE */}
        <AnimatePresence>
          {phase === 0 && !prefersReducedMotion && (
            <motion.div
              key="wake"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-[30%] w-full text-center font-mono text-xs md:text-sm tracking-widest text-[#4D8DFF]"
            >
              INITIALIZING AETHER SYSTEM <span className="animate-pulse">_</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase 1: BOOT */}
        {phase >= 1 && (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Left Nodes */}
            <div className="absolute left-[5%] md:left-[10%] top-1/2 -translate-y-1/2">
               <BootNode label="LADER" delay={0.1} />
               <BootNode label="PACTUM" delay={0.3} />
            </div>
            {/* Right Nodes */}
            <div className="absolute right-[5%] md:right-[10%] top-1/2 -translate-y-1/2">
               <BootNode label="EASTER" delay={0.2} />
               <BootNode label="ORIA" delay={0.4} />
               <BootNode label="SOLARIA" delay={0.6} />
               <BootNode label="NIVALI" delay={0.8} />
            </div>
          </div>
        )}

        {/* Phase 2: CORE */}
        {phase >= 2 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
              {/* Outer Ring */}
              <motion.svg 
                animate={{ rotate: 360 }} 
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute w-full h-full opacity-60" viewBox="0 0 100 100"
              >
                <circle cx="50" cy="50" r="48" fill="none" stroke="#4D8DFF" strokeWidth="0.5" strokeDasharray="4 8" />
                <circle cx="50" cy="50" r="44" fill="none" stroke="#4D8DFF" strokeWidth="1" strokeDasharray="20 10 5 10" />
              </motion.svg>
              {/* Middle Ring */}
              <motion.svg 
                animate={{ rotate: -360 }} 
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute w-36 h-36 md:w-48 md:h-48 opacity-80" viewBox="0 0 100 100"
              >
                <circle cx="50" cy="50" r="48" fill="none" stroke="#8AB8FF" strokeWidth="1.5" strokeDasharray="30 20" />
              </motion.svg>
              {/* Inner Ring */}
              <motion.svg 
                animate={{ rotate: 360 }} 
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute w-24 h-24 md:w-32 md:h-32 opacity-40" viewBox="0 0 100 100"
              >
                <circle cx="50" cy="50" r="48" fill="none" stroke="#4D8DFF" strokeWidth="2" strokeDasharray="10 30" />
              </motion.svg>
              
              {/* Core Glow */}
              <motion.div 
                animate={{ opacity: progress === 100 ? 1 : 0.5, scale: progress === 100 ? 1.2 : 1 }}
                className="absolute w-8 h-8 md:w-12 md:h-12 bg-[#4D8DFF] rounded-full blur-md"
              />
              <div className="absolute w-4 h-4 md:w-6 md:h-6 bg-[#8AB8FF] rounded-full" />
            </div>

            {/* Progress Text & UI */}
            <div className="mt-8 flex flex-col items-center gap-2 font-mono">
              <div className="text-[#8AB8FF] text-xs md:text-sm tracking-widest">AETHER CORE</div>
              <div className="text-[#4D8DFF] text-xl font-bold">{progress}%</div>
              <div className="flex items-center gap-2 text-[10px] text-[#8AB8FF]">
                <span className="hidden md:inline">AETHER DRIVE</span>
                <div className="w-24 md:w-32 h-2 border border-[#4D8DFF]/50 p-[1px] flex">
                   <div className="h-full bg-[#4D8DFF] transition-all duration-100" style={{ width: `${progress}%` }} />
                </div>
                <span>{progress === 100 ? 'STABLE' : 'STABILIZING'}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Phase 3: NETWORK */}
        {phase >= 3 && (
          <div className="absolute inset-0">
            <CSSLine className="left-1/2 bottom-1/2 w-[1px] h-[25%]" origin="bottom" scaleAxis="scaleY" delay={0} />
            <CSSLine className="left-1/2 top-1/2 w-[1px] h-[25%]" origin="top" scaleAxis="scaleY" delay={0.1} />
            <CSSLine className="top-1/2 left-1/2 h-[1px] w-[25vw]" origin="left" scaleAxis="scaleX" delay={0.2} />
            <CSSLine className="top-1/2 right-1/2 h-[1px] w-[25vw]" origin="right" scaleAxis="scaleX" delay={0.3} />
            
            <NetworkNode top="25%" left="50%" label="NIVALI" delay={0.2} />
            <NetworkNode top="75%" left="50%" label="SOLARIA" delay={0.3} />
            <NetworkNode top="50%" left="75%" label="EASTER" delay={0.4} />
            <NetworkNode top="50%" left="25%" label="ORIA" delay={0.5} />
            
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               transition={{ delay: 0.1 }}
               className="absolute text-[10px] text-[#4D8DFF] font-mono top-[56%] md:top-[53%] left-[55%] md:left-[52%]"
             >
               CENTRAL ISLAND<br/>LADER / PACTUM
             </motion.div>
          </div>
        )}

        {/* Phase 4: ONLINE */}
        {phase >= 4 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-[#080B0E]/90 backdrop-blur-sm"
          >
            <div className="font-mono text-xs text-[#8AB8FF] mb-8 text-left w-56 md:w-64 space-y-2">
               <div>AETHER DRIVE <span className="float-right text-[#4D8DFF]">STABLE</span></div>
               <div>WORLD LINK <span className="float-right text-[#4D8DFF]">CONNECTED</span></div>
               <div>DATABASE <span className="float-right text-[#4D8DFF]">ONLINE</span></div>
            </div>
            
            <div className="relative flex items-center justify-center w-full">
               <motion.div 
                 initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.4 }}
                 className="absolute w-full h-[1px] bg-[#4D8DFF] shadow-[0_0_10px_#4D8DFF]"
               />
               <motion.div
                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                 className="bg-[#080B0E] px-6 py-3 font-mono text-lg md:text-xl tracking-[0.3em] text-[#E9EEF3] border border-[#4D8DFF]/30 z-10 shadow-2xl shadow-[#4D8DFF]/20"
               >
                 SYSTEM ONLINE
               </motion.div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
