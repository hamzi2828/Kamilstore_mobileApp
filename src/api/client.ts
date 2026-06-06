import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/utils/storage';

const BACKEND_PORT = 5000;

function detectFromExpoHost(): string | null {
  const hostUri =
    (Constants.expoConfig as { hostUri?: string } | null)?.hostUri ||
    (Constants as unknown as { manifest2?: { extra?: { expoGo?: { developer?: { tool?: string } } } } })
      .manifest2?.extra?.expoGo?.developer?.tool ||
    (Constants as unknown as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;
  if (!hostUri) return null;
  const host = String(hostUri).split(':')[0];
  if (!host) return null;
  return `http://${host}:${BACKEND_PORT}`;
}

const fromExtra =
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  detectFromExpoHost() ||
  fromExtra ||
  'http://localhost:5000';

export function resolveImageUrl(src: string | null | undefined): string | null {
  if (!src) return null;
  if (/^https?:\/\//i.test(src)) return src;
  return `${API_BASE_URL}${src.startsWith('/') ? src : `/${src}`}`;
}

interface RequestOptions extends RequestInit {
  auth?: boolean;
  query?: Record<string, string | number | boolean | undefined | null>;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === '') continue;
    qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `${url}?${s}` : url;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { auth = false, query, headers, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(headers as Record<string, string> | undefined),
  };

  if (rest.body && !finalHeaders['Content-Type']) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.token);
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(buildUrl(path, query), {
    ...rest,
    headers: finalHeaders,
  });

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    // empty body is fine
  }

  if (!res.ok) {
    const message =
      (json as { message?: string } | null)?.message ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }

  return json as T;
}
