export type OrderType = 'delivery' | 'takeaway' | 'dine_in';

export type OrderStatus =
  | 'confirmed'
  | 'cooking'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface MenuItem {
  id: string;
  name: string;
  category:
    | 'Biryani & Pulao'
    | 'Charcoal BBQ'
    | 'Wraps & Burgers'
    | 'Platters & Deals'
    | 'Pakwan Daig'
    | 'Sides & Drinks';
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  tag?: string;
  serving?: string;
  popular?: boolean;
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

export interface MultanArea {
  id: string;
  name: string;
  lat: number;
  lng: number;
  zone: string;
}

export interface OrderItemLine {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  orderType: OrderType;
  areaName: string;
  deliveryAddress: string;
  notes?: string;
  items: OrderItemLine[];
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: 'cod';
  status: OrderStatus;
  estimatedMinutes: number;
  createdAtMs: number;
  isLocalOnly?: boolean;
}

export interface SavedAddress {
  id: string;
  userId: string;
  label: string;
  areaName: string;
  streetAddress: string;
  phone: string;
  distanceKm: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  defaultArea?: string;
  phone?: string;
  whatsapp?: string;
  preferredOrderType?: OrderType;
}

export interface FlyingItem {
  id: string;
  image: string;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  endX: number;
  endY: number;
}
