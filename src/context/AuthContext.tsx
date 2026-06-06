import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '@/api/auth';
import { STORAGE_KEYS } from '@/utils/storage';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate session on launch
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.token);
        if (!token) return;
        const me = await authApi.me();
        if (!cancelled) setUser(me.data);
      } catch {
        await AsyncStorage.removeItem(STORAGE_KEYS.token);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    await AsyncStorage.setItem(STORAGE_KEYS.token, res.token);
    setUser(res.data);
  }, []);

  const register = useCallback(
    async (input: { name: string; email: string; password: string; phone?: string }) => {
      const res = await authApi.register(input);
      await AsyncStorage.setItem(STORAGE_KEYS.token, res.token);
      setUser(res.data);
    },
    [],
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    await AsyncStorage.removeItem(STORAGE_KEYS.token);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
    }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
