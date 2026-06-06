import { apiRequest } from './client';
import type { ApiList } from '@/types';

export interface PublicVendor {
  _id: string;
  shopName: string;
  shopTitle?: string;
  logo?: string | null;
  address?: string;
  description?: string;
  owner?: { name?: string; email?: string; phone?: string } | null;
  createdAt?: string;
}

export interface ListVendorsParams {
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export const vendorsApi = {
  list: async (params: ListVendorsParams = {}) => {
    return apiRequest<ApiList<PublicVendor>>('/api/public/vendors', {
      query: params as Record<string, string | number | boolean | null | undefined>,
    });
  },
};
