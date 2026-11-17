import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Clock } from 'lucide-react';
import { RESTAURANT_LOCATION } from '../data/multanAreas.ts';
import { trackConversionEvent } from '../lib/analytics.ts';

const IDLE_THRESHOLD_MS = 30_000;

function getDynamicWaitTimeInfo(): { label: string; detail: string } {
  const hour = new Date().getHours();
  if (hour >= 12 && hour < 15) {
    return {
      label: 'Wait: 25–35 mins',
      detail: 'Lunch peak · Fresh dum batches live',
    };
  }
  if (hour >= 19 && hour < 23) {
    return {
      label: 'Wait: 30–40 mins',
      detail: 'Dinner rush · Charcoal grill busy',
    };
  }
  if ((hour >= 11 && hour < 12) || (hour >= 15 && hour < 19) || hour >= 23 || hour < 1) {
    return {
      label: 'Wait: 15–25 mins',
      detail: 'Fast kitchen turnaround right now',
    };
  }
  return {
    label: 'Opens 11:00 AM',
    detail: 'Pre-order via WhatsApp anytime',
  };
}

export function FloatingWhatsApp() {
  const [hovered, setHovered] = useState(false);
  const [isIdle, setIsIdle] = useState(false);

  const waitInfo = useMemo(() => getDynamicWaitTimeInfo(), []);
  const whatsappUrl = `https://wa.me/${RESTAURANT_LOCATION.whatsappNumber}?text=${encodeURIComponent(
    'Hello Sultan Biryani and Grill! I would like to place an order.'
  )}`;

  // Detect > 30s user inactivity across browsing session to trigger a subtle inviting pulse
  useEffect(() => {
    let idleTimer: number | undefined;

    const resetIdleTimer = () => {
      setIsIdle(false);
      if (idleTimer !== undefined) {
        window.clearTimeout(idleTimer);
      }
      idleTimer = window.setTimeout(() => {
        setIsIdle(true);
      }, IDLE_THRESHOLD_MS);
    };

    resetIdleTimer();

    const activityEvents: (keyof WindowEventMap)[] = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'pointerdown',
    ];

    for (const evt of activityEvents) {
      window.addEventListener(evt, resetIdleTimer, { passive: true });
    }

    return () => {
      if (idleTimer !== undefined) {
        window.clearTimeout(idleTimer);
      }
      for (const evt of activityEvents) {
        window.removeEventListener(evt, resetIdleTimer);
      }
    };
  }, []);

  const handleWhatsAppClick = () => {
    trackConversionEvent('whatsapp_order_click', 'floating_whatsapp_button', {
      waitLabel: waitInfo.label,
      wasIdlePulseActive: isIdle,
      destination: RESTAURANT_LOCATION.whatsappNumber,
    });
    setIsIdle(false);
  };

  const showIdlePulse = isIdle && !hovered;

  return (
    <div
      className="fixed left-3.5 bottom-3.5 sm:left-6 sm:bottom-6 z-40"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Dynamic Wait Time Tooltip Positioned STRICTLY ABOVE the Icon */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.94 }}
            transition={{ duration: 0.18 }}
            className="absolute bottom-full left-0 mb-2.5 w-52 px-3.5 py-2.5 rounded-xl bg-[#1a0507]/95 dark:bg-[#240a0d] text-white border border-red-800/70 shadow-2xl pointer-events-none"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>{waitInfo.label}</span>
            </div>
            <p className="mt-0.5 text-[11px] text-red-100/85 leading-snug">
              {waitInfo.detail}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex items-center justify-center">
        {/* Subtle Expanding Pulse Ring when user has been idle > 30 seconds */}
        {showIdlePulse && (
          <motion.span
            aria-hidden="true"
            initial={{ scale: 1, opacity: 0.55 }}
            animate={{ scale: [1, 1.48], opacity: [0.55, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
            className="absolute inset-0 rounded-full bg-[#25D366] pointer-events-none"
          />
        )}

        <motion.a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp with Sultan Biryani and Grill"
          onClick={handleWhatsAppClick}
          onFocus={() => setHovered(true)}
          onBlur={() => setHovered(false)}
          animate={showIdlePulse ? { scale: [1, 1.05, 1] } : { scale: 1 }}
          transition={
            showIdlePulse
              ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.2 }
          }
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.95 }}
          className="relative z-10 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#1ebe5d] text-white shadow-xl shadow-black/30 flex items-center justify-center ring-4 ring-white/85 dark:ring-[#140507]/90 transition-colors"
        >
          <svg viewBox="0 0 32 32" className="w-6 h-6 sm:w-7 sm:h-7 fill-current" aria-hidden="true">
            <path d="M16.01 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.26.59 4.46 1.71 6.4L3.1 28.8l6.58-1.73a12.76 12.76 0 0 0 6.33 1.68h.01c7.06 0 12.8-5.74 12.8-12.8S23.07 3.2 16.01 3.2Zm7.46 18.08c-.31.88-1.81 1.68-2.51 1.78-.64.1-1.45.14-2.34-.15-.54-.17-1.23-.4-2.12-.78-3.73-1.61-6.17-5.37-6.36-5.62-.19-.25-1.52-2.02-1.52-3.85s.96-2.73 1.3-3.1c.34-.37.74-.46.99-.46h.71c.23 0 .54-.09.85.64.31.75 1.06 2.6 1.15 2.79.1.19.16.41.03.66-.13.25-.19.41-.38.63-.19.22-.4.49-.57.66-.19.19-.39.39-.17.77.22.37.98 1.61 2.11 2.61 1.45 1.29 2.67 1.69 3.04 1.88.37.19.59.16.81-.1.22-.25.93-1.09 1.18-1.46.25-.37.5-.31.84-.19.34.13 2.18 1.03 2.55 1.22.37.19.62.28.71.44.09.16.09.9-.22 1.78Z" />
          </svg>
        </motion.a>
      </div>
    </div>
  );
}
