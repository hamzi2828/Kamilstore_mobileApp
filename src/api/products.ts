import { apiRequest } from './client';
import type { ApiList, Product, ProductDetailResponse } from '@/types';
import {
  buildMockProductDetail,
  mockProductsList,
  mockProducts,
} from './mockData';

const USE_MOCK = false;

export interface ListProductsParams {
  search?: string;
  category?: string;
  subCategory?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

const filterMockProducts = (params: ListProductsParams): ApiList<Product> => {
  let data = [...mockProducts];

  if (params.search) {
    const q = params.search.toLowerCase();
    data = data.filter(
      (p) => p.name.toLowerCase().includes(q) || p.vendor?.name.toLowerCase().includes(q),
    );
  }
  if (params.category && params.category !== 'all') {
    data = data.filter((p) => p.category?.slug === params.category);
  }
  if (params.minPrice != null) {
    data = data.filter((p) => (p.discountPrice ?? p.sellingPrice) >= params.minPrice! * 100);
  }
  if (params.maxPrice != null) {
    data = data.filter((p) => (p.discountPrice ?? p.sellingPrice) <= params.maxPrice! * 100);
  }
  if (params.sort === 'price-low') data.sort((a, b) => (a.discountPrice ?? a.sellingPrice) - (b.discountPrice ?? b.sellingPrice));
  if (params.sort === 'price-high') data.sort((a, b) => (b.discountPrice ?? b.sellingPrice) - (a.discountPrice ?? a.sellingPrice));
  if (params.sort === 'name-asc') data.sort((a, b) => a.name.localeCompare(b.name));
  if (params.sort === 'name-desc') data.sort((a, b) => b.name.localeCompare(a.name));

  return {
    success: true,
    data,
    pagination: { total: data.length, page: 1, limit: data.length, pages: 1 },
  };
};

export const productsApi = {
  list: async (params: ListProductsParams = {}) => {
    if (USE_MOCK) return filterMockProducts(params);
    return apiRequest<ApiList<Product>>('/api/public/products', { query: params as Record<string, string | number | boolean | null | undefined> });
  },

  detail: async (slug: string) => {
    if (USE_MOCK) return buildMockProductDetail(slug);
    return apiRequest<{ success: boolean; data: ProductDetailResponse }>(
      `/api/public/products/${encodeURIComponent(slug)}`,
    );
  },
};

export { mockProductsList };
