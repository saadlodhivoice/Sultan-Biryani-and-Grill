import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Bike,
  CheckCircle2,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Utensils,
  X,
} from 'lucide-react';
import { MULTAN_AREAS, formatPKR } from '../data/multanAreas.ts';
import { GoogleLogoSvg } from './AuthModal.tsx';
import type {
  CartItem,
  MultanArea,
  OrderRecord,
  OrderType,
  SavedAddress,
  UserProfile,
} from '../types.ts';

interface CartDrawerProps {
  open: boolean;
  items: CartItem[];
  orderType: OrderType;
  selectedArea: MultanArea;
  detectedCoords?: { lat: number; lng: number };
  user: UserProfile | null;
  savedAddresses: SavedAddress[];
  onClose: () => void;
  onUpdateQty: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  onChangeOrderType: (t: OrderType) => void;
  onChangeArea: (area: MultanArea) => void;
  onOpenAuth: () => void;
  onPlaceOrder: (payload: {
    customerName: string;
    customerPhone: string;
    orderType: OrderType;
    areaName: string;
    deliveryAddress: string;
    notes: string;
    deliveryFee: number;
    estimatedMinutes: number;
  }) => Promise<OrderRecord>;
}

export function CartDrawer({
  open,
  items,
  orderType,
  selectedArea,
  detectedCoords,
  user,
  savedAddresses,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onChangeOrderType,
  onChangeArea,
  onOpenAuth,
  onPlaceOrder,
}: CartDrawerProps) {
  const [customerName, setCustomerName] = useState(user?.displayName ?? '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(orderType === 'delivery' ? 90 : 0);
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [loadingFee, setLoadingFee] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user?.displayName && !customerName) {
      setCustomerName(user.displayName);
    }
    if ((user?.phone || user?.whatsapp) && !customerPhone) {
      setCustomerPhone(user.phone || user.whatsapp || '');
    }
  }, [user, customerName, customerPhone]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const fetchFee = async () => {
      setLoadingFee(true);
      try {
        const res = await fetch('/api/delivery-fee', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderType,
            areaId: selectedArea.id,
            lat: detectedCoords?.lat,
            lng: detectedCoords?.lng,
          }),
        });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setDeliveryFee(Number(data.deliveryFee ?? 0));
          setEstimatedMinutes(Number(data.estimatedMinutes ?? 30));
        }
      } catch {
        if (!cancelled) {
          setDeliveryFee(orderType === 'delivery' ? 120 : 0);
        }
      } finally {
        if (!cancelled) setLoadingFee(false);
      }
    };
    void fetchFee();
    return () => {
      cancelled = true;
    };
  }, [open, orderType, selectedArea.id, detectedCoords]);

  const subtotal = items.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
  const effectiveDeliveryFee = orderType === 'delivery' && items.length > 0 ? deliveryFee : 0;
  const total = subtotal + effectiveDeliveryFee;

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    const cleanName = customerName.trim();
    const cleanPhone = customerPhone.trim();
    const cleanAddress =
      orderType === 'delivery'
        ? streetAddress.trim()
        : orderType === 'takeaway'
          ? 'Self Pickup — 22-B Model Town Market, Multan'
          : 'Dine-In Table — 22-B Model Town Market, Multan';

    if (!cleanName || cleanPhone.length < 7) {
      setErrorMsg('Please enter your full name and a valid mobile number.');
      return;
    }
    if (orderType === 'delivery' && cleanAddress.length < 3) {
      setErrorMsg('Please enter your complete street/house address in Multan.');
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);
    try {
      await onPlaceOrder({
        customerName: cleanName.slice(0, 100),
        customerPhone: cleanPhone.slice(0, 20),
        orderType,
        areaName: selectedArea.name,
        deliveryAddress: cleanAddress.slice(0, 300),
        notes: notes.trim().slice(0, 300),
        deliveryFee: effectiveDeliveryFee,
        estimatedMinutes,
      });
    } catch {
      setErrorMsg('Unable to place order right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-sm">
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md h-full flex flex-col bg-[#fff8f8] dark:bg-[#140507] border-l border-red-200 dark:border-red-900/70 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-[#7f1d1d] via-[#b91c1c] to-[#991b1b] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-amber-300" />
                <h2 className="font-display font-extrabold text-lg">Your Order Bag</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close cart"
                className="p-1.5 rounded-lg bg-black/25 hover:bg-black/45 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <ShoppingBag className="w-14 h-14 text-red-300 dark:text-red-800 mb-3" />
                <h3 className="font-display font-bold text-lg text-[#220709] dark:text-white">
                  Your bag is empty
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-[#6e3a3d] dark:text-red-200/70 max-w-xs">
                  Add steaming biryani, charcoal BBQ, or crispy wraps to start your order.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#b91c1c] to-[#881313] text-white text-xs font-bold cursor-pointer"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <form onSubmit={handleCheckoutSubmit} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Cart Items */}
                  <div className="space-y-2.5">
                    {items.map(({ item, quantity }) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-white dark:bg-[#1c0709] border border-red-200/80 dark:border-red-900/60 flex items-center gap-3"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-14 h-14 rounded-lg object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-display font-bold text-xs sm:text-sm text-[#220709] dark:text-white truncate">
                            {item.name}
                          </p>
                          <p className="text-xs font-bold text-red-700 dark:text-amber-300 tabular-nums mt-0.5">
                            {formatPKR(item.price * quantity)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.id, -1)}
                            aria-label="Decrease quantity"
                            className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-100 flex items-center justify-center cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold tabular-nums text-[#220709] dark:text-white">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.id, 1)}
                            aria-label="Increase quantity"
                            className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-100 flex items-center justify-center cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.id)}
                            aria-label="Remove item"
                            className="w-7 h-7 rounded-lg text-red-500 hover:bg-red-100 dark:hover:bg-red-950 flex items-center justify-center cursor-pointer ml-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Mode Selector */}
                  <div>
                    <label className="block text-xs font-bold text-[#4e1e21] dark:text-red-100 mb-1.5">
                      Order Service
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-red-100/80 dark:bg-red-950/60 border border-red-200 dark:border-red-900/50">
                      {(
                        [
                          { id: 'delivery', label: 'Delivery', icon: Bike },
                          { id: 'takeaway', label: 'Takeaway', icon: ShoppingBag },
                          { id: 'dine_in', label: 'Dine-In', icon: Utensils },
                        ] as const
                      ).map(({ id, label, icon: Icon }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => onChangeOrderType(id)}
                          className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                            orderType === id
                              ? 'bg-gradient-to-r from-[#b91c1c] to-[#881313] text-white shadow'
                              : 'text-[#5b2226] dark:text-red-200'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Google Sync Prompt if not signed in */}
                  {!user && (
                    <div className="p-3 rounded-xl bg-white dark:bg-[#1d080b] border border-red-200 dark:border-red-900/60 flex items-center justify-between gap-2">
                      <span className="text-xs text-[#5d2629] dark:text-red-100/85">
                        Sign in to save order &amp; track in Dashboard
                      </span>
                      <button
                        type="button"
                        onClick={onOpenAuth}
                        className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-[#2a0c10] border border-red-200 dark:border-red-800 text-xs font-bold text-[#220709] dark:text-white flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <GoogleLogoSvg className="w-3.5 h-3.5" />
                        <span>Google Sign In</span>
                      </button>
                    </div>
                  )}

                  {/* Quick Pick Saved Address */}
                  {orderType === 'delivery' && savedAddresses.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-[#4e1e21] dark:text-red-100 mb-1.5">
                        Saved Multan Addresses
                      </p>
                      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {savedAddresses.map((addr) => (
                          <button
                            key={addr.id}
                            type="button"
                            onClick={() => {
                              const found = MULTAN_AREAS.find((a) => a.name === addr.areaName);
                              if (found) onChangeArea(found);
                              setStreetAddress(addr.streetAddress);
                              setCustomerPhone(addr.phone);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#1e080b] border border-red-200 dark:border-red-800 text-xs font-semibold text-[#220709] dark:text-white whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer hover:border-red-600"
                          >
                            <MapPin className="w-3 h-3 text-red-600" />
                            <span>{addr.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Customer Checkout Details */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold mb-1 text-[#5a2326] dark:text-red-200">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          maxLength={100}
                          placeholder="Your name"
                          required
                          className="w-full h-10 px-3 rounded-lg bg-white dark:bg-[#1e080a] border border-red-200 dark:border-red-900 text-xs sm:text-sm text-[#220709] dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold mb-1 text-[#5a2326] dark:text-red-200">
                          Mobile Number
                        </label>
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          maxLength={20}
                          placeholder="03XX-XXXXXXX"
                          required
                          className="w-full h-10 px-3 rounded-lg bg-white dark:bg-[#1e080a] border border-red-200 dark:border-red-900 text-xs sm:text-sm text-[#220709] dark:text-white"
                        />
                      </div>
                    </div>

                    {orderType === 'delivery' && (
                      <>
                        <div>
                          <label className="block text-[11px] font-semibold mb-1 text-[#5a2326] dark:text-red-200">
                            Delivery Area (Multan)
                          </label>
                          <select
                            value={selectedArea.id}
                            onChange={(e) => {
                              const found = MULTAN_AREAS.find((a) => a.id === e.target.value);
                              if (found) onChangeArea(found);
                            }}
                            className="w-full h-10 px-3 rounded-lg bg-white dark:bg-[#1e080a] border border-red-200 dark:border-red-900 text-xs sm:text-sm text-[#220709] dark:text-white"
                          >
                            {MULTAN_AREAS.map((area) => (
                              <option key={area.id} value={area.id}>
                                {area.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold mb-1 text-[#5a2326] dark:text-red-200">
                            House / Street / Landmark
                          </label>
                          <input
                            type="text"
                            value={streetAddress}
                            onChange={(e) => setStreetAddress(e.target.value)}
                            maxLength={300}
                            placeholder="House #, Block / Street, near landmark..."
                            required
                            className="w-full h-10 px-3 rounded-lg bg-white dark:bg-[#1e080a] border border-red-200 dark:border-red-900 text-xs sm:text-sm text-[#220709] dark:text-white"
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-[11px] font-semibold mb-1 text-[#5a2326] dark:text-red-200">
                        Kitchen Notes (Optional)
                      </label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        maxLength={300}
                        placeholder="Spice preference, extra raita..."
                        className="w-full h-10 px-3 rounded-lg bg-white dark:bg-[#1e080a] border border-red-200 dark:border-red-900 text-xs sm:text-sm text-[#220709] dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Cash on Delivery Notice */}
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/35 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-2.5 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>
                      {orderType === 'delivery'
                        ? 'Cash on Delivery · Live order tracking activates upon confirmation'
                        : 'Pay at Counter · Instant kitchen ticket generated on confirmation'}
                    </span>
                  </div>

                  {errorMsg && (
                    <p className="text-xs font-semibold text-red-700 dark:text-amber-300">
                      {errorMsg}
                    </p>
                  )}
                </div>

                {/* Sticky Checkout Summary Footer */}
                <div className="p-4 bg-white dark:bg-[#1b0709] border-t border-red-200 dark:border-red-900/70 space-y-2.5">
                  <div className="space-y-1 text-xs sm:text-sm">
                    <div className="flex justify-between text-[#5e292c] dark:text-red-200/80">
                      <span>Items Subtotal</span>
                      <span className="tabular-nums font-semibold">{formatPKR(subtotal)}</span>
                    </div>
                    {orderType === 'delivery' && (
                      <div className="flex justify-between text-[#5e292c] dark:text-red-200/80">
                        <span>Delivery Charges ({selectedArea.name})</span>
                        <span className="tabular-nums font-semibold">
                          {loadingFee ? 'Calculating...' : formatPKR(effectiveDeliveryFee)}
                        </span>
                      </div>
                    )}
                    <div className="pt-1.5 border-t border-red-100 dark:border-red-950 flex justify-between items-baseline">
                      <span className="font-display font-bold text-base text-[#220709] dark:text-white">
                        Total Payable
                      </span>
                      <span className="font-display font-extrabold text-xl text-red-700 dark:text-amber-300 tabular-nums">
                        {formatPKR(total)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || loadingFee}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#b91c1c] to-[#881313] hover:from-[#991b1b] hover:to-[#7f1d1d] text-white font-bold text-sm shadow-lg shadow-red-950/30 transition-transform active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                  >
                    {submitting
                      ? 'Confirming Order...'
                      : `Place COD Order · ${formatPKR(total)}`}
                  </button>
                </div>
              </form>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
