import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { motion } from 'motion/react';
import {
  Check,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  CookingPot,
  CupSoda,
  Flame,
  Minus,
  Plus,
  Sandwich,
  Search,
  ShoppingBag,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { MENU_CATEGORIES, MENU_ITEMS } from '../data/menuData.ts';
import { formatPKR } from '../data/multanAreas.ts';
import type { CartItem, MenuItem } from '../types.ts';

const CATEGORY_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  'Platters & Deals': ChefHat,
  'Biryani & Pulao': UtensilsCrossed,
  'Charcoal BBQ': Flame,
  'Wraps & Burgers': Sandwich,
  'Pakwan Daig': CookingPot,
  'Sides & Drinks': CupSoda,
};

interface MenuSectionProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  cartItems: CartItem[];
  onAddToCart: (item: MenuItem, imageElement: HTMLElement | null) => void;
  onUpdateQty: (itemId: string, delta: number) => void;
}

export function MenuSection({
  selectedCategory,
  onSelectCategory,
  cartItems,
  onAddToCart,
  onUpdateQty,
}: MenuSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [justPressedId, setJustPressedId] = useState<string | null>(null);
  const imageRefs = useRef<Record<string, HTMLImageElement | null>>({});
  const railRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const cartQtyMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of cartItems) {
      map[c.item.id] = c.quantity;
    }
    return map;
  }, [cartItems]);

  // Smoothly center the active category button in the horizontal rail (matching reference video)
  useEffect(() => {
    const btn = tabRefs.current[selectedCategory];
    if (btn) {
      btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [selectedCategory]);

  // Order categories so the selected category renders FIRST, followed by all remaining categories underneath!
  const orderedCategories = useMemo(() => {
    const validSelected = MENU_CATEGORIES.includes(
      selectedCategory as (typeof MENU_CATEGORIES)[number]
    )
      ? selectedCategory
      : MENU_CATEGORIES[0];

    return [
      validSelected,
      ...MENU_CATEGORIES.filter((cat) => cat !== validSelected),
    ];
  }, [selectedCategory]);

  const sectionsToRender = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orderedCategories
      .map((category) => {
        const items = MENU_ITEMS.filter((item) => {
          if (item.category !== category) return false;
          if (!q) return true;
          return (
            item.name.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q)
          );
        });
        return { category, items };
      })
      .filter((sec) => sec.items.length > 0);
  }, [orderedCategories, searchQuery]);

  const activeCategoryCount = useMemo(
    () => MENU_ITEMS.filter((i) => i.category === selectedCategory).length,
    [selectedCategory]
  );

  const handleStepCategory = (dir: -1 | 1) => {
    const idx = MENU_CATEGORIES.indexOf(
      selectedCategory as (typeof MENU_CATEGORIES)[number]
    );
    const current = idx >= 0 ? idx : 0;
    const nextIdx = (current + dir + MENU_CATEGORIES.length) % MENU_CATEGORIES.length;
    onSelectCategory(MENU_CATEGORIES[nextIdx]);
    if (railRef.current) {
      railRef.current.scrollBy({ left: dir * 160, behavior: 'smooth' });
    }
  };

  const handleAddClick = (item: MenuItem) => {
    setJustPressedId(item.id);
    window.setTimeout(() => {
      setJustPressedId((prev) => (prev === item.id ? null : prev));
    }, 500);
    onAddToCart(item, imageRefs.current[item.id] ?? null);
  };

  return (
    <section
      id="menu-section"
      className="max-w-7xl mx-auto px-2.5 sm:px-6 py-7 sm:py-10 overflow-x-hidden"
    >
      {/* Top Bar: Real-Time Search Input + Active Category Count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-red-600 dark:text-red-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search biryani, BBQ, wraps, platters..."
            aria-label="Search menu items"
            className="w-full h-11 pl-10 pr-10 rounded-xl bg-white/90 dark:bg-[#1e080a]/90 backdrop-blur-sm border border-red-200 dark:border-red-900/70 text-xs sm:text-sm text-[#220709] dark:text-white placeholder:text-red-400/80 focus:outline-none focus:ring-2 focus:ring-red-600/40 shadow-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-950 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 text-xs sm:text-sm font-bold text-[#220709] dark:text-white px-1">
          <span>
            {searchQuery.trim()
              ? `Matching "${searchQuery.trim()}"`
              : selectedCategory}
          </span>
          <span className="text-red-700 dark:text-amber-300 tabular-nums">
            (
            {searchQuery.trim()
              ? sectionsToRender.reduce((sum, s) => sum + s.items.length, 0)
              : activeCategoryCount}
            )
          </span>
        </div>
      </div>

      {/* Category Carousel Rail with Left/Right Arrows & Long Responsive Tabs */}
      <div className="flex items-center gap-2 sm:gap-3 mb-7 w-full">
        <button
          type="button"
          onClick={() => handleStepCategory(-1)}
          aria-label="Previous category"
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 dark:bg-[#1e080a] border border-red-200 dark:border-red-900/70 text-[#2a0709] dark:text-red-100 hover:border-red-600 hover:scale-105 active:scale-95 flex items-center justify-center shrink-0 shadow-sm transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div
          ref={railRef}
          className="flex-1 flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar py-1 px-0.5 scroll-smooth"
        >
          {MENU_CATEGORIES.map((category) => {
            const active = selectedCategory === category;
            const CategoryIcon = CATEGORY_ICONS[category] ?? UtensilsCrossed;
            return (
              <motion.button
                key={category}
                ref={(el) => {
                  tabRefs.current[category] = el;
                }}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => onSelectCategory(category)}
                className={`relative px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 md:min-w-[215px] lg:min-w-[240px] flex items-center justify-center rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'text-white'
                    : 'bg-white/90 dark:bg-[#1c0709]/90 backdrop-blur-sm text-[#4a1a1d] dark:text-red-100/85 border border-red-200 dark:border-red-900/60 hover:border-red-500'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="activeCategoryTabBg"
                    transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#b91c1c] to-[#881313] shadow-md shadow-red-950/25"
                  />
                )}
                <span className="relative z-10 inline-flex items-center justify-center gap-2">
                  <CategoryIcon
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${
                      active ? 'text-amber-300' : 'text-red-700 dark:text-amber-300'
                    }`}
                  />
                  <span>{category}</span>
                </span>
              </motion.button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => handleStepCategory(1)}
          aria-label="Next category"
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 dark:bg-[#1e080a] border border-red-200 dark:border-red-900/70 text-[#2a0709] dark:text-red-100 hover:border-red-600 hover:scale-105 active:scale-95 flex items-center justify-center shrink-0 shadow-sm transition-all cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Menu Category Sections — Selected Category First, Remaining Categories Below When Scrolling */}
      {sectionsToRender.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white/80 dark:bg-[#1b0709] border border-red-200 dark:border-red-900/50">
          <p className="text-base font-semibold text-[#2a0709] dark:text-white">
            No dishes match your search.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="mt-3 px-4 py-2 rounded-lg bg-red-700 text-white text-xs font-bold cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {sectionsToRender.map(({ category, items }) => (
            <div key={category} className="space-y-4">
              <div className="flex items-baseline justify-between border-b border-red-200/80 dark:border-red-950/80 pb-2">
                <h2 className="font-display text-lg sm:text-2xl font-extrabold text-[#220709] dark:text-white tracking-tight">
                  {category}
                </h2>
                <span className="text-xs font-bold text-red-700 dark:text-amber-300 tabular-nums">
                  {items.length} {items.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-5">
                {items.map((item, idx) => {
                  const qtyInCart = cartQtyMap[item.id] ?? 0;
                  const isAdded = qtyInCart > 0;
                  const isPressed = justPressedId === item.id;

                  return (
                    <motion.article
                      key={`${selectedCategory}-${item.id}`}
                      initial={{ opacity: 0, y: 28, scale: 0.92 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: false, amount: 0.06 }}
                      transition={{
                        duration: 0.55,
                        delay: Math.min((idx % 4) * 0.05, 0.16),
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="group flex flex-col min-w-0 rounded-2xl overflow-hidden bg-white dark:bg-[#1b0709] border border-red-200/80 dark:border-red-950/90 shadow-sm hover:shadow-xl hover:shadow-red-950/10 dark:hover:shadow-red-950/50 transition-all duration-300 hover:-translate-y-0.5"
                    >
                      {/* Dish Image (4:3) */}
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-red-100/60 dark:bg-[#2a0b0e]">
                        <img
                          ref={(el) => {
                            imageRefs.current[item.id] = el;
                          }}
                          src={item.image}
                          alt={item.name}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>

                      {/* Dish Details — Full Unclipped Product Names & Compact Short Description */}
                      <div className="flex-1 p-2.5 sm:p-4 flex flex-col justify-between min-w-0">
                        <div className="min-w-0">
                          {item.serving && (
                            <p className="text-[10px] sm:text-[11px] font-medium text-red-700/90 dark:text-amber-300/90 leading-tight">
                              {item.serving}
                            </p>
                          )}

                          <h3 className="mt-0.5 font-display font-bold text-[13px] sm:text-base text-[#210608] dark:text-white leading-tight break-words">
                            {item.name}
                          </h3>

                          <p className="mt-1 text-[11px] sm:text-xs text-[#6e3a3d] dark:text-red-100/75 leading-[1.35] line-clamp-2">
                            {item.description}
                          </p>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-red-100 dark:border-red-950/80 min-w-0">
                          <div className="flex items-baseline gap-1.5 flex-wrap mb-2">
                            <span className="font-bold text-xs sm:text-base text-red-700 dark:text-amber-300 tabular-nums">
                              {formatPKR(item.price)}
                            </span>
                            {item.originalPrice && (
                              <span className="text-[11px] sm:text-xs text-[#8f5c5f] dark:text-red-200/50 line-through tabular-nums">
                                {formatPKR(item.originalPrice)}
                              </span>
                            )}
                          </div>

                          {isAdded ? (
                            <div className="w-full h-8 sm:h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-between overflow-hidden shadow-sm">
                              <button
                                type="button"
                                onClick={() => onUpdateQty(item.id, -1)}
                                aria-label={`Remove one ${item.name}`}
                                className="w-8 sm:w-10 h-full flex items-center justify-center hover:bg-emerald-800 active:bg-emerald-900 transition-colors cursor-pointer shrink-0"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleAddClick(item)}
                                className={`flex-1 h-full flex items-center justify-center gap-1 text-[11px] sm:text-xs font-bold whitespace-nowrap px-1 cursor-pointer transition-transform ${
                                  isPressed ? 'scale-95' : ''
                                }`}
                              >
                                <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                                <span className="tabular-nums">Added ({qtyInCart})</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onUpdateQty(item.id, 1)}
                                aria-label={`Add one more ${item.name}`}
                                className="w-8 sm:w-10 h-full flex items-center justify-center hover:bg-emerald-800 active:bg-emerald-900 transition-colors cursor-pointer shrink-0"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.94 }}
                              onClick={() => handleAddClick(item)}
                              className={`w-full h-8 sm:h-10 px-2.5 sm:px-3 rounded-lg bg-gradient-to-r from-[#b91c1c] to-[#881313] hover:from-[#991b1b] hover:to-[#7f1d1d] text-white font-bold text-[11px] sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all whitespace-nowrap cursor-pointer ${
                                isPressed ? 'scale-95' : ''
                              }`}
                            >
                              <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                              <span>Add to Cart</span>
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
