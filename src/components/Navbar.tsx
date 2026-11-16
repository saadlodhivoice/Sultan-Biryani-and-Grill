import { forwardRef } from 'react';
import { Moon, ShoppingBag, Sun, User } from 'lucide-react';
import type { UserProfile } from '../types.ts';

interface NavbarProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  cartCount: number;
  cartJiggle: boolean;
  onOpenCart: () => void;
  user: UserProfile | null;
  onOpenAccount: () => void;
  onSelectCategory: (category: string) => void;
}

export const Navbar = forwardRef<HTMLButtonElement, NavbarProps>(function Navbar(
  {
    theme,
    onToggleTheme,
    cartCount,
    cartJiggle,
    onOpenCart,
    user,
    onOpenAccount,
    onSelectCategory,
  },
  cartButtonRef
) {
  const scrollToMenu = (cat: string) => {
    onSelectCategory(cat);
    const el = document.getElementById('menu-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#fff7f7]/90 dark:bg-[#140507]/90 border-b border-red-200/80 dark:border-red-950/70 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-15 sm:h-16 flex items-center justify-between gap-2 sm:gap-6">
        {/* Zone 1: Brand Mark */}
        <a
          href="#top"
          className="flex items-center gap-2 min-w-0 shrink group"
        >
          <img
            src="/assets/aistudio/Sultan_Biryani_and_Grill_3fdb02a0.png"
            alt="Sultan Biryani and Grill Logo"
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-red-700/30 dark:ring-red-500/40 shrink-0 transition-transform group-hover:scale-105"
          />
          <span className="font-display font-extrabold text-xs sm:text-lg tracking-tight text-[#2a0709] dark:text-white truncate">
            Sultan Biryani &amp; Grill
          </span>
        </a>

        {/* Zone 2: Clean Desktop Navigation Links (No mobile hamburger!) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#5a2326] dark:text-red-100/80">
          <button
            type="button"
            onClick={() => scrollToMenu('Platters & Deals')}
            className="hover:text-red-700 dark:hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Menu
          </button>
          <button
            type="button"
            onClick={() => scrollToMenu('Platters & Deals')}
            className="hover:text-red-700 dark:hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Platters
          </button>
          <button
            type="button"
            onClick={() => scrollToMenu('Charcoal BBQ')}
            className="hover:text-red-700 dark:hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Charcoal BBQ
          </button>
          <a
            href="#location-hours"
            className="hover:text-red-700 dark:hover:text-amber-300 transition-colors whitespace-nowrap shrink-0"
          >
            Visit Us
          </a>
        </nav>

        {/* Zone 3: Compact Responsive Actions (Never clipped on mobile) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-red-100/80 dark:bg-red-950/70 text-red-900 dark:text-amber-300 hover:bg-red-200/80 dark:hover:bg-red-900/80 border border-red-200 dark:border-red-900/60 transition-colors cursor-pointer shrink-0"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onOpenAccount}
            aria-label={user ? 'Open customer dashboard' : 'Sign in with Google'}
            className="h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-lg flex items-center gap-2 bg-white dark:bg-[#22090c] text-[#2a0709] dark:text-red-50 border border-red-200 dark:border-red-900/60 hover:border-red-500 transition-colors text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName}
                referrerPolicy="no-referrer"
                className="w-5 h-5 rounded-full object-cover shrink-0"
              />
            ) : (
              <User className="w-4 h-4 text-red-700 dark:text-red-400 shrink-0" />
            )}
            <span className="hidden xs:inline sm:inline">
              {user ? user.displayName.split(' ')[0] : 'Sign In'}
            </span>
          </button>

          <button
            ref={cartButtonRef}
            type="button"
            onClick={onOpenCart}
            aria-label="Open order cart"
            className={`h-9 sm:h-10 px-3 sm:px-4 rounded-lg flex items-center gap-2 bg-gradient-to-r from-[#b91c1c] to-[#881313] hover:from-[#991b1b] hover:to-[#7f1d1d] text-white font-semibold text-xs sm:text-sm shadow-md shadow-red-950/20 whitespace-nowrap shrink-0 cursor-pointer transition-transform ${
              cartJiggle ? 'animate-cart-jiggle' : ''
            }`}
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Cart</span>
            <span className="tabular-nums font-bold px-1.5 py-0.5 rounded bg-black/25 text-[11px] leading-none">
              {cartCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
});
