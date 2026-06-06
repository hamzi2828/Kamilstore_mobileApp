import { apiRequest } from './client';
import type { User } from '@/types';

const USE_MOCK = false;

interface AuthResponse {
  success: boolean;
  token: string;
  data: User;
}

interface MeResponse {
  success: boolean;
  data: User;
}

const mockUser: User = {
  _id: 'demo-user-1',
  name: 'Demo User',
  email: 'demo@kamilstore.com',
  phone: '+92-300-1234567',
  role: 'user',
  isActive: true,
};

const fakeToken = 'demo-token-abc123';

export const authApi = {
  login: async (email: string, _password: string): Promise<AuthResponse> => {
    if (USE_MOCK) {
      return { success: true, token: fakeToken, data: { ...mockUser, email: email || mockUser.email } };
    }
    return apiRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: _password }),
    });
  },

  register: async (input: { name: string; email: string; password: string; phone?: string }): Promise<AuthResponse> => {
    if (USE_MOCK) {
      return {
        success: true,
        token: fakeToken,
        data: { ...mockUser, name: input.name, email: input.email, phone: input.phone },
      };
    }
    return apiRequest<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  me: async (): Promise<MeResponse> => {
    if (USE_MOCK) return { success: true, data: mockUser };
    return apiRequest<MeResponse>('/api/auth/me', { auth: true });
  },

  logout: async () => {
    if (USE_MOCK) return { success: true };
    return apiRequest<{ success: boolean }>('/api/auth/logout', {
      method: 'POST',
      auth: true,
    }).catch(() => ({ success: true }));
  },
};
