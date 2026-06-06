export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  isActive?: boolean;
}

export interface Vendor {
  _id: string;
  name: string;
  slug?: string;
  logo?: string | null;
  address?: string;
  description?: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string | null;
  description?: string;
  subCategories?: SubCategory[];
}

export interface SubCategory {
  _id: string;
  name: string;
  slug: string;
  image?: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  images: string[];
  sellingPrice: number;        // in cents
  discountPrice?: number;      // in cents
  rating: number;
  reviewCount: number;
  category?: { _id: string; name: string; slug: string } | null;
  vendor?: { name: string; slug: string };
}

export interface ProductVariantPricing {
  _id?: string;
  sku: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  discountType?: 'percentage' | 'flat' | 'none' | '';
  discountValue?: number;
  image?: string;
  combination?: Array<{
    attributeName?: string;
    valueName?: string;
  }>;
}

export interface ProductDetail {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  images: string[];
  thumbnailImage?: string;
  variantPricing: ProductVariantPricing[];
  category?: { _id: string; name: string; slug: string } | null;
  subCategory?: { _id: string; name: string; slug: string } | null;
}

export interface ProductDetailResponse {
  product: ProductDetail;
  vendor: Vendor | null;
  related: Product[];
}

export interface CartLine {
  _id: string;
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  sellingPrice: number;
  unitPrice: number;
  stock: number;
  quantity: number;
  variantSku?: string;
  variantLabel?: string;
  vendor?: { _id: string; name: string };
}

export interface WishlistEntry {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  sellingPrice: number;
  unitPrice: number;
  inStock: boolean;
  vendor?: { _id: string; name: string };
  addedAt: string;
}

export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiList<T> {
  success: boolean;
  data: T[];
  pagination?: PageMeta;
}
