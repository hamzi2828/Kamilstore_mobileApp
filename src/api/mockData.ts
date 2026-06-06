import type {
  ApiList,
  Category,
  Product,
  ProductDetailResponse,
} from '@/types';

const IMG = {
  macbook: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=600&fit=crop',
  headphones: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600&h=600&fit=crop',
  shoes: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop',
  galaxy: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&h=600&fit=crop',
  vacuum: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=600&fit=crop',
  leggings: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&h=600&fit=crop',
  ipad: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&h=600&fit=crop',
  hue: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&h=600&fit=crop',
  airpods: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600&h=600&fit=crop',
  rayban: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=600&fit=crop',
  gopro: 'https://images.unsplash.com/photo-1606986628253-49efbef58200?w=600&h=600&fit=crop',
  speaker: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=600&fit=crop',
};

export const mockCategories: Category[] = [
  { _id: 'c1', name: 'Electronics', slug: 'electronics', description: 'Phones, laptops, audio' },
  { _id: 'c2', name: 'Fashion', slug: 'fashion', description: 'Clothing & footwear' },
  { _id: 'c3', name: 'Home & Kitchen', slug: 'home-kitchen', description: 'Appliances & decor' },
  { _id: 'c4', name: 'Sports', slug: 'sports', description: 'Fitness & outdoor' },
  { _id: 'c5', name: 'Beauty', slug: 'beauty', description: 'Skincare & cosmetics' },
];

export const mockProducts: Product[] = [
  { _id: 'p1', name: 'Apple MacBook Pro 14-inch M3 Pro', slug: 'macbook-pro-14-m3', images: [IMG.macbook], sellingPrice: 199999, discountPrice: 184999, rating: 4.9, reviewCount: 234, category: { _id: 'c1', name: 'Electronics', slug: 'electronics' }, vendor: { name: 'TechZone', slug: 'v-techzone' } },
  { _id: 'p2', name: 'Sony WH-1000XM5 Wireless Headphones', slug: 'sony-wh-1000xm5', images: [IMG.headphones], sellingPrice: 39999, discountPrice: 34999, rating: 4.8, reviewCount: 567, category: { _id: 'c1', name: 'Electronics', slug: 'electronics' }, vendor: { name: 'AudioMax', slug: 'v-audiomax' } },
  { _id: 'p3', name: 'Nike Air Max 270 Running Shoes', slug: 'nike-air-max-270', images: [IMG.shoes], sellingPrice: 15000, discountPrice: 11999, rating: 4.6, reviewCount: 891, category: { _id: 'c4', name: 'Sports', slug: 'sports' }, vendor: { name: 'SportsFit Pro', slug: 'v-sportsfit' } },
  { _id: 'p4', name: 'Samsung Galaxy S24 Ultra 256GB', slug: 'samsung-galaxy-s24-ultra', images: [IMG.galaxy], sellingPrice: 129999, rating: 4.7, reviewCount: 432, category: { _id: 'c1', name: 'Electronics', slug: 'electronics' }, vendor: { name: 'TechZone', slug: 'v-techzone' } },
  { _id: 'p5', name: 'Dyson V15 Detect Vacuum Cleaner', slug: 'dyson-v15-detect', images: [IMG.vacuum], sellingPrice: 74999, discountPrice: 64999, rating: 4.8, reviewCount: 198, category: { _id: 'c3', name: 'Home & Kitchen', slug: 'home-kitchen' }, vendor: { name: 'HomeStyle Decor', slug: 'v-homestyle' } },
  { _id: 'p6', name: 'Lululemon Align High-Rise Leggings', slug: 'lululemon-align-leggings', images: [IMG.leggings], sellingPrice: 9800, rating: 4.7, reviewCount: 1023, category: { _id: 'c2', name: 'Fashion', slug: 'fashion' }, vendor: { name: 'FashionPlus', slug: 'v-fashionplus' } },
  { _id: 'p7', name: 'iPad Pro 12.9-inch M2 WiFi 256GB', slug: 'ipad-pro-12-m2', images: [IMG.ipad], sellingPrice: 109999, rating: 4.9, reviewCount: 345, category: { _id: 'c1', name: 'Electronics', slug: 'electronics' }, vendor: { name: 'TechZone', slug: 'v-techzone' } },
  { _id: 'p8', name: 'Philips Hue Smart Lighting Starter Kit', slug: 'philips-hue-starter-kit', images: [IMG.hue], sellingPrice: 19999, discountPrice: 15999, rating: 4.5, reviewCount: 567, category: { _id: 'c3', name: 'Home & Kitchen', slug: 'home-kitchen' }, vendor: { name: 'HomeStyle Decor', slug: 'v-homestyle' } },
  { _id: 'p9', name: 'Apple AirPods Pro 2nd Gen USB-C', slug: 'airpods-pro-2-usb-c', images: [IMG.airpods], sellingPrice: 24900, discountPrice: 19999, rating: 4.9, reviewCount: 4321, category: { _id: 'c1', name: 'Electronics', slug: 'electronics' }, vendor: { name: 'TechZone', slug: 'v-techzone' } },
  { _id: 'p10', name: 'Ray-Ban Aviator Classic Sunglasses', slug: 'rayban-aviator-classic', images: [IMG.rayban], sellingPrice: 16100, discountPrice: 12999, rating: 4.6, reviewCount: 789, category: { _id: 'c2', name: 'Fashion', slug: 'fashion' }, vendor: { name: 'FashionPlus', slug: 'v-fashionplus' } },
  { _id: 'p11', name: 'GoPro HERO12 Black Action Camera', slug: 'gopro-hero12-black', images: [IMG.gopro], sellingPrice: 39999, rating: 4.7, reviewCount: 523, category: { _id: 'c1', name: 'Electronics', slug: 'electronics' }, vendor: { name: 'TechZone', slug: 'v-techzone' } },
  { _id: 'p12', name: 'JBL Flip 6 Portable Bluetooth Speaker', slug: 'jbl-flip-6-speaker', images: [IMG.speaker], sellingPrice: 12995, discountPrice: 9999, rating: 4.6, reviewCount: 1023, category: { _id: 'c1', name: 'Electronics', slug: 'electronics' }, vendor: { name: 'AudioMax', slug: 'v-audiomax' } },
];

