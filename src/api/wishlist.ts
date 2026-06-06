import { apiRequest } from './client';
import type { WishlistEntry } from '@/types';

const USE_MOCK = false;

interface ServerResponse {
  success: boolean;
  data: { items?: Array<Omit<WishlistEntry, 'addedAt'> & { addedAt?: string | Date }> };
}

const toClient = (items: ServerResponse['data']['items']): WishlistEntry[] =>
  (items || []).map((i) => ({
    productId: i.productId,
    slug: i.slug,
    name: i.name,
    image: i.image ?? null,
    sellingPrice: i.sellingPrice,
    unitPrice: i.unitPrice,
    inStock: i.inStock !== false,
    vendor: i.vendor,
    addedAt: i.addedAt ? new Date(i.addedAt).toISOString() : new Date().toISOString(),
  }));

let mockWishlist: WishlistEntry[] = [];

export const wishlistApi = {
  fetch: async (): Promise<WishlistEntry[]> => {
    if (USE_MOCK) return [...mockWishlist];
    const res = await apiRequest<ServerResponse>('/api/wishlist', { auth: true });
    return toClient(res.data?.items);
  },

  add: async (item: WishlistEntry): Promise<void> => {
    if (USE_MOCK) {
      const exists = mockWishlist.find((i) => i.productId === item.productId);
      if (!exists) mockWishlist.push(item);
      return;
    }
    await apiRequest('/api/wishlist/items', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(item),
    });
  },

  remove: async (productId: string): Promise<void> => {
    if (USE_MOCK) {
      mockWishlist = mockWishlist.filter((i) => i.productId !== productId);
      return;
    }
    await apiRequest(`/api/wishlist/items/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
      auth: true,
    });
  },

  clear: async (): Promise<void> => {
    if (USE_MOCK) {
      mockWishlist = [];
      return;
    }
    await apiRequest('/api/wishlist', { method: 'DELETE', auth: true });
  },

  merge: async (items: WishlistEntry[]): Promise<WishlistEntry[]> => {
    if (USE_MOCK) {
      const map = new Map(mockWishlist.map((i) => [i.productId, i]));
      for (const it of items) if (!map.has(it.productId)) map.set(it.productId, it);
      mockWishlist = Array.from(map.values());
      return [...mockWishlist];
    }
    const res = await apiRequest<ServerResponse>('/api/wishlist', {
      method: 'PUT',
      auth: true,
      body: JSON.stringify({ merge: true, items }),
    });
    return toClient(res.data?.items);
  },
};
