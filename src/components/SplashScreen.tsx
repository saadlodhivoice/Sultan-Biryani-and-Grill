import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface SplashScreenProps {
  onComplete: () => void;
}

interface FireworkBurst {
  id: string;
  originX: number;
  originY: number;
  delay: number;
  sparks: {
    angle: number;
    distance: number;
    color: string;
    size: number;
  }[];
}

const COLORS = ['#f59e0b', '#ef4444', '#fde047', '#ffffff', '#fb7185'];

const FIREWORK_BURSTS: FireworkBurst[] = [
  {
    id: 'center-burst',
    originX: 0,
    originY: 0,
    delay: 0.35,
    sparks: Array.from({ length: 24 }, (_, i) => ({
      angle: (i / 24) * Math.PI * 2,
      distance: 115 + (i % 3) * 35,
      color: COLORS[i % COLORS.length],
      size: i % 2 === 0 ? 8 : 5,
    })),
  },
  {
    id: 'left-burst',
    originX: -125,
    originY: -95,
    delay: 0.75,
    sparks: Array.from({ length: 16 }, (_, i) => ({
      angle: (i / 16) * Math.PI * 2,
      distance: 70 + (i % 2) * 28,
      color: COLORS[(i + 1) % COLORS.length],
      size: 6,
    })),
  },
  {
    id: 'right-burst',
    originX: 125,
    originY: -85,
    delay: 1.05,
    sparks: Array.from({ length: 16 }, (_, i) => ({
      angle: (i / 16) * Math.PI * 2,
      distance: 70 + (i % 2) * 28,
      color: COLORS[(i + 2) % COLORS.length],
      size: 6,
    })),
  },
  {
    id: 'bottom-burst',
    originX: 0,
    originY: 110,
    delay: 1.35,
    sparks: Array.from({ length: 18 }, (_, i) => ({
      angle: (i / 18) * Math.PI * 2,
      distance: 85 + (i % 3) * 22,
      color: COLORS[(i + 3) % COLORS.length],
      size: 6,
    })),
  },
];

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false);
    }, 2500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {visible && (
        <motion.div
          key="sultan-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-[#190406] via-[#4a0a10] to-[#0c0203] text-white px-6 overflow-hidden"
        >
          {/* Ambient Crimson Celebration Glow */}
          <motion.div
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: [0.2, 1.5, 1.15], opacity: [0, 0.75, 0.45] }}
            transition={{ duration: 1.6, ease: 'easeOut' }}
            className="absolute w-80 h-80 rounded-full bg-red-600/35 blur-3xl pointer-events-none"
          />

          <div className="relative flex items-center justify-center">
            {/* Multi-Wave Fireworks Bursts */}
            {FIREWORK_BURSTS.map((burst) => (
              <div
                key={burst.id}
                style={{ transform: `translate(${burst.originX}px, ${burst.originY}px)` }}
                className="absolute flex items-center justify-center pointer-events-none"
              >
                <motion.div
                  initial={{ scale: 0.1, opacity: 0 }}
                  animate={{ scale: [0.1, 1.8], opacity: [0, 0.85, 0] }}
                  transition={{ duration: 0.9, delay: burst.delay, ease: 'easeOut' }}
                  className="absolute w-20 h-20 rounded-full border-2 border-amber-300/70"
                />
                {burst.sparks.map((spark, sIdx) => (
                  <motion.span
                    key={`${burst.id}-${sIdx}`}
                    initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                    animate={{
                      x: Math.cos(spark.angle) * spark.distance,
                      y: Math.sin(spark.angle) * spark.distance,
                      scale: [0, 1.5, 0],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 1.0,
                      delay: burst.delay,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    style={{
                      width: spark.size,
                      height: spark.size,
                      backgroundColor: spark.color,
                      boxShadow: `0 0 10px ${spark.color}`,
                    }}
                    className="absolute rounded-full"
                  />
                ))}
              </div>
            ))}

            {/* Expanding Golden Shockwave Rings */}
            <motion.div
              initial={{ scale: 0.4, opacity: 0.9 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 1.4, delay: 0.25, ease: 'easeOut' }}
              className="absolute w-36 h-36 rounded-full border-2 border-amber-400/80 pointer-events-none"
            />
            <motion.div
              initial={{ scale: 0.4, opacity: 0.8 }}
              animate={{ scale: 2.9, opacity: 0 }}
              transition={{ duration: 1.5, delay: 0.75, ease: 'easeOut' }}
              className="absolute w-36 h-36 rounded-full border border-red-400/70 pointer-events-none"
            />

            {/* Official Logo: Dramatic Zoom-In + Elastic Bouncing Animation */}
            <motion.div
              initial={{ scale: 0.08, opacity: 0, y: 30 }}
              animate={{
                scale: [0.08, 1.24, 0.88, 1.1, 0.96, 1],
                opacity: 1,
                y: [30, -14, 6, -5, 0],
              }}
              transition={{
                duration: 1.35,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative z-10 w-36 h-36 sm:w-44 sm:h-44 rounded-full p-1.5 bg-gradient-to-tr from-red-600 via-amber-400 to-red-700 shadow-2xl shadow-red-950"
            >
              <img
                src="/assets/aistudio/Sultan_Biryani_and_Grill_3fdb02a0.png"
                alt="Sultan Biryani and Grill"
                className="w-full h-full rounded-full object-cover bg-black"
              />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-7 text-center relative z-10"
          >
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Sultan Biryani &amp; Grill
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-amber-300 font-semibold tracking-wider uppercase">
              22-B Model Town Market · Multan
            </p>
          </motion.div>

          <button
            type="button"
            onClick={() => setVisible(false)}
            className="mt-8 relative z-10 text-xs font-semibold text-white/70 hover:text-white transition-colors underline underline-offset-4 cursor-pointer"
          >
            Enter Store
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
