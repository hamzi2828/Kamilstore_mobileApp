import { apiRequest } from './client';
import type { Category } from '@/types';
import { mockCategoriesList } from './mockData';

const USE_MOCK = false;

export const categoriesApi = {
  list: async () => {
    if (USE_MOCK) return mockCategoriesList;
    return apiRequest<{ success: boolean; data: Category[] }>('/api/public/categories');
  },
};
