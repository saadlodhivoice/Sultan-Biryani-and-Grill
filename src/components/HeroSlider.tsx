import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, ChevronLeft, ChevronRight, MapPin, Phone } from 'lucide-react';
import { HERO_SLIDES } from '../data/menuData.ts';
import { RESTAURANT_LOCATION } from '../data/multanAreas.ts';
import type { OrderType } from '../types.ts';

interface HeroSliderProps {
  selectedAreaName: string;
  orderType: OrderType;
  onOpenLocationModal: () => void;
  onExploreCategory: (category: string) => void;
}

const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  delivery: 'Home Delivery',
  takeaway: 'Takeaway',
  dine_in: 'Dine-In',
};

export function HeroSlider({
  selectedAreaName,
  orderType,
  onOpenLocationModal,
  onExploreCategory,
}: HeroSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [paused]);

  const currentSlide = HERO_SLIDES[activeIndex];

  const handleCta = () => {
    onExploreCategory(currentSlide.targetCategory);
    const el = document.getElementById('menu-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section
      id="top"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative w-full overflow-hidden bg-transparent transition-colors duration-300"
    >
      {/* Full-Width Continuous Sliding Hero with Smooth Zoom-In Animation */}
      <div className="relative min-h-[400px] sm:h-[490px] lg:h-[550px] w-full flex items-center overflow-hidden">
        <AnimatePresence initial={false}>
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, ease: 'easeInOut' }}
            className="absolute inset-0 overflow-hidden"
          >
            <motion.img
              src={currentSlide.image}
              alt={currentSlide.title}
              fetchPriority="high"
              initial={{ scale: 1 }}
              animate={{ scale: 1.12 }}
              transition={{ duration: 4.2, ease: 'easeOut' }}
              className="w-full h-full object-cover object-center brightness-105 dark:brightness-90 will-change-transform"
            />
            {/* Light Mode = Warm Creamy-Red Translucent Scrim | Dark Mode = Deep Crimson-Obsidian Scrim */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#fff6f6]/96 via-[#fde9e9]/84 to-[#fff6f6]/25 dark:from-[#0e0203]/92 dark:via-[#1d0507]/72 dark:to-[#0e0203]/25 transition-colors duration-300" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#fdf1f1]/90 via-transparent to-[#fff6f6]/35 dark:from-[#0c0203]/90 dark:via-transparent dark:to-black/35 transition-colors duration-300" />
          </motion.div>
        </AnimatePresence>

        {/* Hero Foreground Content */}
        <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-12">
          <div className="max-w-xl">
            <motion.p
              key={`${currentSlide.id}-eyebrow`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#b91c1c] dark:text-amber-300 mb-2"
            >
              {currentSlide.eyebrow}
            </motion.p>

            <motion.h1
              key={`${currentSlide.id}-title`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="font-display text-2xl sm:text-5xl lg:text-[52px] font-extrabold text-[#240608] dark:text-white leading-[1.12] tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              {currentSlide.title}
            </motion.h1>

            <motion.p
              key={`${currentSlide.id}-sub`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-3 sm:mt-4 text-xs sm:text-base text-[#4d1a1e] dark:text-red-100/90 max-w-lg leading-relaxed font-medium"
            >
              {currentSlide.subtitle}
            </motion.p>

            <div className="mt-5 sm:mt-6 flex flex-wrap items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={handleCta}
                className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg bg-gradient-to-r from-[#b91c1c] to-[#881313] hover:from-[#991b1b] hover:to-[#7f1d1d] text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-lg shadow-red-950/25 transition-transform active:scale-95 whitespace-nowrap cursor-pointer"
              >
                <span>{currentSlide.ctaLabel}</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>

              <a
                href={`tel:${RESTAURANT_LOCATION.phone}`}
                className="px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-white/90 hover:bg-white dark:bg-white/10 dark:hover:bg-white/20 backdrop-blur-md border border-red-300 dark:border-white/25 text-[#240608] dark:text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 transition-colors whitespace-nowrap shadow-sm"
              >
                <Phone className="w-4 h-4 text-[#b91c1c] dark:text-amber-300 shrink-0" />
                <span>{RESTAURANT_LOCATION.phone}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Left / Right Slide Arrows */}
        <button
          type="button"
          onClick={() =>
            setActiveIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)
          }
          aria-label="Previous slide"
          className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/85 hover:bg-red-700 text-[#240608] hover:text-white dark:bg-black/45 dark:hover:bg-red-800/80 dark:text-white items-center justify-center border border-red-200 dark:border-white/20 transition-colors cursor-pointer shadow-md"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => setActiveIndex((prev) => (prev + 1) % HERO_SLIDES.length)}
          aria-label="Next slide"
          className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/85 hover:bg-red-700 text-[#240608] hover:text-white dark:bg-black/45 dark:hover:bg-red-800/80 dark:text-white items-center justify-center border border-red-200 dark:border-white/20 transition-colors cursor-pointer shadow-md"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Bottom Slide Indicators */}
        <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {HERO_SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === activeIndex
                  ? 'w-7 bg-[#b91c1c] dark:bg-amber-400'
                  : 'w-2 bg-[#b91c1c]/35 dark:bg-white/45 hover:bg-[#b91c1c]/70 dark:hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Compact Service & Area Strip Below Hero */}
      <div className="bg-[#fff5f5]/75 dark:bg-[#190608]/75 backdrop-blur-md border-b border-red-200/80 dark:border-red-950/80 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[#451417] dark:text-red-100/90 min-w-0">
            <MapPin className="w-4 h-4 text-red-700 dark:text-red-400 shrink-0" />
            <span className="font-semibold shrink-0">{ORDER_TYPE_LABEL[orderType]}</span>
            <span aria-hidden="true" className="text-red-400">·</span>
            <span className="font-medium break-words">{selectedAreaName}</span>
          </div>

          <button
            type="button"
            onClick={onOpenLocationModal}
            className="text-xs font-bold text-red-700 dark:text-amber-300 hover:underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Change Area / Order Type
          </button>
        </div>
      </div>
    </section>
  );
}
