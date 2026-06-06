import { apiRequest } from './client';

export type BannerType = 'hero' | 'promo';

export interface Banner {
  _id: string;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  badge?: string;
  image: string;
  link?: string;
  type: BannerType;
  position: number;
  isActive: boolean;
}

export const bannersApi = {
  list: async (type?: BannerType) => {
    return apiRequest<{ success: boolean; data: Banner[] }>(
      '/api/public/banners',
      { query: type ? { type } : undefined },
    );
  },
};
