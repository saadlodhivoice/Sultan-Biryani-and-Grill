import { AnimatePresence, motion } from 'motion/react';
import { Flame, X } from 'lucide-react';

interface PromoBannerProps {
  visible: boolean;
  onDismiss: () => void;
  onExploreDeals: () => void;
}

export function PromoBanner({ visible, onDismiss, onExploreDeals }: PromoBannerProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden bg-gradient-to-r from-[#7f1d1d] via-[#b91c1c] to-[#991b1b] text-white border-b border-red-950/30"
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-6 min-h-[36px] py-1.5 flex items-center justify-between gap-2 text-xs">
            <button
              type="button"
              onClick={onExploreDeals}
              className="flex items-center gap-2 text-left hover:underline underline-offset-2 cursor-pointer truncate"
            >
              <Flame className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="font-medium truncate">
                Special Platters from <strong className="font-bold text-amber-200 tabular-nums">Rs. 359</strong> · Royal Platter <strong className="font-bold text-amber-200 tabular-nums">Rs. 999</strong>
              </span>
            </button>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss promotion banner"
              className="p-1 rounded-md hover:bg-white/15 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
