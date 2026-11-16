import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BarChart3,
  Bell,
  Check,
  Edit3,
  Lock,
  LogOut,
  MapPin,
  Minus,
  Moon,
  Package,
  Pencil,
  Phone,
  Plus,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  Sun,
  Trash2,
  Truck,
  User,
  X,
} from 'lucide-react';
import {
  MULTAN_AREAS,
  RESTAURANT_LOCATION,
  formatPKR,
  haversineDistanceKm,
} from '../data/multanAreas.ts';
import type {
  OrderItemLine,
  OrderRecord,
  OrderType,
  SavedAddress,
  UserProfile,
} from '../types.ts';

interface CustomerDashboardProps {
  open: boolean;
  user: UserProfile | null;
  orders: OrderRecord[];
  addresses: SavedAddress[];
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onClose: () => void;
  onSignOut: () => Promise<void>;
  onTrackOrder: (order: OrderRecord) => void;
  onReorder: (order: OrderRecord) => void;
  onUpdateProfile: (patch: {
    displayName: string;
    phone: string;
    whatsapp: string;
    defaultArea: string;
    preferredOrderType: OrderType;
  }) => Promise<void>;
  onEditOrder: (
    orderId: string,
    patch: {
      customerName: string;
      customerPhone: string;
      orderType: OrderType;
      areaName: string;
      deliveryAddress: string;
      notes: string;
      items: OrderItemLine[];
      subtotal: number;
      deliveryFee: number;
      totalAmount: number;
    }
  ) => Promise<void>;
  onCancelOrder: (orderId: string) => Promise<void>;
  onAddAddress: (addr: Omit<SavedAddress, 'id' | 'userId'>) => Promise<void>;
  onUpdateAddress: (
    id: string,
    addr: Omit<SavedAddress, 'id' | 'userId'>
  ) => Promise<void>;
  onDeleteAddress: (id: string) => Promise<void>;
}

