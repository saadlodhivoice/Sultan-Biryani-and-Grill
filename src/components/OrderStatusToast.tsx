import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Bike,
  CheckCircle2,
  ChefHat,
  PackageCheck,
  ShoppingBag,
  Truck,
  Utensils,
  X,
  XCircle,
} from 'lucide-react';
import type { OrderRecord, OrderStatus } from '../types.ts';

export interface OrderToastItem {
  id: string;
  order: OrderRecord;
  previousStatus: OrderStatus;
  nextStatus: OrderStatus;
  createdAt: number;
}

interface OrderStatusToastProps {
  toasts: OrderToastItem[];
  onDismiss: (id: string) => void;
  onInspectOrder: (order: OrderRecord) => void;
}

const AUTO_DISMISS_MS = 5500;

function getStageMeta(order: OrderRecord, status: OrderStatus) {
  switch (status) {
    case 'confirmed':
      return {
        title: 'Order Confirmed',
        subtitle: `Kitchen ticket created for ${order.orderNumber}`,
        accent: 'from-amber-500 to-red-600',
        badgeClass:
          'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300',
        Icon: CheckCircle2,
      };
    case 'cooking':
      return {
        title: 'Preparing Your Order',
        subtitle: `Chefs are freshly cooking ${order.orderNumber} over charcoal & steam`,
        accent: 'from-orange-500 to-red-700',
        badgeClass:
          'bg-orange-100 text-orange-900 dark:bg-orange-950/60 dark:text-orange-300',
        Icon: ChefHat,
      };
    case 'out_for_delivery':
      if (order.orderType === 'takeaway') {
        return {
          title: 'Ready for Pickup',
          subtitle: `Collect ${order.orderNumber} at 22-B Model Town counter`,
          accent: 'from-sky-500 to-indigo-700',
          badgeClass:
            'bg-sky-100 text-sky-900 dark:bg-sky-950/60 dark:text-sky-300',
          Icon: ShoppingBag,
        };
      }
      if (order.orderType === 'dine_in') {
        return {
          title: 'Serving to Your Table',
          subtitle: `${order.orderNumber} is being brought freshly to your table`,
          accent: 'from-sky-500 to-indigo-700',
          badgeClass:
            'bg-sky-100 text-sky-900 dark:bg-sky-950/60 dark:text-sky-300',
          Icon: Utensils,
        };
      }
      return {
        title: 'Out for Delivery',
        subtitle: `Rider is on the way to ${order.areaName}`,
        accent: 'from-sky-500 to-indigo-700',
        badgeClass:
          'bg-sky-100 text-sky-900 dark:bg-sky-950/60 dark:text-sky-300',
        Icon: Bike,
      };
    case 'delivered':
      return {
        title: order.orderType === 'delivery' ? 'Order Delivered' : 'Order Completed',
        subtitle: `Enjoy your meal from Sultan Biryani & Grill!`,
        accent: 'from-emerald-500 to-teal-700',
        badgeClass:
          'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300',
        Icon: PackageCheck,
      };
    case 'cancelled':
      return {
        title: 'Order Cancelled',
        subtitle: `${order.orderNumber} has been cancelled as requested`,
        accent: 'from-red-600 to-rose-900',
        badgeClass:
          'bg-red-100 text-red-900 dark:bg-red-950/70 dark:text-red-300',
        Icon: XCircle,
      };
  }
}

function ToastCard({
  toast,
  onDismiss,
  onInspectOrder,
}: {
  toast: OrderToastItem;
  onDismiss: (id: string) => void;
  onInspectOrder: (order: OrderRecord) => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onDismiss(toast.id);
    }, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const meta = getStageMeta(toast.order, toast.nextStatus);
  const StageIcon = meta.Icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 48, scale: 0.94 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 48, scale: 0.92 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      role="status"
      aria-live="polite"
      className="pointer-events-auto relative overflow-hidden rounded-2xl bg-white/95 dark:bg-[#1c0709]/95 backdrop-blur-md border border-red-200/90 dark:border-red-900/80 shadow-2xl shadow-red-950/20"
    >
      <div className="p-3.5 sm:p-4 flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.accent} text-white flex items-center justify-center shrink-0 shadow-md`}
        >
          <StageIcon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${meta.badgeClass}`}
            >
              {toast.order.orderNumber}
            </span>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="p-1 -mr-1 rounded-lg text-[#7a4548] dark:text-red-200/70 hover:bg-red-100 dark:hover:bg-red-950 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="mt-1 font-display font-extrabold text-sm text-[#220709] dark:text-white leading-tight">
            {meta.title}
          </p>
          <p className="mt-0.5 text-xs text-[#5d2629] dark:text-red-100/80 leading-snug">
            {meta.subtitle}
          </p>

          <div className="mt-2.5 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                onInspectOrder(toast.order);
                onDismiss(toast.id);
              }}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-red-700 dark:text-amber-300 hover:underline underline-offset-2 cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 shrink-0" />
              <span>View Live Tracking</span>
            </button>
          </div>
        </div>
      </div>

      {/* Auto-dismiss countdown progress bar */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: AUTO_DISMISS_MS / 1000, ease: 'linear' }}
        style={{ transformOrigin: 'left center' }}
        className={`h-1 w-full bg-gradient-to-r ${meta.accent}`}
      />
    </motion.div>
  );
}

export function OrderStatusToast({
  toasts,
  onDismiss,
  onInspectOrder,
}: OrderStatusToastProps) {
  return (
    <div
      aria-label="Order status notifications"
      className="fixed top-20 right-3 sm:right-6 z-[70] w-[calc(100vw-1.5rem)] max-w-sm pointer-events-none flex flex-col gap-2.5"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <ToastCard
            key={toast.id}
            toast={toast}
            onDismiss={onDismiss}
            onInspectOrder={onInspectOrder}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
