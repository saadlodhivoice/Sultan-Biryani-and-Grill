import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Bike,
  CheckCircle2,
  ChefHat,
  Clock,
  MapPin,
  PackageCheck,
  Phone,
  X,
} from 'lucide-react';
import { RESTAURANT_LOCATION, formatPKR } from '../data/multanAreas.ts';
import { trackConversionEvent } from '../lib/analytics.ts';
import type { OrderRecord, OrderStatus } from '../types.ts';

interface OrderTrackingModalProps {
  order: OrderRecord | null;
  open: boolean;
  onClose: () => void;
  onAdvanceStatus: (orderId: string, nextStatus: OrderStatus) => Promise<void>;
}

const STAGES: { key: OrderStatus; label: string; sub: string; icon: typeof CheckCircle2 }[] = [
  {
    key: 'confirmed',
    label: 'Confirmed',
    sub: 'Ticket sent to kitchen',
    icon: CheckCircle2,
  },
  {
    key: 'cooking',
    label: 'Cooking',
    sub: 'Preparing fresh over flame',
    icon: ChefHat,
  },
  {
    key: 'out_for_delivery',
    label: 'Out for Delivery',
    sub: 'Rider is on the way',
    icon: Bike,
  },
  {
    key: 'delivered',
    label: 'Delivered',
    sub: 'Enjoy your meal',
    icon: PackageCheck,
  },
];

export function OrderTrackingModal({
  order,
  open,
  onClose,
  onAdvanceStatus,
}: OrderTrackingModalProps) {
  // Smooth automatic progression while order is active so the user sees live animated stage transitions
  useEffect(() => {
    if (!open || !order) return;
    if (order.status === 'delivered' || order.status === 'cancelled') return;

    const nextMap: Partial<Record<OrderStatus, OrderStatus>> = {
      confirmed: 'cooking',
      cooking: 'out_for_delivery',
      out_for_delivery: 'delivered',
    };
    const nextStatus = nextMap[order.status];
    if (!nextStatus) return;

    const timer = window.setTimeout(() => {
      void onAdvanceStatus(order.id, nextStatus);
    }, 5500);

    return () => window.clearTimeout(timer);
  }, [open, order, onAdvanceStatus]);

  if (!order) return null;

  const activeStageIdx = Math.max(
    0,
    STAGES.findIndex((s) => s.key === order.status)
  );
  const progressPercent = ((activeStageIdx + 1) / STAGES.length) * 100;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-lg rounded-2xl overflow-hidden bg-[#fff8f8] dark:bg-[#170608] border border-red-200 dark:border-red-900/70 shadow-2xl max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-[#7f1d1d] via-[#b91c1c] to-[#991b1b] text-white flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">
                  Live Order Tracking
                </p>
                <h2 className="font-display font-extrabold text-lg sm:text-xl tabular-nums">
                  {order.orderNumber}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close tracking modal"
                className="p-2 rounded-lg bg-black/25 hover:bg-black/45 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5">
              {/* Animated Progress Bar (Framer Motion) */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#22090c] border border-red-200 dark:border-red-900/60">
                <div className="flex items-center justify-between text-xs font-bold mb-2.5">
                  <span className="text-[#220709] dark:text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-red-700 dark:text-amber-300" />
                    <span>
                      {order.status === 'delivered'
                        ? 'Order Completed'
                        : `Estimated Time: ${order.estimatedMinutes} mins`}
                    </span>
                  </span>
                  <span className="text-red-700 dark:text-amber-300 tabular-nums">
                    {Math.round(progressPercent)}%
                  </span>
                </div>

                {/* Progress Track */}
                <div className="h-2.5 w-full rounded-full bg-red-100 dark:bg-red-950 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full bg-gradient-to-r from-[#dc2626] via-[#ef4444] to-amber-400"
                  />
                </div>

                {/* Stage Steps */}
                <div className="mt-5 grid grid-cols-4 gap-1.5">
                  {STAGES.map((stage, idx) => {
                    const Icon = stage.icon;
                    const completed = idx <= activeStageIdx;
                    const isCurrent = idx === activeStageIdx;
                    const label =
                      stage.key === 'out_for_delivery' && order.orderType !== 'delivery'
                        ? order.orderType === 'takeaway'
                          ? 'Ready'
                          : 'Serving'
                        : stage.label;
                    return (
                      <div key={stage.key} className="flex flex-col items-center text-center">
                        <motion.div
                          animate={{
                            scale: isCurrent ? [1, 1.12, 1] : 1,
                          }}
                          transition={{
                            repeat: isCurrent && order.status !== 'delivered' ? Infinity : 0,
                            duration: 1.8,
                          }}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                            completed
                              ? 'bg-gradient-to-br from-[#b91c1c] to-[#881313] text-white shadow-md'
                              : 'bg-red-100 dark:bg-red-950 text-red-400 dark:text-red-700'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </motion.div>
                        <p
                          className={`mt-1.5 text-[11px] font-bold leading-tight ${
                            completed
                              ? 'text-[#220709] dark:text-white'
                              : 'text-[#8e575b] dark:text-red-200/45'
                          }`}
                        >
                          {label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delivery / Customer Details */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#22090c] border border-red-200 dark:border-red-900/60 space-y-2 text-xs">
                <div className="flex items-start gap-2 text-[#3c1215] dark:text-red-100">
                  <MapPin className="w-4 h-4 text-red-700 dark:text-amber-300 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">
                      {order.customerName} · {order.customerPhone}
                    </p>
                    <p className="text-[#6e3a3d] dark:text-red-200/75 mt-0.5">
                      {order.deliveryAddress} ({order.areaName})
                    </p>
                  </div>
                </div>
              </div>

              {/* Receipt Breakdown */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#22090c] border border-red-200 dark:border-red-900/60 space-y-2 text-xs">
                <p className="font-display font-bold text-sm text-[#220709] dark:text-white">
                  Order Summary (Cash on Delivery)
                </p>
                <div className="divide-y divide-red-100 dark:divide-red-950">
                  {order.items.map((line) => (
                    <div key={line.id} className="py-1.5 flex justify-between gap-2 text-[#45171a] dark:text-red-100/90">
                      <span>
                        {line.quantity}x {line.name}
                      </span>
                      <span className="tabular-nums font-semibold">
                        {formatPKR(line.price * line.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-red-200 dark:border-red-900 space-y-1">
                  <div className="flex justify-between text-[#6b3438] dark:text-red-200/75">
                    <span>Subtotal</span>
                    <span className="tabular-nums">{formatPKR(order.subtotal)}</span>
                  </div>
                  {order.deliveryFee > 0 && (
                    <div className="flex justify-between text-[#6b3438] dark:text-red-200/75">
                      <span>Delivery Fee</span>
                      <span className="tabular-nums">{formatPKR(order.deliveryFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-display font-extrabold text-base text-red-700 dark:text-amber-300 pt-1">
                    <span>Total Payable</span>
                    <span className="tabular-nums">{formatPKR(order.totalAmount)}</span>
                  </div>
                </div>
              </div>

              <a
                href={`https://wa.me/${RESTAURANT_LOCATION.whatsappNumber}?text=${encodeURIComponent(
                  `Hello Sultan Biryani and Grill, checking status for Order ${order.orderNumber}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackConversionEvent('whatsapp_order_click', 'order_tracking_modal', {
                    orderNumber: order.orderNumber,
                    orderStatus: order.status,
                  })
                }
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>Need Help? Message Kitchen on WhatsApp</span>
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
