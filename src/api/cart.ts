import { apiRequest } from './client';
import type { CartLine } from '@/types';

const USE_MOCK = false;

interface ServerCartItem extends Omit<CartLine, '_id'> {
  lineId: string;
}

interface ServerCartResponse {
  success: boolean;
  data: { items?: ServerCartItem[] };
}

const toClient = (items: ServerCartItem[] | undefined): CartLine[] =>
  (items || []).map((i) => ({
    _id: i.lineId,
    productId: i.productId,
    slug: i.slug,
    name: i.name,
    image: i.image ?? null,
    sellingPrice: i.sellingPrice,
    unitPrice: i.unitPrice,
    stock: i.stock,
    quantity: i.quantity,
    variantSku: i.variantSku,
    variantLabel: i.variantLabel,
    vendor: i.vendor,
  }));

const toServer = (line: CartLine) => ({
  lineId: line._id,
  productId: line.productId,
  slug: line.slug,
  name: line.name,
  image: line.image,
  sellingPrice: line.sellingPrice,
  unitPrice: line.unitPrice,
  stock: line.stock,
  quantity: line.quantity,
  variantSku: line.variantSku,
  variantLabel: line.variantLabel,
  vendor: line.vendor,
});

// In-memory mock cart store (resets on app reload)
let mockCart: CartLine[] = [];

export const cartApi = {
  fetch: async (): Promise<CartLine[]> => {
    if (USE_MOCK) return [...mockCart];
    const res = await apiRequest<ServerCartResponse>('/api/cart', { auth: true });
    return toClient(res.data?.items);
  },

  add: async (line: CartLine): Promise<CartLine[]> => {
    if (USE_MOCK) {
      const existing = mockCart.find((l) => l._id === line._id);
      if (existing) existing.quantity += line.quantity;
      else mockCart.push({ ...line });
      return [...mockCart];
    }
    const res = await apiRequest<ServerCartResponse>('/api/cart/items', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(toServer(line)),
    });
    return toClient(res.data?.items);
  },

  setQuantity: async (lineId: string, quantity: number): Promise<void> => {
    if (USE_MOCK) {
      const line = mockCart.find((l) => l._id === lineId);
      if (line) line.quantity = quantity;
      return;
    }
    await apiRequest('/api/cart/items/' + encodeURIComponent(lineId), {
      method: 'PUT',
      auth: true,
      body: JSON.stringify({ quantity }),
    });
  },

  remove: async (lineId: string): Promise<void> => {
    if (USE_MOCK) {
      mockCart = mockCart.filter((l) => l._id !== lineId);
      return;
    }
    await apiRequest('/api/cart/items/' + encodeURIComponent(lineId), {
      method: 'DELETE',
      auth: true,
    });
  },

  clear: async (): Promise<void> => {
    if (USE_MOCK) {
      mockCart = [];
      return;
    }
    await apiRequest('/api/cart', { method: 'DELETE', auth: true });
  },

  merge: async (items: CartLine[]): Promise<CartLine[]> => {
    if (USE_MOCK) {
      const map = new Map(mockCart.map((l) => [l._id, l]));
      for (const it of items) {
        const existing = map.get(it._id);
        if (existing) existing.quantity += it.quantity;
        else map.set(it._id, { ...it });
      }
      mockCart = Array.from(map.values());
      return [...mockCart];
    }
    const res = await apiRequest<ServerCartResponse>('/api/cart', {
      method: 'PUT',
      auth: true,
      body: JSON.stringify({ merge: true, items: items.map(toServer) }),
    });
    return toClient(res.data?.items);
  },
};
