export interface Product {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
}

export interface OrderItem {
  id: number;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  id: number;
  orderCode: string;
  recipientName: string;
  phoneNumber: string;
  shippingAddress: string;
  city: string;
  postalCode: string;
  notes?: string;
  totalAmount: number;
  status: string;
  qrisUrl?: string;
  trackingNumber?: string;
  items: OrderItem[];
}