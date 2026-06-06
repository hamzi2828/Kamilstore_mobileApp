import { apiRequest } from './client';

export interface PlaceOrderItem {
  productId: string;
  name: string;
  slug: string;
  image: string | null;
  quantity: number;
  unitPrice: number;
  variantSku?: string;
}

export interface PlaceOrderSubOrder {
  orderId: string;
  vendor: { id: string; name: string };
  items: PlaceOrderItem[];
  amount: number;
}

export interface PlaceOrderPayload {
  masterOrderId: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
    userId?: string;
  };
  shippingAddress: {
    line1: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: 'card' | 'paypal' | 'cod';
  shippingMethod: string;
  totals: { subtotal: number; shipping: number; tax: number; total: number };
  subOrders: PlaceOrderSubOrder[];
}

export interface PlaceOrderResponse {
  success: boolean;
  data?: {
    masterOrderId: string;
    placedAt: string;
    subOrders: Array<{
      orderId: string;
      vendorId?: string;
      vendorName?: string;
      vendor?: { id: string; name: string };
      amount: number;
      itemCount?: number;
      items?: Array<{ quantity: number }>;
    }>;
  };
  message?: string;
}

export const ordersApi = {
  place: (payload: PlaceOrderPayload) =>
    apiRequest<PlaceOrderResponse>('/api/public/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  listMine: (userId: string) =>
    apiRequest<{ success: boolean; data: unknown[] }>('/api/public/orders', {
      query: { customerUserId: userId },
    }),
};
