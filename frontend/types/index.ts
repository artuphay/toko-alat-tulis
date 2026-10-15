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

export type OrderStatus = 'PENDING_PAYMENT' | 'PAID_READY_TO_SHIP' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';

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
  status: OrderStatus;
  trackingNumber?: string;
  qrisPayload?: string | null;
  paymentClaimedAt?: string;
  paidAt?: string;
  createdAt?: string;
  items: OrderItem[];
}

export interface OrderSummary {
  readyToShipOrders: number;
  pendingOrders: number;
  shippedOrders: number;
  totalProducts: number;
}
