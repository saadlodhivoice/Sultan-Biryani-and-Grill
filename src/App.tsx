import { useCallback, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { Truck } from 'lucide-react';
import { AuthModal } from './components/AuthModal.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { CustomerDashboard } from './components/CustomerDashboard.tsx';
import { FloatingWhatsApp } from './components/FloatingWhatsApp.tsx';
import { FlyToCartLayer } from './components/FlyToCartLayer.tsx';
import { FooterSection } from './components/FooterSection.tsx';
import { HeroSlider } from './components/HeroSlider.tsx';
import { LocationModal } from './components/LocationModal.tsx';
import { MenuSection } from './components/MenuSection.tsx';
import { Navbar } from './components/Navbar.tsx';
import { OrderStatusToast, type OrderToastItem } from './components/OrderStatusToast.tsx';
import { OrderTrackingModal } from './components/OrderTrackingModal.tsx';
import { PromoBanner } from './components/PromoBanner.tsx';
import { QuickReorderModal } from './components/QuickReorderModal.tsx';
import { SplashScreen } from './components/SplashScreen.tsx';
import { MULTAN_AREAS } from './data/multanAreas.ts';
import { OperationType, auth, db, handleFirestoreError } from './lib/firebase.ts';
import type {
  CartItem,
  FlyingItem,
  MenuItem,
  MultanArea,
  OrderItemLine,
  OrderRecord,
  OrderStatus,
  OrderType,
  SavedAddress,
  UserProfile,
} from './types.ts';

const LOCATION_STORAGE_KEY = 'sultan_location_v1';
const THEME_STORAGE_KEY = 'sultan_theme_v1';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === 'dark' ? 'dark' : 'light';
  });

  const [splashDone, setSplashDone] = useState(false);
  const [promoVisible, setPromoVisible] = useState(true);

  const [selectedOrderType, setSelectedOrderType] = useState<OrderType>(() => {
    try {
      const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.orderType) return parsed.orderType;
      }
    } catch {
      // ignore
    }
    return 'delivery';
  });

  const [selectedArea, setSelectedArea] = useState<MultanArea>(() => {
    try {
      const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const found = MULTAN_AREAS.find((a) => a.id === parsed.areaId);
        if (found) return found;
      }
    } catch {
      // ignore
    }
    return MULTAN_AREAS[0];
  });

  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lng: number } | undefined>(
    undefined
  );

  // Ask location ONLY on first visit (never on refresh once confirmed)
  const [hasConfirmedInitialLocation, setHasConfirmedInitialLocation] = useState<boolean>(() =>
    Boolean(localStorage.getItem(LOCATION_STORAGE_KEY))
  );
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string>('Platters & Deals');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartJiggle, setCartJiggle] = useState(false);
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<OrderRecord | null>(null);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [quickReorderOrder, setQuickReorderOrder] = useState<OrderRecord | null>(null);
  const [orderToasts, setOrderToasts] = useState<OrderToastItem[]>([]);

  const cartButtonRef = useRef<HTMLButtonElement | null>(null);
  const knownOrderStatusesRef = useRef<Map<string, OrderStatus>>(new Map());

  // Sync Tailwind .dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  // Show LocationModal right after splash finishes on very first visit
  useEffect(() => {
    if (splashDone && !hasConfirmedInitialLocation) {
      setLocationModalOpen(true);
    }
  }, [splashDone, hasConfirmedInitialLocation]);

  // Firebase Auth listener + User profile sync
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const baseProfile: UserProfile = {
          uid: fbUser.uid,
          displayName: (fbUser.displayName || fbUser.email?.split('@')[0] || 'Guest').slice(0, 100),
          email: (fbUser.email || 'user@gmail.com').slice(0, 150),
          photoURL: fbUser.photoURL?.slice(0, 500) || '',
          defaultArea: selectedArea.name,
        };
        setUser(baseProfile);

        // Ensure Firestore user document exists & hydrate saved profile details
        const userRef = doc(db, 'users', fbUser.uid);
        try {
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            await setDoc(userRef, {
              uid: fbUser.uid,
              displayName: baseProfile.displayName,
              email: baseProfile.email,
              photoURL: baseProfile.photoURL ?? '',
              defaultArea: selectedArea.name,
              phone: '',
              whatsapp: '',
              preferredOrderType: selectedOrderType,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } else {
            const data = snap.data();
            const hydrated: UserProfile = {
              uid: fbUser.uid,
              displayName: String(data.displayName || baseProfile.displayName).slice(0, 100),
              email: baseProfile.email,
              photoURL: String(data.photoURL || baseProfile.photoURL || ''),
              defaultArea: typeof data.defaultArea === 'string' ? data.defaultArea : selectedArea.name,
              phone: typeof data.phone === 'string' ? data.phone : '',
              whatsapp: typeof data.whatsapp === 'string' ? data.whatsapp : '',
              preferredOrderType:
                data.preferredOrderType === 'delivery' ||
                data.preferredOrderType === 'takeaway' ||
                data.preferredOrderType === 'dine_in'
                  ? data.preferredOrderType
                  : undefined,
            };
            setUser(hydrated);
            if (!data.photoURL && baseProfile.photoURL) {
              await updateDoc(userRef, {
                photoURL: baseProfile.photoURL,
                updatedAt: serverTimestamp(),
              });
            }
          }
        } catch (err) {
          console.warn('User profile sync notice:', err);
        }
      } else {
        setUser(null);
        knownOrderStatusesRef.current.clear();
        setOrders((prev) => prev.filter((o) => o.isLocalOnly));
        setSavedAddresses([]);
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, [selectedArea.name, selectedOrderType]);

  // Firestore real-time orders + saved addresses subscriptions when authenticated
  useEffect(() => {
    if (!authReady || !user) return;

    const ordersQuery = query(collection(db, 'orders'), where('userId', '==', user.uid));
    const unsubOrders = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const loaded: OrderRecord[] = snapshot.docs.map((d) => {
          const data = d.data();
          const createdAtMs =
            typeof data.createdAt?.toMillis === 'function'
              ? data.createdAt.toMillis()
              : Date.now();
          return {
            id: d.id,
            orderNumber: String(data.orderNumber ?? ''),
            userId: String(data.userId ?? ''),
            customerName: String(data.customerName ?? ''),
            customerPhone: String(data.customerPhone ?? ''),
            orderType: (data.orderType as OrderType) ?? 'delivery',
            areaName: String(data.areaName ?? ''),
            deliveryAddress: String(data.deliveryAddress ?? ''),
            notes: typeof data.notes === 'string' ? data.notes : undefined,
            items: Array.isArray(data.items) ? data.items : [],
            subtotal: Number(data.subtotal ?? 0),
            deliveryFee: Number(data.deliveryFee ?? 0),
            discountAmount: Number(data.discountAmount ?? 0),
            totalAmount: Number(data.totalAmount ?? 0),
            paymentMethod: 'cod',
            status: (data.status as OrderStatus) ?? 'confirmed',
            estimatedMinutes: Number(data.estimatedMinutes ?? 30),
            createdAtMs,
          };
        });
        loaded.sort((a, b) => b.createdAtMs - a.createdAtMs);
        setOrders(loaded);

        setActiveTrackingOrder((curr) => {
          if (!curr) return curr;
          const updated = loaded.find((o) => o.id === curr.id);
          return updated ?? curr;
        });
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'orders');
      }
    );

    const addrPath = `users/${user.uid}/addresses`;
    const addrQuery = query(collection(db, addrPath), where('userId', '==', user.uid));
    const unsubAddrs = onSnapshot(
      addrQuery,
      (snapshot) => {
        const list: SavedAddress[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: String(data.userId ?? ''),
            label: String(data.label ?? ''),
            areaName: String(data.areaName ?? ''),
            streetAddress: String(data.streetAddress ?? ''),
            phone: String(data.phone ?? ''),
            distanceKm: Number(data.distanceKm ?? 0),
          };
        });
        setSavedAddresses(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, addrPath);
      }
    );

    return () => {
      unsubOrders();
      unsubAddrs();
    };
  }, [authReady, user]);

  const handleConfirmLocation = (
    orderType: OrderType,
    area: MultanArea,
    coords?: { lat: number; lng: number }
  ) => {
    setSelectedOrderType(orderType);
    setSelectedArea(area);
    setDetectedCoords(coords);
    setHasConfirmedInitialLocation(true);
    setLocationModalOpen(false);
    localStorage.setItem(
      LOCATION_STORAGE_KEY,
      JSON.stringify({ orderType, areaId: area.id })
    );
  };

  const triggerCartJiggle = useCallback(() => {
    setCartJiggle(true);
    window.setTimeout(() => setCartJiggle(false), 500);
  }, []);

  const handleAddToCart = useCallback(
    (item: MenuItem, imageElement: HTMLElement | null) => {
      setCartItems((prev) => {
        const idx = prev.findIndex((c) => c.item.id === item.id);
        if (idx >= 0) {
          const clone = [...prev];
          clone[idx] = { ...clone[idx], quantity: clone[idx].quantity + 1 };
          return clone;
        }
        return [...prev, { item, quantity: 1 }];
      });

      // Spawn Fly-to-Cart animation if both source image and cart button rects are available
      const cartRect = cartButtonRef.current?.getBoundingClientRect();
      const srcRect = imageElement?.getBoundingClientRect();
      if (cartRect && srcRect) {
        const flyId = `${item.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        setFlyingItems((prev) => [
          ...prev,
          {
            id: flyId,
            image: item.image,
            startX: srcRect.left,
            startY: srcRect.top,
            startWidth: Math.min(srcRect.width, 130),
            startHeight: Math.min(srcRect.height, 98),
            endX: cartRect.left + cartRect.width / 2,
            endY: cartRect.top + cartRect.height / 2,
          },
        ]);
      } else {
        triggerCartJiggle();
      }
    },
    [triggerCartJiggle]
  );

  const handleFinishFlyingItem = useCallback(
    (id: string) => {
      setFlyingItems((prev) => prev.filter((f) => f.id !== id));
      triggerCartJiggle();
    },
    [triggerCartJiggle]
  );

  const handleUpdateQty = useCallback((itemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((c) =>
          c.item.id === itemId ? { ...c, quantity: c.quantity + delta } : c
        )
        .filter((c) => c.quantity > 0)
    );
  }, []);

  const handleRemoveCartItem = useCallback((itemId: string) => {
    setCartItems((prev) => prev.filter((c) => c.item.id !== itemId));
  }, []);

  const handlePlaceOrder = async (payload: {
    customerName: string;
    customerPhone: string;
    orderType: OrderType;
    areaName: string;
    deliveryAddress: string;
    notes: string;
    deliveryFee: number;
    estimatedMinutes: number;
  }): Promise<OrderRecord> => {
    const subtotal = cartItems.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
    const totalAmount = subtotal + payload.deliveryFee;
    const orderNumber = `SBG-${Math.floor(100000 + Math.random() * 900000)}`;
    const lineItems = cartItems.slice(0, 25).map((c) => ({
      id: c.item.id,
      name: c.item.name,
      price: c.item.price,
      quantity: c.quantity,
      image: c.item.image,
    }));

    let createdOrder: OrderRecord;

    if (user && auth.currentUser?.emailVerified) {
      const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const orderRef = doc(db, 'orders', orderId);
      const docPayload = {
        orderNumber,
        userId: user.uid,
        customerName: payload.customerName,
        customerPhone: payload.customerPhone,
        orderType: payload.orderType,
        areaName: payload.areaName,
        deliveryAddress: payload.deliveryAddress,
        notes: payload.notes,
        items: lineItems,
        subtotal,
        deliveryFee: payload.deliveryFee,
        discountAmount: 0,
        totalAmount,
        paymentMethod: 'cod' as const,
        status: 'confirmed' as const,
        estimatedMinutes: payload.estimatedMinutes,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      try {
        await setDoc(orderRef, docPayload);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `orders/${orderId}`);
      }
      createdOrder = {
        id: orderId,
        ...docPayload,
        createdAtMs: Date.now(),
      };
    } else {
      createdOrder = {
        id: `local_${Date.now()}`,
        orderNumber,
        userId: 'guest',
        customerName: payload.customerName,
        customerPhone: payload.customerPhone,
        orderType: payload.orderType,
        areaName: payload.areaName,
        deliveryAddress: payload.deliveryAddress,
        notes: payload.notes,
        items: lineItems,
        subtotal,
        deliveryFee: payload.deliveryFee,
        discountAmount: 0,
        totalAmount,
        paymentMethod: 'cod',
        status: 'confirmed',
        estimatedMinutes: payload.estimatedMinutes,
        createdAtMs: Date.now(),
        isLocalOnly: true,
      };
      setOrders((prev) => [createdOrder, ...prev]);
    }

    setCartItems([]);
    setCartOpen(false);
    setActiveTrackingOrder(createdOrder);
    setTrackingModalOpen(true);
    return createdOrder;
  };

  const dismissOrderToast = useCallback((toastId: string) => {
    setOrderToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  const pushOrderStatusToast = useCallback(
    (order: OrderRecord, previousStatus: OrderStatus, nextStatus: OrderStatus) => {
      if (localStorage.getItem('sultan_order_alerts_v1') === 'false') return;
      const toastId = `${order.id}-${nextStatus}-${Date.now()}`;
      setOrderToasts((prev) => {
        const alreadyShown = prev.some(
          (t) => t.order.id === order.id && t.nextStatus === nextStatus
        );
        if (alreadyShown) return prev;
        return [
          {
            id: toastId,
            order,
            previousStatus,
            nextStatus,
            createdAt: Date.now(),
          },
          ...prev,
        ].slice(0, 3);
      });
    },
    []
  );

  // Detect any status change across active/tracked orders (from Firestore onSnapshot or stage transitions)
  useEffect(() => {
    const map = knownOrderStatusesRef.current;
    for (const order of orders) {
      const prevStatus = map.get(order.id);
      if (prevStatus && prevStatus !== order.status) {
        pushOrderStatusToast(order, prevStatus, order.status);
      }
      map.set(order.id, order.status);
    }
  }, [orders, pushOrderStatusToast]);

  const handleAdvanceOrderStatus = useCallback(
    async (orderId: string, nextStatus: OrderStatus) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
      );
      setActiveTrackingOrder((curr) =>
        curr && curr.id === orderId ? { ...curr, status: nextStatus } : curr
      );

      if (user && !orderId.startsWith('local_')) {
        try {
          await updateDoc(doc(db, 'orders', orderId), {
            status: nextStatus,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          console.warn('Order stage update skipped:', err);
        }
      }
    },
    [user]
  );

  // Continue advancing active tracked order smoothly while customer browses outside tracking/dashboard modals
  useEffect(() => {
    if (!activeTrackingOrder || trackingModalOpen || dashboardOpen) return;
    if (
      activeTrackingOrder.status === 'delivered' ||
      activeTrackingOrder.status === 'cancelled'
    ) {
      return;
    }

    const nextMap: Partial<Record<OrderStatus, OrderStatus>> = {
      confirmed: 'cooking',
      cooking: 'out_for_delivery',
      out_for_delivery: 'delivered',
    };
    const nextStatus = nextMap[activeTrackingOrder.status];
    if (!nextStatus) return;

    const timer = window.setTimeout(() => {
      void handleAdvanceOrderStatus(activeTrackingOrder.id, nextStatus);
    }, 8500);

    return () => window.clearTimeout(timer);
  }, [activeTrackingOrder, trackingModalOpen, dashboardOpen, handleAdvanceOrderStatus]);

  const handleUpdateProfile = async (patch: {
    displayName: string;
    phone: string;
    whatsapp: string;
    defaultArea: string;
    preferredOrderType: OrderType;
  }) => {
    if (!user) return;
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
    const userPath = `users/${user.uid}`;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: patch.displayName,
        phone: patch.phone,
        whatsapp: patch.whatsapp,
        defaultArea: patch.defaultArea,
        preferredOrderType: patch.preferredOrderType,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, userPath);
    }
  };

  const handleEditOrder = async (
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
  ) => {
    const target = orders.find((o) => o.id === orderId);
    if (!target || target.status !== 'confirmed') {
      throw new Error('Order cannot be modified once preparation has started.');
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, ...patch } : o))
    );
    setActiveTrackingOrder((curr) =>
      curr && curr.id === orderId ? { ...curr, ...patch } : curr
    );

    if (user && !orderId.startsWith('local_')) {
      const orderPath = `orders/${orderId}`;
      try {
        await updateDoc(doc(db, 'orders', orderId), {
          customerName: patch.customerName,
          customerPhone: patch.customerPhone,
          orderType: patch.orderType,
          areaName: patch.areaName,
          deliveryAddress: patch.deliveryAddress,
          notes: patch.notes,
          items: patch.items,
          subtotal: patch.subtotal,
          deliveryFee: patch.deliveryFee,
          totalAmount: patch.totalAmount,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, orderPath);
      }
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const target = orders.find((o) => o.id === orderId);
    if (!target || target.status !== 'confirmed') return;
    await handleAdvanceOrderStatus(orderId, 'cancelled');
  };

  const handleAddAddress = async (addr: Omit<SavedAddress, 'id' | 'userId'>) => {
    if (!user) return;
    const addrPath = `users/${user.uid}/addresses`;
    try {
      await addDoc(collection(db, addrPath), {
        userId: user.uid,
        label: addr.label,
        areaName: addr.areaName,
        streetAddress: addr.streetAddress,
        phone: addr.phone,
        distanceKm: addr.distanceKm,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, addrPath);
    }
  };

  const handleUpdateAddress = async (
    addrId: string,
    addr: Omit<SavedAddress, 'id' | 'userId'>
  ) => {
    if (!user) return;
    const path = `users/${user.uid}/addresses/${addrId}`;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'addresses', addrId), {
        label: addr.label,
        areaName: addr.areaName,
        streetAddress: addr.streetAddress,
        phone: addr.phone,
        distanceKm: addr.distanceKm,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleDeleteAddress = async (addrId: string) => {
    if (!user) return;
    const path = `users/${user.uid}/addresses/${addrId}`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'addresses', addrId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleReorder = (order: OrderRecord) => {
    setQuickReorderOrder(order);
  };

  const handleConfirmQuickReorder = (itemsToAdd: CartItem[], replaceCart: boolean) => {
    setCartItems((prev) => {
      if (replaceCart) return itemsToAdd;
      const merged = [...prev];
      for (const addition of itemsToAdd) {
        const idx = merged.findIndex((c) => c.item.id === addition.item.id);
        if (idx >= 0) {
          merged[idx] = {
            ...merged[idx],
            quantity: merged[idx].quantity + addition.quantity,
          };
        } else {
          merged.push(addition);
        }
      }
      return merged;
    });
    setQuickReorderOrder(null);
    setDashboardOpen(false);
    triggerCartJiggle();
    setCartOpen(true);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setDashboardOpen(false);
  };

  const cartCount = cartItems.reduce((sum, c) => sum + c.quantity, 0);

  return (
    <div
      className={`relative min-h-screen flex flex-col text-[#1d090a] dark:text-[#fff5f5] transition-colors duration-300 ${
        theme === 'dark' ? 'animated-theme-canvas-dark' : 'animated-theme-canvas-light'
      }`}
    >
      {/* Animated Theme Ambient Background (Light = Warm Rose & Amber Glows | Dark = Deep Crimson & Ember Glows) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div className="animate-ambient-a absolute -top-28 -left-24 w-[440px] h-[440px] sm:w-[660px] sm:h-[660px] rounded-full bg-gradient-to-br from-red-400/45 via-rose-300/35 to-amber-200/30 dark:from-red-700/35 dark:via-red-950/30 dark:to-amber-600/15 blur-3xl transition-colors duration-500" />
        <div className="animate-ambient-b absolute top-1/3 -right-28 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] rounded-full bg-gradient-to-tr from-rose-400/40 via-red-300/35 to-orange-200/25 dark:from-red-800/35 dark:via-[#45080f]/35 dark:to-red-600/20 blur-3xl transition-colors duration-500" />
        <div className="animate-ambient-a absolute -bottom-32 left-1/4 w-[380px] h-[380px] sm:w-[560px] sm:h-[560px] rounded-full bg-gradient-to-tr from-red-300/40 via-rose-300/30 to-amber-200/35 dark:from-[#520a12]/35 dark:via-red-950/30 dark:to-amber-700/15 blur-3xl transition-colors duration-500" />
      </div>

      <SplashScreen onComplete={() => setSplashDone(true)} />

      <div className="relative z-10 flex-1 flex flex-col">
        <PromoBanner
          visible={promoVisible}
          onDismiss={() => setPromoVisible(false)}
          onExploreDeals={() => {
            setSelectedCategory('Platters & Deals');
            document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        <Navbar
          ref={cartButtonRef}
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          cartCount={cartCount}
          cartJiggle={cartJiggle}
          onOpenCart={() => setCartOpen(true)}
          user={user}
          onOpenAccount={() => (user ? setDashboardOpen(true) : setAuthModalOpen(true))}
          onSelectCategory={setSelectedCategory}
        />

        <main className="flex-1">
        <HeroSlider
          selectedAreaName={selectedArea.name}
          orderType={selectedOrderType}
          onOpenLocationModal={() => setLocationModalOpen(true)}
          onExploreCategory={setSelectedCategory}
        />

        <MenuSection
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          cartItems={cartItems}
          onAddToCart={handleAddToCart}
          onUpdateQty={handleUpdateQty}
        />
      </main>

        <FooterSection />
      </div>

      {/* Left-side Floating WhatsApp Button with Dynamic Hourly Wait Time Tooltip */}
      <FloatingWhatsApp visible={splashDone} autoExpandOnMount />

      {/* Order Tracking Trigger appears ONLY after an order has been placed */}
      {activeTrackingOrder && !trackingModalOpen && (
        <button
          type="button"
          onClick={() => setTrackingModalOpen(true)}
          className="fixed right-4 bottom-4 sm:right-6 sm:bottom-6 z-40 px-4 py-3 rounded-full bg-gradient-to-r from-[#b91c1c] to-[#881313] text-white font-bold text-xs shadow-2xl flex items-center gap-2 border border-amber-300/40 hover:scale-105 transition-transform cursor-pointer whitespace-nowrap"
        >
          <Truck className="w-4 h-4 text-amber-300 shrink-0" />
          <span>Track {activeTrackingOrder.orderNumber}</span>
        </button>
      )}

      <FlyToCartLayer
        flyingItems={flyingItems}
        onFinishItem={handleFinishFlyingItem}
      />

      <LocationModal
        open={locationModalOpen}
        initialOrderType={selectedOrderType}
        initialAreaId={selectedArea.id}
        canDismiss={hasConfirmedInitialLocation}
        onClose={() => setLocationModalOpen(false)}
        onConfirm={handleConfirmLocation}
      />

      <CartDrawer
        open={cartOpen}
        items={cartItems}
        orderType={selectedOrderType}
        selectedArea={selectedArea}
        detectedCoords={detectedCoords}
        user={user}
        savedAddresses={savedAddresses}
        onClose={() => setCartOpen(false)}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveCartItem}
        onChangeOrderType={setSelectedOrderType}
        onChangeArea={setSelectedArea}
        onOpenAuth={() => setAuthModalOpen(true)}
        onPlaceOrder={handlePlaceOrder}
      />

      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          if (!cartOpen) setDashboardOpen(true);
        }}
      />

      <CustomerDashboard
        open={dashboardOpen}
        user={user}
        orders={orders}
        addresses={savedAddresses}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        onClose={() => setDashboardOpen(false)}
        onSignOut={handleSignOut}
        onTrackOrder={(order) => {
          setActiveTrackingOrder(order);
          setTrackingModalOpen(true);
        }}
        onReorder={handleReorder}
        onUpdateProfile={handleUpdateProfile}
        onEditOrder={handleEditOrder}
        onCancelOrder={handleCancelOrder}
        onAddAddress={handleAddAddress}
        onUpdateAddress={handleUpdateAddress}
        onDeleteAddress={handleDeleteAddress}
      />

      <QuickReorderModal
        open={Boolean(quickReorderOrder)}
        order={quickReorderOrder}
        hasExistingCartItems={cartItems.length > 0}
        onClose={() => setQuickReorderOrder(null)}
        onConfirmAddToCart={handleConfirmQuickReorder}
      />

      <OrderTrackingModal
        order={activeTrackingOrder}
        open={trackingModalOpen}
        onClose={() => setTrackingModalOpen(false)}
        onAdvanceStatus={handleAdvanceOrderStatus}
      />

      <OrderStatusToast
        toasts={orderToasts}
        onDismiss={dismissOrderToast}
        onInspectOrder={(order) => {
          setActiveTrackingOrder(order);
          setTrackingModalOpen(true);
        }}
      />
    </div>
  );
}
