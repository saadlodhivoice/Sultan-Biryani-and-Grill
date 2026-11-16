import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, LocateFixed, MapPin, Search, Utensils, ShoppingBag, Bike, X } from 'lucide-react';
import { MULTAN_AREAS } from '../data/multanAreas.ts';
import type { MultanArea, OrderType } from '../types.ts';

interface LocationModalProps {
  open: boolean;
  initialOrderType: OrderType;
  initialAreaId: string;
  canDismiss: boolean;
  onClose: () => void;
  onConfirm: (orderType: OrderType, area: MultanArea, coords?: { lat: number; lng: number }) => void;
}

export function LocationModal({
  open,
  initialOrderType,
  initialAreaId,
  canDismiss,
  onClose,
  onConfirm,
}: LocationModalProps) {
  const [orderType, setOrderType] = useState<OrderType>(initialOrderType);
  const [selectedAreaId, setSelectedAreaId] = useState<string>(initialAreaId || MULTAN_AREAS[0].id);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [areaSearch, setAreaSearch] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [detectMsg, setDetectMsg] = useState<string | null>(null);
  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lng: number } | undefined>(
    undefined
  );

  const selectedArea = useMemo(
    () => MULTAN_AREAS.find((a) => a.id === selectedAreaId) ?? MULTAN_AREAS[0],
    [selectedAreaId]
  );

  const filteredAreas = useMemo(() => {
    const q = areaSearch.trim().toLowerCase();
    if (!q) return MULTAN_AREAS;
    return MULTAN_AREAS.filter(
      (a) => a.name.toLowerCase().includes(q) || a.zone.toLowerCase().includes(q)
    );
  }, [areaSearch]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setDetectMsg('Geolocation is not supported by your browser. Please pick your Multan area below.');
      return;
    }
    setDetecting(true);
    setDetectMsg(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setDetectedCoords({ lat, lng });
        try {
          const res = await fetch('/api/resolve-area', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat, lng }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.area?.id) {
              setSelectedAreaId(data.area.id);
              setDetectMsg(
                data.inMultanRange
                  ? `Detected nearest area: ${data.area.name}`
                  : `Closest Multan hub set to ${data.area.name}`
              );
            }
          }
        } catch {
          setDetectMsg('Location detected. Please confirm your Multan neighborhood below.');
        } finally {
          setDetecting(false);
        }
      },
      () => {
        setDetecting(false);
        setDetectMsg('Location permission declined. Please select your Multan area manually.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmit = () => {
    onConfirm(orderType, selectedArea, detectedCoords);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md rounded-2xl overflow-hidden bg-[#fff9f9] dark:bg-[#190608] border border-red-200 dark:border-red-900/70 shadow-2xl"
          >
            {/* Brand Crimson Header Band */}
            <div className="relative h-20 bg-gradient-to-r from-[#7f1d1d] via-[#b91c1c] to-[#991b1b] flex items-center justify-center">
              {canDismiss && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close location modal"
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-black/25 hover:bg-black/45 text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <div className="translate-y-7 w-20 h-20 rounded-full p-1 bg-white dark:bg-[#190608] shadow-xl">
                <img
                  src="/assets/aistudio/Sultan_Biryani_and_Grill_3fdb02a0.png"
                  alt="Sultan Biryani and Grill"
                  className="w-full h-full rounded-full object-cover bg-black"
                />
              </div>
            </div>

            <div className="pt-11 pb-6 px-5 sm:px-6 text-center">
              <h2 className="font-display text-xl font-extrabold text-[#220709] dark:text-white">
                Select Your Order Type
              </h2>
              <p className="mt-1 text-xs text-[#6f3337] dark:text-red-200/75">
                22-B, Model Town Market · Multan
              </p>

              {/* Order Type Segmented Buttons */}
              <div className="mt-4 grid grid-cols-3 gap-2 p-1 rounded-xl bg-red-100/80 dark:bg-red-950/60 border border-red-200 dark:border-red-900/50">
                {(
                  [
                    { id: 'delivery', label: 'Delivery', icon: Bike },
                    { id: 'takeaway', label: 'Takeaway', icon: ShoppingBag },
                    { id: 'dine_in', label: 'Dine-In', icon: Utensils },
                  ] as const
                ).map(({ id, label, icon: Icon }) => {
                  const active = orderType === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setOrderType(id)}
                      className={`py-2.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                        active
                          ? 'bg-gradient-to-r from-[#b91c1c] to-[#991b1b] text-white shadow-md'
                          : 'text-[#5b2226] dark:text-red-200 hover:bg-white/60 dark:hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Use Current Location Button */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={detecting}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-amber-300 border border-red-300 dark:border-red-800 hover:bg-red-200/70 dark:hover:bg-red-900/70 transition-colors cursor-pointer disabled:opacity-60"
                >
                  <LocateFixed className={`w-3.5 h-3.5 ${detecting ? 'animate-spin' : ''}`} />
                  <span>{detecting ? 'Getting Location...' : 'Use Current Location'}</span>
                </button>
                {detectMsg && (
                  <p className="mt-2 text-xs text-red-700 dark:text-amber-300 font-medium">
                    {detectMsg}
                  </p>
                )}
              </div>

              {/* Complete Multan Areas Dropdown */}
              <div className="mt-4 text-left relative">
                <label className="block text-xs font-semibold text-[#5a2326] dark:text-red-200/80 mb-1.5">
                  Please select your Multan area
                </label>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="w-full h-11 px-3.5 rounded-xl bg-white dark:bg-[#240a0d] border border-red-300 dark:border-red-800/80 flex items-center justify-between gap-2 text-sm font-medium text-[#220709] dark:text-white cursor-pointer"
                >
                  <span className="flex items-center gap-2 truncate">
                    <MapPin className="w-4 h-4 text-red-700 dark:text-red-400 shrink-0" />
                    <span className="truncate">{selectedArea.name}</span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-red-700 dark:text-red-300 shrink-0 transition-transform ${
                      dropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {dropdownOpen && (
                  <div className="mt-2 rounded-xl bg-white dark:bg-[#23090c] border border-red-200 dark:border-red-800 shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-red-100 dark:border-red-900/60 flex items-center gap-2">
                      <Search className="w-4 h-4 text-red-500 shrink-0" />
                      <input
                        type="text"
                        value={areaSearch}
                        onChange={(e) => setAreaSearch(e.target.value)}
                        placeholder="Search Multan areas..."
                        className="w-full bg-transparent text-xs sm:text-sm text-[#220709] dark:text-white placeholder:text-red-400 focus:outline-none"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto divide-y divide-red-50 dark:divide-red-950/60">
                      {filteredAreas.map((area) => {
                        const isSelected = area.id === selectedArea.id;
                        return (
                          <button
                            key={area.id}
                            type="button"
                            onClick={() => {
                              setSelectedAreaId(area.id);
                              setDetectedCoords(undefined);
                              setDropdownOpen(false);
                            }}
                            className={`w-full px-3.5 py-2.5 text-left text-xs sm:text-sm flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-red-700 text-white font-semibold'
                                : 'text-[#2a0709] dark:text-red-50 hover:bg-red-50 dark:hover:bg-red-950/70'
                            }`}
                          >
                            <span className="truncate">{area.name}</span>
                            <span
                              className={`text-[11px] shrink-0 ${
                                isSelected ? 'text-red-100' : 'text-red-500/80 dark:text-red-300/70'
                              }`}
                            >
                              {area.zone}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-[#b91c1c] to-[#881313] hover:from-[#991b1b] hover:to-[#7f1d1d] text-white font-bold text-sm shadow-lg shadow-red-950/25 transition-transform active:scale-[0.98] cursor-pointer whitespace-nowrap"
              >
                Confirm &amp; Browse Menu
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