const STATUS_LABELS: Record<OrderRecord['status'], string> = {
  confirmed: 'Order Confirmed',
  cooking: 'Preparing / Cooking',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const ORDER_ALERTS_KEY = 'sultan_order_alerts_v1';

type DashboardTab = 'orders' | 'profile' | 'addresses' | 'settings';

export function CustomerDashboard({
  open,
  user,
  orders,
  addresses,
  theme,
  onToggleTheme,
  onClose,
  onSignOut,
  onTrackOrder,
  onReorder,
  onUpdateProfile,
  onEditOrder,
  onCancelOrder,
  onAddAddress,
  onUpdateAddress,
  onDeleteAddress,
}: CustomerDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('orders');

  // Profile state
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileWhatsapp, setProfileWhatsapp] = useState('');
  const [profileArea, setProfileArea] = useState(MULTAN_AREAS[0].name);
  const [profileOrderType, setProfileOrderType] = useState<OrderType>('delivery');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);

  // Address Add/Edit state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrLabel, setAddrLabel] = useState('Home');
  const [addrAreaId, setAddrAreaId] = useState(MULTAN_AREAS[0].id);
  const [addrStreet, setAddrStreet] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [savingAddr, setSavingAddr] = useState(false);

  // Order Edit state (Only allowed while status === 'confirmed')
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerPhone, setEditCustomerPhone] = useState('');
  const [editAreaName, setEditAreaName] = useState(MULTAN_AREAS[0].name);
  const [editDeliveryAddress, setEditDeliveryAddress] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editItems, setEditItems] = useState<OrderItemLine[]>([]);
  const [editDeliveryFee, setEditDeliveryFee] = useState(0);
  const [savingOrderEdit, setSavingOrderEdit] = useState(false);
  const [orderEditError, setOrderEditError] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  // Settings preference
  const [orderAlertsEnabled, setOrderAlertsEnabled] = useState<boolean>(() => {
    return localStorage.getItem(ORDER_ALERTS_KEY) !== 'false';
  });

  useEffect(() => {
    if (!user) return;
    setProfileName(user.displayName || '');
    setProfilePhone(user.phone || '');
    setProfileWhatsapp(user.whatsapp || user.phone || '');
    setProfileArea(user.defaultArea || MULTAN_AREAS[0].name);
    setProfileOrderType(user.preferredOrderType || 'delivery');
  }, [user]);

  const activeOrders = useMemo(
    () => orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled'),
    [orders]
  );

  const validOrders = useMemo(
    () => orders.filter((o) => o.status !== 'cancelled'),
    [orders]
  );

  const totalSpent = useMemo(
    () => validOrders.reduce((sum, o) => sum + o.totalAmount, 0),
    [validOrders]
  );

  // Aggregate monthly spending patterns for Recharts over the recent 6 months
  const monthlyChartData = useMemo(() => {
    const monthBuckets = new Map<
      string,
      { key: string; month: string; spent: number; ordersCount: number; sortKey: number }
    >();

    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthBuckets.set(key, {
        key,
        month: label,
        spent: 0,
        ordersCount: 0,
        sortKey: d.getTime(),
      });
    }

    for (const o of validOrders) {
      const d = new Date(o.createdAtMs);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const existing = monthBuckets.get(key);
      if (existing) {
        existing.spent += o.totalAmount;
        existing.ordersCount += 1;
      } else {
        monthBuckets.set(key, {
          key,
          month: label,
          spent: o.totalAmount,
          ordersCount: 1,
          sortKey: new Date(d.getFullYear(), d.getMonth(), 1).getTime(),
        });
      }
    }

    return Array.from(monthBuckets.values()).sort((a, b) => a.sortKey - b.sortKey);
  }, [validOrders]);

  if (!user) return null;

  const beginEditOrder = (order: OrderRecord) => {
    if (order.status !== 'confirmed') return;
    setEditingOrderId(order.id);
    setEditCustomerName(order.customerName);
    setEditCustomerPhone(order.customerPhone);
    setEditAreaName(order.areaName);
    setEditDeliveryAddress(order.deliveryAddress);
    setEditNotes(order.notes ?? '');
    setEditItems(order.items.map((l) => ({ ...l })));
    setEditDeliveryFee(order.deliveryFee);
    setOrderEditError(null);
  };

  const handleEditAreaChange = async (nextAreaName: string, orderType: OrderType) => {
    setEditAreaName(nextAreaName);
    if (orderType !== 'delivery') {
      setEditDeliveryFee(0);
      return;
    }
    const found = MULTAN_AREAS.find((a) => a.name === nextAreaName);
    if (!found) return;
    try {
      const res = await fetch('/api/delivery-fee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderType: 'delivery', areaId: found.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setEditDeliveryFee(Number(data.deliveryFee ?? 0));
      }
    } catch {
      // Keep existing fee if network unavailable
    }
  };

  const handleAdjustEditItemQty = (itemId: string, delta: number) => {
    setEditItems((prev) => {
      const next = prev
        .map((line) =>
          line.id === itemId
            ? { ...line, quantity: Math.max(0, line.quantity + delta) }
            : line
        )
        .filter((line) => line.quantity > 0);
      return next.length > 0 ? next : prev;
    });
  };

  const handleSaveOrderEdits = async (order: OrderRecord) => {
    if (order.status !== 'confirmed') {
      setOrderEditError('Order is already being prepared and can no longer be edited.');
      return;
    }
    const cleanName = editCustomerName.trim();
    const cleanPhone = editCustomerPhone.trim();
    const cleanAddr = editDeliveryAddress.trim();
    if (!cleanName || cleanPhone.length < 7) {
      setOrderEditError('Please enter a valid customer name and phone number.');
      return;
    }
    if (!cleanAddr) {
      setOrderEditError('Delivery address cannot be empty.');
      return;
    }
    if (editItems.length === 0) {
      setOrderEditError('At least one dish must remain in the order.');
      return;
    }

    const nextSubtotal = editItems.reduce((sum, l) => sum + l.price * l.quantity, 0);
    const nextFee = order.orderType === 'delivery' ? editDeliveryFee : 0;
    const nextTotal = Math.max(0, nextSubtotal + nextFee - (order.discountAmount || 0));

    setSavingOrderEdit(true);
    setOrderEditError(null);
    try {
      await onEditOrder(order.id, {
        customerName: cleanName.slice(0, 100),
        customerPhone: cleanPhone.slice(0, 20),
        orderType: order.orderType,
        areaName: editAreaName.slice(0, 100),
        deliveryAddress: cleanAddr.slice(0, 300),
        notes: editNotes.trim().slice(0, 300),
        items: editItems,
        subtotal: nextSubtotal,
        deliveryFee: nextFee,
        totalAmount: nextTotal,
      });
      setEditingOrderId(null);
    } catch {
      setOrderEditError('Unable to update order right now. Please try again.');
    } finally {
      setSavingOrderEdit(false);
    }
  };

  const handleCancelConfirmedOrder = async (order: OrderRecord) => {
    if (order.status !== 'confirmed') return;
    setCancellingOrderId(order.id);
    try {
      await onCancelOrder(order.id);
      if (editingOrderId === order.id) setEditingOrderId(null);
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleSaveProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;
    setSavingProfile(true);
    setProfileFeedback(null);
    try {
      await onUpdateProfile({
        displayName: profileName.trim().slice(0, 100),
        phone: profilePhone.trim().slice(0, 20),
        whatsapp: profileWhatsapp.trim().slice(0, 20),
        defaultArea: profileArea,
        preferredOrderType: profileOrderType,
      });
      setProfileFeedback('Profile details updated.');
      window.setTimeout(() => setProfileFeedback(null), 3200);
    } finally {
      setSavingProfile(false);
    }
  };

  const openNewAddressForm = () => {
    setEditingAddressId(null);
    setAddrLabel('Home');
    setAddrAreaId(MULTAN_AREAS[0].id);
    setAddrStreet('');
    setAddrPhone(user.phone || user.whatsapp || '');
    setShowAddForm(true);
  };

  const beginEditAddress = (addr: SavedAddress) => {
    setEditingAddressId(addr.id);
    setAddrLabel(addr.label);
    const found = MULTAN_AREAS.find((a) => a.name === addr.areaName);
    setAddrAreaId(found?.id ?? MULTAN_AREAS[0].id);
    setAddrStreet(addr.streetAddress);
    setAddrPhone(addr.phone);
    setShowAddForm(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addrStreet.trim().length < 3 || addrPhone.trim().length < 7) return;
    const area = MULTAN_AREAS.find((a) => a.id === addrAreaId) ?? MULTAN_AREAS[0];
    const distanceKm = haversineDistanceKm(
      RESTAURANT_LOCATION.lat,
      RESTAURANT_LOCATION.lng,
      area.lat,
      area.lng
    );
    setSavingAddr(true);
    try {
      const payload = {
        label: addrLabel.trim().slice(0, 50) || 'Home',
        areaName: area.name,
        streetAddress: addrStreet.trim().slice(0, 250),
        phone: addrPhone.trim().slice(0, 20),
        distanceKm,
      };
      if (editingAddressId) {
        await onUpdateAddress(editingAddressId, payload);
      } else {
        await onAddAddress(payload);
      }
      setAddrStreet('');
      setAddrPhone('');
      setEditingAddressId(null);
      setShowAddForm(false);
    } finally {
      setSavingAddr(false);
    }
  };

  const handleToggleAlerts = () => {
    setOrderAlertsEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(ORDER_ALERTS_KEY, String(next));
      return next;
    });
  };

  const isDark = theme === 'dark';

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-sm">
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-2xl h-full flex flex-col bg-[#fff7f7] dark:bg-[#140507] border-l border-red-200 dark:border-red-900/70 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#7f1d1d] via-[#b91c1c] to-[#991b1b] text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-amber-300 shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/30 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="font-display font-extrabold text-base sm:text-lg truncate">
                    {user.displayName}
                  </h2>
                  <p className="text-[11px] sm:text-xs text-red-100/85 truncate">
                    {user.email}
                    {user.phone ? ` · ${user.phone}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onSignOut}
                  className="px-3 py-1.5 rounded-lg bg-black/25 hover:bg-black/45 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close dashboard"
                  className="p-2 rounded-lg bg-black/25 hover:bg-black/45 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-3 gap-2 p-3 sm:p-4 bg-white dark:bg-[#1b0709] border-b border-red-200 dark:border-red-950">
              <div className="p-2.5 sm:p-3 rounded-xl bg-red-50 dark:bg-[#24090c] border border-red-100 dark:border-red-900/50">
                <p className="text-[10px] sm:text-[11px] font-medium text-[#753e41] dark:text-red-200/70">
                  Total Orders
                </p>
                <p className="mt-0.5 font-display font-extrabold text-base sm:text-lg text-[#220709] dark:text-white tabular-nums">
                  {orders.length}
                </p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-red-50 dark:bg-[#24090c] border border-red-100 dark:border-red-900/50">
                <p className="text-[10px] sm:text-[11px] font-medium text-[#753e41] dark:text-red-200/70">
                  Active Now
                </p>
                <p className="mt-0.5 font-display font-extrabold text-base sm:text-lg text-red-700 dark:text-amber-300 tabular-nums">
                  {activeOrders.length}
                </p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-red-50 dark:bg-[#24090c] border border-red-100 dark:border-red-900/50">
                <p className="text-[10px] sm:text-[11px] font-medium text-[#753e41] dark:text-red-200/70">
                  Total Spent
                </p>
                <p className="mt-0.5 font-display font-extrabold text-xs sm:text-base text-[#220709] dark:text-white tabular-nums truncate">
                  {formatPKR(totalSpent)}
                </p>
              </div>
            </div>

            {/* Dashboard Navigation Tabs (Orders, Profile & Account, Addresses, Settings) */}
            <div className="px-3 sm:px-4 pt-2 flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar border-b border-red-200 dark:border-red-950 bg-[#fff7f7] dark:bg-[#140507]">
              {(
                [
                  { id: 'orders', label: 'Orders', icon: Package },
                  { id: 'profile', label: 'Profile & Account', icon: User },
                  { id: 'addresses', label: 'Addresses', icon: MapPin },
                  { id: 'settings', label: 'Settings', icon: Settings },
                ] as const
              ).map(({ id, label, icon: TabIcon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === id
                      ? 'border-red-700 text-red-700 dark:border-amber-400 dark:text-amber-300'
                      : 'border-transparent text-[#6f3a3d] dark:text-red-200/70 hover:text-red-700'
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4">
              {activeTab === 'orders' && (
                <>
                  {/* Visual Monthly Spending Report using Recharts */}
                  <div className="rounded-2xl bg-white dark:bg-[#1b0709] border border-red-200 dark:border-red-900/60 p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-red-700 dark:text-amber-300 shrink-0" />
                        <h3 className="font-display font-bold text-sm text-[#220709] dark:text-white">
                          Monthly Spending Pattern
                        </h3>
                      </div>
                      <span className="text-[11px] font-semibold text-[#753e41] dark:text-red-200/70 tabular-nums">
                        {validOrders.length} {validOrders.length === 1 ? 'order' : 'orders'}
                      </span>
                    </div>

                    <div className="w-full h-44 sm:h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={monthlyChartData}
                          margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={isDark ? '#451218' : '#f8d7da'}
                            vertical={false}
                          />
                          <XAxis
                            dataKey="month"
                            tick={{
                              fontSize: 11,
                              fill: isDark ? '#fecdd3' : '#6e3a3d',
                            }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{
                              fontSize: 10,
                              fill: isDark ? '#fecdd3' : '#6e3a3d',
                            }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(val: number) =>
                              val >= 1000 ? `${Math.round(val / 1000)}k` : String(val)
                            }
                          />
                          <Tooltip
                            cursor={{
                              fill: isDark ? 'rgba(220,38,38,0.12)' : 'rgba(185,28,28,0.08)',
                            }}
                            contentStyle={{
                              backgroundColor: isDark ? '#1e080a' : '#ffffff',
                              borderColor: isDark ? '#7f1d1d' : '#fecaca',
                              borderRadius: '12px',
                              fontSize: '12px',
                              color: isDark ? '#fff5f5' : '#220709',
                            }}
                            formatter={(value: unknown) => [
                              formatPKR(Number(value ?? 0)),
                              'Spent',
                            ]}
                          />
                          <Bar
                            dataKey="spent"
                            fill={isDark ? '#f59e0b' : '#b91c1c'}
                            radius={[6, 6, 0, 0]}
                            maxBarSize={38}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Order History List */}
                  {orders.length === 0 ? (
                    <div className="py-12 text-center rounded-2xl bg-white dark:bg-[#1b0709] border border-red-200 dark:border-red-900/60 p-6">
                      <Package className="w-10 h-10 mx-auto text-red-400 mb-3" />
                      <p className="font-display font-bold text-base text-[#220709] dark:text-white">
                        No orders placed yet
                      </p>
                      <p className="mt-1 text-xs text-[#703b3e] dark:text-red-200/70">
                        Your past and active orders from Sultan Biryani and Grill will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.map((order) => {
                        const isConfirmed = order.status === 'confirmed';
                        const isEditing = editingOrderId === order.id;

                        return (
                          <div
                            key={order.id}
                            onClick={() => {
                              if (!isEditing) onReorder(order);
                            }}
                            title="Click to review items and quick reorder"
                            className={`rounded-2xl bg-white dark:bg-[#1b0709] border border-red-200 dark:border-red-900/60 p-4 shadow-sm space-y-3 transition-colors ${
                              isEditing
                                ? ''
                                : 'cursor-pointer hover:border-red-400 dark:hover:border-red-700'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-mono text-xs font-bold text-red-700 dark:text-amber-300">
                                  {order.orderNumber}
                                </p>
                                <p className="text-xs text-[#6e3a3d] dark:text-red-200/70 mt-0.5">
                                  {new Date(order.createdAtMs).toLocaleString()} · {order.areaName}
                                </p>
                              </div>
                              <span
                                className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                                  order.status === 'cancelled'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                    : order.status === 'delivered'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                      : 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300'
                                }`}
                              >
                                {STATUS_LABELS[order.status]}
                              </span>
                            </div>

                            {/* Edit Lock Notice when Preparing / Cooking or beyond */}
                            {!isConfirmed &&
                              order.status !== 'delivered' &&
                              order.status !== 'cancelled' && (
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50/80 dark:bg-[#240a0d] border border-red-200/70 dark:border-red-900/50 text-[11px] font-semibold text-[#6e3a3d] dark:text-red-200/80">
                                  <Lock className="w-3.5 h-3.5 text-red-700 dark:text-amber-300 shrink-0" />
                                  <span>
                                    Preparing in kitchen — order changes are now locked.
                                  </span>
                                </div>
                              )}

                            {/* Inline Order Editor (Allowed ONLY while confirmed) */}
                            {isEditing && isConfirmed ? (
                              <div className="p-3 rounded-xl bg-red-50/80 dark:bg-[#22090c] border border-red-200 dark:border-red-900/70 space-y-3">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-bold text-red-800 dark:text-amber-300">
                                    Modify Order Details &amp; Items
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => setEditingOrderId(null)}
                                    className="text-xs font-bold text-[#6e3a3d] dark:text-red-200 hover:underline cursor-pointer"
                                  >
                                    Cancel Edit
                                  </button>
                                </div>

                                <div className="space-y-2">
                                  {editItems.map((line) => (
                                    <div
                                      key={line.id}
                                      className="flex items-center justify-between gap-2 text-xs bg-white dark:bg-[#170507] p-2 rounded-lg border border-red-100 dark:border-red-900/40"
                                    >
                                      <span className="truncate font-semibold text-[#220709] dark:text-white flex-1">
                                        {line.name}
                                      </span>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => handleAdjustEditItemQty(line.id, -1)}
                                          aria-label={`Decrease ${line.name}`}
                                          className="w-6 h-6 rounded bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-100 flex items-center justify-center cursor-pointer"
                                        >
                                          <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="w-5 text-center font-bold tabular-nums text-[#220709] dark:text-white">
                                          {line.quantity}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleAdjustEditItemQty(line.id, 1)}
                                          aria-label={`Increase ${line.name}`}
                                          className="w-6 h-6 rounded bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-100 flex items-center justify-center cursor-pointer"
                                        >
                                          <Plus className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[10px] font-semibold mb-1 text-[#5a2326] dark:text-red-200">
                                      Recipient Name
                                    </label>
                                    <input
                                      type="text"
                                      value={editCustomerName}
                                      onChange={(e) => setEditCustomerName(e.target.value)}
                                      maxLength={100}
                                      className="w-full h-9 px-2.5 rounded-lg bg-white dark:bg-[#170507] border border-red-200 dark:border-red-900 text-xs text-[#220709] dark:text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-semibold mb-1 text-[#5a2326] dark:text-red-200">
                                      Mobile / WhatsApp
                                    </label>
                                    <input
                                      type="tel"
                                      value={editCustomerPhone}
                                      onChange={(e) => setEditCustomerPhone(e.target.value)}
                                      maxLength={20}
                                      className="w-full h-9 px-2.5 rounded-lg bg-white dark:bg-[#170507] border border-red-200 dark:border-red-900 text-xs text-[#220709] dark:text-white"
                                    />
                                  </div>
                                </div>

                                {order.orderType === 'delivery' && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[10px] font-semibold mb-1 text-[#5a2326] dark:text-red-200">
                                        Multan Area
                                      </label>
                                      <select
                                        value={editAreaName}
                                        onChange={(e) =>
                                          void handleEditAreaChange(e.target.value, order.orderType)
                                        }
                                        className="w-full h-9 px-2.5 rounded-lg bg-white dark:bg-[#170507] border border-red-200 dark:border-red-900 text-xs text-[#220709] dark:text-white"
                                      >
                                        {MULTAN_AREAS.map((a) => (
                                          <option key={a.id} value={a.name}>
                                            {a.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-semibold mb-1 text-[#5a2326] dark:text-red-200">
                                        Delivery Address
                                      </label>
                                      <input
                                        type="text"
                                        value={editDeliveryAddress}
                                        onChange={(e) => setEditDeliveryAddress(e.target.value)}
                                        maxLength={300}
                                        className="w-full h-9 px-2.5 rounded-lg bg-white dark:bg-[#170507] border border-red-200 dark:border-red-900 text-xs text-[#220709] dark:text-white"
                                      />
                                    </div>
                                  </div>
                                )}

                                <div>
                                  <label className="block text-[10px] font-semibold mb-1 text-[#5a2326] dark:text-red-200">
                                    Kitchen Notes
                                  </label>
                                  <input
                                    type="text"
                                    value={editNotes}
                                    onChange={(e) => setEditNotes(e.target.value)}
                                    maxLength={300}
                                    placeholder="Spice level, instructions..."
                                    className="w-full h-9 px-2.5 rounded-lg bg-white dark:bg-[#170507] border border-red-200 dark:border-red-900 text-xs text-[#220709] dark:text-white"
                                  />
                                </div>

                                {orderEditError && (
                                  <p className="text-xs font-semibold text-red-700 dark:text-amber-300">
                                    {orderEditError}
                                  </p>
                                )}

                                <div className="flex items-center justify-between pt-1">
                                  <span className="text-xs font-bold text-[#220709] dark:text-white tabular-nums">
                                    Updated Total:{' '}
                                    {formatPKR(
                                      editItems.reduce((s, l) => s + l.price * l.quantity, 0) +
                                        (order.orderType === 'delivery' ? editDeliveryFee : 0)
                                    )}
                                  </span>
                                  <button
                                    type="button"
                                    disabled={savingOrderEdit}
                                    onClick={() => void handleSaveOrderEdits(order)}
                                    className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-[#b91c1c] to-[#881313] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>{savingOrderEdit ? 'Saving...' : 'Save Changes'}</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="pt-2.5 border-t border-red-100 dark:border-red-950 text-xs text-[#4d1e21] dark:text-red-100/85 space-y-1">
                                  {order.items.map((line) => (
                                    <div key={line.id} className="flex justify-between gap-2">
                                      <span className="truncate">
                                        {line.quantity}x {line.name}
                                      </span>
                                      <span className="tabular-nums shrink-0 font-semibold">
                                        {formatPKR(line.price * line.quantity)}
                                      </span>
                                    </div>
                                  ))}
                                </div>

                                <div className="text-[11px] text-[#6e3a3d] dark:text-red-200/70">
                                  {order.deliveryAddress} · {order.customerPhone}
                                </div>
                              </>
                            )}

                            <div className="pt-2.5 border-t border-red-100 dark:border-red-950 flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <span className="text-[11px] text-[#784245] dark:text-red-200/70 block">
                                  Cash on Delivery Total
                                </span>
                                <span className="font-display font-extrabold text-base text-red-700 dark:text-amber-300 tabular-nums">
                                  {formatPKR(order.totalAmount)}
                                </span>
                              </div>

                              <div
                                className="flex flex-wrap items-center gap-1.5 sm:gap-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {isConfirmed && !isEditing && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => beginEditOrder(order)}
                                      className="px-2.5 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-900/70 text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                      <span>Edit Order</span>
                                    </button>
                                    <button
                                      type="button"
                                      disabled={cancellingOrderId === order.id}
                                      onClick={() => void handleCancelConfirmedOrder(order)}
                                      className="px-2.5 py-1.5 rounded-lg bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900 text-xs font-bold cursor-pointer whitespace-nowrap disabled:opacity-50"
                                    >
                                      {cancellingOrderId === order.id ? 'Cancelling...' : 'Cancel'}
                                    </button>
                                  </>
                                )}
                                <button
                                  type="button"
                                  onClick={() => onReorder(order)}
                                  className="px-2.5 py-1.5 rounded-lg bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-100 hover:bg-red-200 dark:hover:bg-red-900 text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Quick Reorder</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onTrackOrder(order)}
                                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#b91c1c] to-[#881313] text-white text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                >
                                  <Truck className="w-3.5 h-3.5" />
                                  <span>Track</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'profile' && (
                <form
                  onSubmit={handleSaveProfileSubmit}
                  className="rounded-2xl bg-white dark:bg-[#1b0709] border border-red-200 dark:border-red-900/60 p-4 sm:p-5 space-y-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-red-100 dark:border-red-950">
                    <div>
                      <h3 className="font-display font-bold text-base text-[#220709] dark:text-white">
                        Customer Profile &amp; Contact Info
                      </h3>
                      <p className="text-xs text-[#6e3a3d] dark:text-red-200/70">
                        Update your mobile, WhatsApp number, and default Multan delivery zone.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                      Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold mb-1 text-[#5a2326] dark:text-red-200">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        maxLength={100}
                        required
                        className="w-full h-10 px-3 rounded-lg bg-red-50/70 dark:bg-[#240a0d] border border-red-200 dark:border-red-900 text-xs sm:text-sm text-[#220709] dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold mb-1 text-[#5a2326] dark:text-red-200">
                        Account Email (Google)
                      </label>
                      <input
                        type="email"
                        value={user.email}
                        disabled
                        className="w-full h-10 px-3 rounded-lg bg-red-100/50 dark:bg-[#160406] border border-red-200/70 dark:border-red-950 text-xs sm:text-sm text-[#6e3a3d] dark:text-red-200/60 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold mb-1 text-[#5a2326] dark:text-red-200">
                        Primary Mobile Number
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-red-600 dark:text-red-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="tel"
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          maxLength={20}
                          placeholder="03XX-XXXXXXX"
                          className="w-full h-10 pl-8 pr-3 rounded-lg bg-red-50/70 dark:bg-[#240a0d] border border-red-200 dark:border-red-900 text-xs sm:text-sm text-[#220709] dark:text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold mb-1 text-[#5a2326] dark:text-red-200">
                        Alternate / WhatsApp Number
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="tel"
                          value={profileWhatsapp}
                          onChange={(e) => setProfileWhatsapp(e.target.value)}
                          maxLength={20}
                          placeholder="03XX-XXXXXXX"
                          className="w-full h-10 pl-8 pr-3 rounded-lg bg-red-50/70 dark:bg-[#240a0d] border border-red-200 dark:border-red-900 text-xs sm:text-sm text-[#220709] dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold mb-1 text-[#5a2326] dark:text-red-200">
                        Default Multan Area
                      </label>
                      <select
                        value={profileArea}
                        onChange={(e) => setProfileArea(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg bg-red-50/70 dark:bg-[#240a0d] border border-red-200 dark:border-red-900 text-xs sm:text-sm text-[#220709] dark:text-white"
                      >
                        {MULTAN_AREAS.map((a) => (
                          <option key={a.id} value={a.name}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold mb-1 text-[#5a2326] dark:text-red-200">
                        Preferred Order Mode
                      </label>
                      <select
                        value={profileOrderType}
                        onChange={(e) => setProfileOrderType(e.target.value as OrderType)}
                        className="w-full h-10 px-3 rounded-lg bg-red-50/70 dark:bg-[#240a0d] border border-red-200 dark:border-red-900 text-xs sm:text-sm text-[#220709] dark:text-white"
                      >
                        <option value="delivery">Home Delivery</option>
                        <option value="takeaway">Self Takeaway</option>
                        <option value="dine_in">Dine-In Table</option>
                      </select>
                    </div>
                  </div>

                  {profileFeedback && (
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>{profileFeedback}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#b91c1c] to-[#881313] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingProfile ? 'Saving Profile...' : 'Save Profile Changes'}</span>
                  </button>
                </form>
              )}

              {activeTab === 'addresses' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#5a2326] dark:text-red-200/80">
                      Saved Multan Delivery Locations
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        showAddForm && !editingAddressId
                          ? setShowAddForm(false)
                          : openNewAddressForm()
                      }
                      className="px-3 py-1.5 rounded-lg bg-red-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{showAddForm ? 'Close Form' : 'Add Address'}</span>
                    </button>
                  </div>

                  {showAddForm && (
                    <form
                      onSubmit={handleSaveAddress}
                      className="p-4 rounded-2xl bg-white dark:bg-[#1b0709] border border-red-200 dark:border-red-900/60 space-y-3"
                    >
                      <p className="text-xs font-bold text-red-700 dark:text-amber-300">
                        {editingAddressId ? 'Edit Saved Address' : 'New Delivery Address'}
                      </p>
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold mb-1 text-[#5a2326] dark:text-red-200">
                            Label
                          </label>
                          <input
                            type="text"
                            value={addrLabel}
                            onChange={(e) => setAddrLabel(e.target.value)}
                            maxLength={50}
                            placeholder="Home / Office"
                            className="w-full h-10 px-3 rounded-lg bg-red-50/70 dark:bg-[#240a0d] border border-red-200 dark:border-red-900 text-xs sm:text-sm text-[#220709] dark:text-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold mb-1 text-[#5a2326] dark:text-red-200">
                            Phone
                          </label>
                          <input
                            type="tel"
                            value={addrPhone}
                            onChange={(e) => setAddrPhone(e.target.value)}
                            maxLength={20}
                            placeholder="03XX-XXXXXXX"
                            className="w-full h-10 px-3 rounded-lg bg-red-50/70 dark:bg-[#240a0d] border border-red-200 dark:border-red-900 text-xs sm:text-sm text-[#220709] dark:text-white"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold mb-1 text-[#5a2326] dark:text-red-200">
                          Multan Area
                        </label>
                        <select
                          value={addrAreaId}
                          onChange={(e) => setAddrAreaId(e.target.value)}
                          className="w-full h-10 px-3 rounded-lg bg-red-50/70 dark:bg-[#240a0d] border border-red-200 dark:border-red-900 text-xs sm:text-sm text-[#220709] dark:text-white"
                        >
                          {MULTAN_AREAS.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold mb-1 text-[#5a2326] dark:text-red-200">
                          House / Street Address
                        </label>
                        <input
                          type="text"
                          value={addrStreet}
                          onChange={(e) => setAddrStreet(e.target.value)}
                          maxLength={250}
                          placeholder="House #12, Street 4..."
                          className="w-full h-10 px-3 rounded-lg bg-red-50/70 dark:bg-[#240a0d] border border-red-200 dark:border-red-900 text-xs sm:text-sm text-[#220709] dark:text-white"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={savingAddr}
                        className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#b91c1c] to-[#881313] text-white font-bold text-xs cursor-pointer disabled:opacity-60"
                      >
                        {savingAddr
                          ? 'Saving...'
                          : editingAddressId
                            ? 'Update Address'
                            : 'Save Address'}
                      </button>
                    </form>
                  )}

                  {addresses.length === 0 ? (
                    <div className="py-12 text-center rounded-2xl bg-white dark:bg-[#1b0709] border border-red-200 dark:border-red-900/60 p-6">
                      <MapPin className="w-9 h-9 mx-auto text-red-400 mb-2" />
                      <p className="text-sm font-semibold text-[#220709] dark:text-white">
                        No saved addresses yet
                      </p>
                    </div>
                  ) : (
                    addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="p-4 rounded-2xl bg-white dark:bg-[#1b0709] border border-red-200 dark:border-red-900/60 flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-[#220709] dark:text-white">
                            {addr.label} · {addr.areaName}
                          </p>
                          <p className="text-xs text-[#6d373b] dark:text-red-200/80 mt-0.5">
                            {addr.streetAddress}
                          </p>
                          <p className="text-xs text-[#7d494c] dark:text-red-200/60 mt-1">
                            {addr.phone}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => beginEditAddress(addr)}
                            aria-label="Edit saved address"
                            className="p-2 rounded-lg text-amber-700 dark:text-amber-300 hover:bg-red-100 dark:hover:bg-red-950 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteAddress(addr.id)}
                            aria-label="Delete saved address"
                            className="p-2 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-red-950 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-3">
                  {/* Appearance Theme Setting */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#1b0709] border border-red-200 dark:border-red-900/60 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 flex items-center justify-center text-red-700 dark:text-amber-300 shrink-0">
                        {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-[#220709] dark:text-white">
                          Display Theme
                        </p>
                        <p className="text-xs text-[#6e3a3d] dark:text-red-200/70">
                          Currently active: {isDark ? 'Dark Crimson' : 'Light Creamy Rose'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onToggleTheme}
                      className="px-3.5 py-2 rounded-lg bg-red-100 dark:bg-red-950 text-red-800 dark:text-amber-200 text-xs font-bold cursor-pointer whitespace-nowrap"
                    >
                      Switch to {isDark ? 'Light' : 'Dark'}
                    </button>
                  </div>

                  {/* Order Status Notification Preference */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#1b0709] border border-red-200 dark:border-red-900/60 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 flex items-center justify-center text-red-700 dark:text-amber-300 shrink-0">
                        <Bell className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-[#220709] dark:text-white">
                          Order Stage Alerts
                        </p>
                        <p className="text-xs text-[#6e3a3d] dark:text-red-200/70">
                          Live kitchen, rider, and delivery updates
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleAlerts}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
                        orderAlertsEnabled
                          ? 'bg-emerald-700 text-white'
                          : 'bg-red-100 dark:bg-red-950 text-[#6e3a3d] dark:text-red-200'
                      }`}
                    >
                      {orderAlertsEnabled ? 'Enabled' : 'Paused'}
                    </button>
                  </div>

                  {/* Account Details Summary & Sign Out */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#1b0709] border border-red-200 dark:border-red-900/60 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#6e3a3d] dark:text-red-200/70">Google Account</span>
                      <span className="font-semibold text-[#220709] dark:text-white truncate max-w-[220px]">
                        {user.email}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#6e3a3d] dark:text-red-200/70">Default Area</span>
                      <span className="font-semibold text-[#220709] dark:text-white">
                        {user.defaultArea || 'Multan'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={onSignOut}
                      className="w-full py-2.5 rounded-xl bg-red-100 dark:bg-red-950 hover:bg-red-200 dark:hover:bg-red-900 text-red-800 dark:text-red-100 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out of Account</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
