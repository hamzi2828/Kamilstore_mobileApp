import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { wishlistApi } from '@/api/wishlist';
import { useAuth } from './AuthContext';
import { readJson, writeJson, removeKey, STORAGE_KEYS } from '@/utils/storage';
import type { WishlistEntry } from '@/types';

type WishlistInput = Omit<WishlistEntry, 'addedAt'>;

interface WishlistContextValue {
  items: WishlistEntry[];
  totalItems: number;
  isReady: boolean;
  isWishlisted: (productId: string) => boolean;
  add: (input: WishlistInput) => void;
  remove: (productId: string) => void;
  toggle: (input: WishlistInput) => boolean;
  clear: () => void;
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [items, setItems] = useState<WishlistEntry[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    (async () => {
      try {
        if (isAuthenticated) {
          const local = await readJson<WishlistEntry[]>(STORAGE_KEYS.wishlist, []);
          if (local.length > 0) {
            const merged = await wishlistApi.merge(local);
            if (!cancelled) setItems(merged);
            await removeKey(STORAGE_KEYS.wishlist);
          } else {
            const server = await wishlistApi.fetch();
            if (!cancelled) setItems(server);
          }
        } else {
          const local = await readJson<WishlistEntry[]>(STORAGE_KEYS.wishlist, []);
          if (!cancelled) setItems(local);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (!isReady || isAuthenticated) return;
    writeJson(STORAGE_KEYS.wishlist, items);
  }, [items, isReady, isAuthenticated]);

  const isWishlisted = useCallback(
    (productId: string) => items.some((i) => i.productId === productId),
    [items],
  );

  const add = useCallback(
    (input: WishlistInput) => {
      const entry: WishlistEntry = { ...input, addedAt: new Date().toISOString() };
      setItems((prev) =>
        prev.some((i) => i.productId === entry.productId) ? prev : [...prev, entry],
      );
      if (isAuthenticated) wishlistApi.add(entry).catch(() => {});
    },
    [isAuthenticated],
  );

  const remove = useCallback(
    (productId: string) => {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      if (isAuthenticated) wishlistApi.remove(productId).catch(() => {});
    },
    [isAuthenticated],
  );

  const toggle = useCallback(
    (input: WishlistInput): boolean => {
      let nowActive = false;
      setItems((prev) => {
        const idx = prev.findIndex((i) => i.productId === input.productId);
        if (idx >= 0) {
          if (isAuthenticated) wishlistApi.remove(input.productId).catch(() => {});
          nowActive = false;
          return prev.filter((i) => i.productId !== input.productId);
        }
        const entry: WishlistEntry = { ...input, addedAt: new Date().toISOString() };
        if (isAuthenticated) wishlistApi.add(entry).catch(() => {});
        nowActive = true;
        return [...prev, entry];
      });
      return nowActive;
    },
    [isAuthenticated],
  );

  const clear = useCallback(() => {
    setItems([]);
    if (isAuthenticated) wishlistApi.clear().catch(() => {});
  }, [isAuthenticated]);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const server = await wishlistApi.fetch();
      setItems(server);
    } catch {
      // ignore
    }
  }, [isAuthenticated]);

  const value = useMemo<WishlistContextValue>(
    () => ({
      items,
      totalItems: items.length,
      isReady,
      isWishlisted,
      add,
      remove,
      toggle,
      clear,
      refresh,
    }),
    [items, isReady, isWishlisted, add, remove, toggle, clear, refresh],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
