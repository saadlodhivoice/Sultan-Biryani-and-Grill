import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Calendar, Minus, Plus, RotateCcw, ShoppingBag, Trash2, X } from 'lucide-react';
import { MENU_ITEMS } from '../data/menuData.ts';
import { formatPKR } from '../data/multanAreas.ts';
import type { CartItem, OrderRecord } from '../types.ts';

interface QuickReorderModalProps {
  open: boolean;
  order: OrderRecord | null;
  hasExistingCartItems: boolean;
  onClose: () => void;
  onConfirmAddToCart: (items: CartItem[], replaceCart: boolean) => void;
}

interface DraftReorderLine {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  available: boolean;
}

export function QuickReorderModal({
  open,
  order,
  hasExistingCartItems,
  onClose,
  onConfirmAddToCart,
}: QuickReorderModalProps) {
  const [lines, setLines] = useState<DraftReorderLine[]>([]);
  const [replaceCart, setReplaceCart] = useState(false);

  useEffect(() => {
    if (!order || !open) return;
    setLines(
      order.items.map((line) => {
        const matched = MENU_ITEMS.find((m) => m.id === line.id);
        return {
          id: line.id,
          name: matched?.name ?? line.name,
          price: matched?.price ?? line.price,
          quantity: line.quantity,
          image: matched?.image ?? line.image,
          available: Boolean(matched),
        };
      })
    );
    setReplaceCart(false);
  }, [order, open]);

  const availableLines = useMemo(
    () => lines.filter((l) => l.available && l.quantity > 0),
    [lines]
  );

  const totalQty = useMemo(
    () => availableLines.reduce((sum, l) => sum + l.quantity, 0),
    [availableLines]
  );

  const subtotal = useMemo(
    () => availableLines.reduce((sum, l) => sum + l.price * l.quantity, 0),
    [availableLines]
  );

  if (!order) return null;

  const updateQty = (id: string, delta: number) => {
    setLines((prev) =>
      prev
        .map((l) => (l.id === id ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0)
    );
  };

  const removeLine = (id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const handleConfirm = () => {
    const cartAdditions: CartItem[] = [];
    for (const line of availableLines) {
      const menuItem = MENU_ITEMS.find((m) => m.id === line.id);
      if (menuItem && line.quantity > 0) {
        cartAdditions.push({ item: menuItem, quantity: line.quantity });
      }
    }
    if (cartAdditions.length === 0) return;
    onConfirmAddToCart(cartAdditions, replaceCart);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-lg rounded-2xl overflow-hidden bg-[#fff8f8] dark:bg-[#170608] border border-red-200 dark:border-red-900/70 shadow-2xl flex flex-col max-h-[88vh]"
          >
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-[#7f1d1d] via-[#b91c1c] to-[#991b1b] text-white flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-amber-300 shrink-0" />
                  <h3 className="font-display font-extrabold text-base sm:text-lg truncate">
                    Quick Reorder
                  </h3>
                </div>
                <p className="text-[11px] sm:text-xs text-red-100/85 flex items-center gap-1.5 mt-0.5 truncate">
                  <Calendar className="w-3 h-3 shrink-0" />
                  <span>
                    {order.orderNumber} ·{' '}
                    {new Date(order.createdAtMs).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close quick reorder modal"
                className="p-1.5 rounded-lg bg-black/25 hover:bg-black/45 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              <p className="text-xs font-semibold text-[#5a2326] dark:text-red-200/80">
                Review dishes and adjust quantities before adding to your active cart:
              </p>

              {lines.length === 0 ? (
                <div className="py-10 text-center rounded-xl bg-white dark:bg-[#1e080a] border border-red-200 dark:border-red-900/60 p-4">
                  <p className="text-sm font-bold text-[#220709] dark:text-white">
                    No items left in reorder list
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-3 px-4 py-2 rounded-lg bg-red-700 text-white text-xs font-bold cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {lines.map((line) => (
                    <div
                      key={line.id}
                      className="p-3 rounded-xl bg-white dark:bg-[#1e080a] border border-red-200/80 dark:border-red-900/60 flex items-center gap-3"
                    >
                      <img
                        src={line.image}
                        alt={line.name}
                        className="w-14 h-14 rounded-lg object-cover shrink-0 bg-red-100 dark:bg-[#2a0a0d]"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-bold text-xs sm:text-sm text-[#220709] dark:text-white truncate">
                          {line.name}
                        </p>
                        <p className="text-xs font-bold text-red-700 dark:text-amber-300 tabular-nums mt-0.5">
                          {formatPKR(line.price * line.quantity)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateQty(line.id, -1)}
                          aria-label={`Decrease quantity for ${line.name}`}
                          className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-100 flex items-center justify-center cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold tabular-nums text-[#220709] dark:text-white">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(line.id, 1)}
                          aria-label={`Increase quantity for ${line.name}`}
                          className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-100 flex items-center justify-center cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeLine(line.id)}
                          aria-label={`Remove ${line.name}`}
                          className="w-7 h-7 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-red-950 flex items-center justify-center cursor-pointer ml-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {hasExistingCartItems && availableLines.length > 0 && (
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/35 border border-amber-200 dark:border-amber-900/60 text-xs font-semibold text-amber-900 dark:text-amber-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={replaceCart}
                    onChange={(e) => setReplaceCart(e.target.checked)}
                    className="w-4 h-4 accent-red-700 rounded cursor-pointer"
                  />
                  <span>Replace items currently in my active cart instead of merging</span>
                </label>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 bg-white dark:bg-[#1b0709] border-t border-red-200 dark:border-red-900/70 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs sm:text-sm font-semibold text-[#5e292c] dark:text-red-200/80">
                  Items Subtotal ({totalQty} {totalQty === 1 ? 'item' : 'items'})
                </span>
                <span className="font-display font-extrabold text-lg sm:text-xl text-red-700 dark:text-amber-300 tabular-nums">
                  {formatPKR(subtotal)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 rounded-xl bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-100 font-bold text-xs sm:text-sm hover:bg-red-200 dark:hover:bg-red-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={availableLines.length === 0}
                  onClick={handleConfirm}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#b91c1c] to-[#881313] hover:from-[#991b1b] hover:to-[#7f1d1d] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  <span>Add to Active Cart</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
