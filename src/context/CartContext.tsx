import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { cartApi } from '@/api/cart';
import { useAuth } from './AuthContext';
import { readJson, writeJson, removeKey, STORAGE_KEYS } from '@/utils/storage';
import type { CartLine } from '@/types';

interface CartInput {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  sellingPrice: number;
  unitPrice: number;
  stock: number;
  quantity?: number;
  variantSku?: string;
  variantLabel?: string;
  vendor?: { _id: string; name: string };
}

interface CartContextValue {
  items: CartLine[];
  totalItems: number;
  subtotal: number;
  isReady: boolean;
  add: (input: CartInput) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  remove: (lineId: string) => void;
  clear: () => void;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

const lineIdFor = (productId: string, variantSku?: string) =>
  variantSku ? `${productId}::${variantSku}` : productId;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [items, setItems] = useState<CartLine[]>([]);
  const [isReady, setIsReady] = useState(false);

  // Initial hydrate (local) once auth has resolved
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    (async () => {
      try {
        if (isAuthenticated) {
          const local = await readJson<CartLine[]>(STORAGE_KEYS.cart, []);
          if (local.length > 0) {
            const merged = await cartApi.merge(local);
            if (!cancelled) setItems(merged);
            await removeKey(STORAGE_KEYS.cart);
          } else {
            const server = await cartApi.fetch();
            if (!cancelled) setItems(server);
          }
        } else {
          const local = await readJson<CartLine[]>(STORAGE_KEYS.cart, []);
          if (!cancelled) setItems(local);
        }
      } catch {
        // ignore — fall back to whatever was loaded
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated]);

  // Persist locally whenever the cart changes for guest users
  useEffect(() => {
    if (!isReady || isAuthenticated) return;
    writeJson(STORAGE_KEYS.cart, items);
  }, [items, isReady, isAuthenticated]);

  const add = useCallback(
    (input: CartInput) => {
      const qty = Math.max(1, input.quantity ?? 1);
      const lineId = lineIdFor(input.productId, input.variantSku);
      const newLine: CartLine = {
        _id: lineId,
        productId: input.productId,
        slug: input.slug,
        name: input.name,
        image: input.image,
        sellingPrice: input.sellingPrice,
        unitPrice: input.unitPrice,
        stock: input.stock || Number.MAX_SAFE_INTEGER,
        quantity: qty,
        variantSku: input.variantSku,
        variantLabel: input.variantLabel,
        vendor: input.vendor,
      };

      setItems((prev) => {
        const existing = prev.find((i) => i._id === lineId);
        if (existing) {
          const cap = existing.stock || Number.MAX_SAFE_INTEGER;
          const nextQty = Math.min(cap, existing.quantity + qty);
          return prev.map((i) => (i._id === lineId ? { ...existing, quantity: nextQty } : i));
        }
        return [...prev, newLine];
      });

      if (isAuthenticated) {
        cartApi.add(newLine).then((server) => {
          if (server.length > 0) setItems(server);
        }).catch(() => {});
      }
    },
    [isAuthenticated],
  );

  const setQuantity = useCallback(
    (lineId: string, quantity: number) => {
      setItems((prev) =>
        prev.map((i) => {
          if (i._id !== lineId) return i;
          const capped = Math.max(1, Math.min(i.stock || Number.MAX_SAFE_INTEGER, quantity));
          return { ...i, quantity: capped };
        }),
      );
      if (isAuthenticated) cartApi.setQuantity(lineId, Math.max(1, quantity)).catch(() => {});
    },
    [isAuthenticated],
  );

  const remove = useCallback(
    (lineId: string) => {
      setItems((prev) => prev.filter((i) => i._id !== lineId));
      if (isAuthenticated) cartApi.remove(lineId).catch(() => {});
    },
    [isAuthenticated],
  );

  const clear = useCallback(() => {
    setItems([]);
    if (isAuthenticated) cartApi.clear().catch(() => {});
  }, [isAuthenticated]);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const server = await cartApi.fetch();
      setItems(server);
    } catch {
      // ignore
    }
  }, [isAuthenticated]);

  const { totalItems, subtotal } = useMemo(() => {
    let ti = 0;
    let sub = 0;
    for (const i of items) {
      ti += i.quantity;
      sub += i.unitPrice * i.quantity;
    }
    return { totalItems: ti, subtotal: sub };
  }, [items]);

  const value = useMemo<CartContextValue>(
    () => ({ items, totalItems, subtotal, isReady, add, setQuantity, remove, clear, refresh }),
    [items, totalItems, subtotal, isReady, add, setQuantity, remove, clear, refresh],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