export const mockProductsList: ApiList<Product> = {
  success: true,
  data: mockProducts,
  pagination: { total: mockProducts.length, page: 1, limit: 24, pages: 1 },
};

export const mockCategoriesList = {
  success: true,
  data: mockCategories,
};

export const buildMockProductDetail = (slug: string): { success: boolean; data: ProductDetailResponse } => {
  const base = mockProducts.find((p) => p.slug === slug) || mockProducts[0];
  const sellingDollars = base.sellingPrice / 100;
  return {
    success: true,
    data: {
      product: {
        _id: base._id,
        name: base.name,
        slug: base.slug,
        description:
          'Premium quality product with industry-leading features. Designed to elevate your everyday experience with thoughtful materials, ergonomic design, and a one-year manufacturer warranty.',
        images: base.images,
        thumbnailImage: base.images[0],
        variantPricing: [
          {
            sku: `${base._id}-DEFAULT`,
            quantity: 25,
            costPrice: sellingDollars * 0.6,
            sellingPrice: sellingDollars,
            discountType: base.discountPrice ? 'flat' : 'none',
            discountValue: base.discountPrice ? (base.sellingPrice - base.discountPrice) / 100 : 0,
            combination: [],
          },
        ],
        category: base.category || null,
        subCategory: null,
      },
      vendor: base.vendor
        ? {
            _id: base.vendor.slug,
            name: base.vendor.name,
            slug: base.vendor.slug,
            logo: null,
            address: 'Karachi, Pakistan',
            description: `${base.vendor.name} — trusted seller on Kamilstore.`,
          }
        : null,
      related: mockProducts.filter((p) => p._id !== base._id).slice(0, 6),
    },
  };
};
