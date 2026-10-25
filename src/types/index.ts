export type Role = 'customer' | 'admin' | 'studio';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
  phone?: string;
  createdAt: string;
}

export type PaintingStatus = 'available' | 'sold';

export interface Painting {
  id: string;
  title: string;
  artist: string;
  price: number;
  imageUrl: string;
  status: PaintingStatus;
  description: string;
  year?: number;
  medium?: string;
  dimensions?: string;
  category?: string;
  featured?: boolean;
}

export type PaintingOrderStatus = 'placed' | 'cancelled';

export interface PaintingOrder {
  id: string;
  paintingId: string;
  paintingTitle: string;
  paintingPrice: number;
  paintingImageUrl: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  orderDate: string;
  status: PaintingOrderStatus;
  shippingAddress: string;
}

export type WallBookingStatus = 'requested' | 'confirmed' | 'declined' | 'cancelled';

export interface WallBooking {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  scheduledDate: string; // YYYY-MM-DD
  wallSizeSqFt: number; // 10 to 500
  ratePerSqFt: number; // Rate from seed data (₹150)
  totalPrice: number; // wallSize * rate
  address: string;
  city: string;
  stateZip: string;
  stylePreference: string;
  notes?: string;
  status: WallBookingStatus;
  createdAt: string;
  adminResponseNote?: string;
}

export type PotteryRequestStatus = 'requested' | 'accepted' | 'declined' | 'cancelled';

export interface PotteryItemSpec {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  dimensions?: string;
  imageUrl?: string;
}

export interface PotteryGlazeSpec {
  id: string;
  name: string;
  colorHex: string;
  finish?: string;
  description?: string;
}

export interface PotteryRequest {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  itemId: string;
  itemName: string;
  glazeId: string;
  glazeName: string;
  quantity: number; // 1 to 12
  estimatedPrice: number;
  requiredDate: string; // >= 14 days from creation
  specialNotes?: string;
  status: PotteryRequestStatus;
  createdAt: string;
  updatedAt?: string;
  adminResponseNote?: string;
}

export type PageView =
  | 'home'
  | 'paintings'
  | 'murals'
  | 'pottery'
  | 'login'
  | 'register'
  | 'customer-dashboard'
  | 'admin-dashboard';

export const CURRENCY_SYMBOL = '₹';
export const formatCurrency = (amount: number): string => {
  return `${CURRENCY_SYMBOL}${amount.toLocaleString('en-IN')}`;
};
