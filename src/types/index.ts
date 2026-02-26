export interface User {
  id: string;
  username: string;
  piUid: string;
  balance: number;
  accessToken: string;
  isAdmin?: boolean;
}

export interface Product {
  id: string;
  name: { ar: string; en: string };
  description: { ar: string; en: string };
  price: number; // in Pi
  image: string;
  category: string;
  unit: { ar: string; en: string };
  inStock: boolean;
  rating: number;
  sold: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  shippingAddress: ShippingAddress;
  paymentId?: string;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  notes?: string;
}
