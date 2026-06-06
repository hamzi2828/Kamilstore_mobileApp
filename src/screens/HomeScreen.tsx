import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  ArrowRight,
  Bell,
  ChevronRight,
  MapPin,
  ShieldCheck,
  Sparkles,
  Store,
  Tag,
  TrendingUp,
  Zap,
} from 'lucide-react-native';

import ScreenContainer from '@/components/ScreenContainer';
import SearchBar from '@/components/SearchBar';
import ProductCard from '@/components/ProductCard';
import Loader from '@/components/Loader';
import { categoriesApi } from '@/api/categories';
import { productsApi } from '@/api/products';
import { bannersApi, type Banner } from '@/api/banners';
import { vendorsApi, type PublicVendor } from '@/api/vendors';
import { resolveImageUrl } from '@/api/client';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { colors, radius, spacing, typography } from '@/theme';
import { discountPercent, formatPrice } from '@/utils/format';
import type { Category, Product } from '@/types';
import type { RootStackParamList, TabParamList } from '@/navigation/types';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const SCREEN_WIDTH = Dimensions.get('window').width;
const HERO_SLIDE_INTERVAL = 4500;

const QUICK_LINKS = [
  { id: 'deals', label: 'Deals', icon: Tag, color: colors.roseDeep, bg: '#FFE4E6' },
  { id: 'flash', label: 'Flash Sale', icon: Zap, color: colors.amber, bg: '#FEF3C7' },
  { id: 'trending', label: 'Trending', icon: TrendingUp, color: colors.blue, bg: '#DBEAFE' },
  { id: 'new', label: 'New', icon: Sparkles, color: colors.primary, bg: '#FFEDD5' },
];

const CATEGORY_PALETTE = [
  { color: '#3B82F6', bg: '#EFF6FF' },
  { color: '#EC4899', bg: '#FDF2F8' },
  { color: '#10B981', bg: '#ECFDF5' },
  { color: '#F59E0B', bg: '#FFFBEB' },
  { color: '#A855F7', bg: '#FAF5FF' },
  { color: '#EF4444', bg: '#FEF2F2' },
  { color: '#0EA5E9', bg: '#F0F9FF' },
  { color: '#F97316', bg: '#FFF7ED' },
];

const paletteFor = (i: number) => CATEGORY_PALETTE[i % CATEGORY_PALETTE.length];

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const cart = useCart();
  const wishlist = useWishlist();

  const [search, setSearch] = useState('');
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newest, setNewest] = useState<Product[]>([]);
  const [deals, setDeals] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<PublicVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const safe = async <T,>(p: Promise<T>, fallback: T): Promise<T> => {
      try { return await p; } catch { return fallback; }
    };

    const empty = { success: true, data: [] as never[] };
    const [bRes, cRes, fRes, nRes, dRes, vRes] = await Promise.all([
      safe(bannersApi.list('hero'), empty),
      safe(categoriesApi.list(), empty),
      safe(productsApi.list({ sort: 'featured', limit: 8 }), empty),
      safe(productsApi.list({ sort: 'newest', limit: 6 }), empty),
      safe(productsApi.list({ sort: 'featured', limit: 12 }), empty),
      safe(vendorsApi.list({ limit: 6 }), empty),
    ]);

    setBanners((bRes.data as Banner[]).filter((b) => b.isActive !== false));
    setCategories(cRes.data as Category[]);
    setFeatured(fRes.data as Product[]);
    setNewest(nRes.data as Product[]);
    setDeals(
      (dRes.data as Product[])
        .filter((p) => discountPercent(p.sellingPrice, p.discountPrice) > 0)
        .sort(
          (a, b) =>
            discountPercent(b.sellingPrice, b.discountPrice) -
            discountPercent(a.sellingPrice, a.discountPrice),
        )
        .slice(0, 6),
    );
    setVendors(vRes.data as PublicVendor[]);

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const goSearch = () => navigation.navigate('Browse', undefined);
  const goAllCategories = () => navigation.navigate('Categories');

  if (loading) return <Loader fullscreen label="Loading..." />;

  return (
    <ScreenContainer scroll padding={false} refreshing={refreshing} onRefresh={onRefresh}>
      {/* Hero header */}
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.heroLocationRow}>
              <MapPin size={12} color={colors.white} />
              <Text style={styles.heroLocation}>Deliver to your doorstep</Text>
            </View>
            <Text style={styles.heroBrand}>Kamilstore</Text>
          </View>
          <Pressable style={styles.iconCircle} hitSlop={8}>
            <Bell size={18} color={colors.white} />
          </Pressable>
        </View>
        <Text style={styles.heroTagline}>Shop from thousands of verified vendors</Text>
        <View style={{ marginTop: spacing.lg }}>
          <SearchBar value={search} onChangeText={setSearch} onSubmitEditing={goSearch} />
        </View>
      </View>

      {/* Real banner carousel (only if banners exist) */}
      {banners.length > 0 && (
        <View style={{ marginTop: -spacing.xl }}>
          <BannerCarousel banners={banners} onPress={goSearch} />
        </View>
      )}

      {/* Quick links */}
      <View style={{ paddingHorizontal: spacing.lg, marginTop: banners.length > 0 ? spacing.lg : spacing.xl }}>
        <View style={styles.quickRow}>
          {QUICK_LINKS.map((q) => {
            const Icon = q.icon;
            return (
              <Pressable
                key={q.id}
                style={styles.quickItem}
                onPress={() =>
                  navigation.navigate('Browse', q.id === 'new' ? { newArrivals: true } : undefined)
                }
              >
                <View style={[styles.quickIcon, { backgroundColor: q.bg }]}>
                  <Icon size={22} color={q.color} />
                </View>
                <Text style={styles.quickLabel}>{q.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Categories */}
      {categories.length > 0 && (
        <>
          <View style={{ paddingHorizontal: spacing.lg }}>
            <SectionHeader
              title="Shop by Category"
              subtitle={`${categories.length} ${categories.length === 1 ? 'collection' : 'collections'}`}
              actionLabel="See all"
              onAction={goAllCategories}
            />
          </View>
          <FlatList
            data={categories.slice(0, 10)}
            keyExtractor={(c) => c._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
            renderItem={({ item, index }) => {
              const palette = paletteFor(index);
              const url = resolveImageUrl(item.image);
              return (
                <Pressable
                  style={styles.catCard}
                  onPress={() => navigation.navigate('Browse', { category: item.slug })}
                >
                  <View style={[styles.catIcon, { backgroundColor: palette.bg }]}>
                    {url ? (
                      <Image source={{ uri: url }} style={styles.catImage} />
                    ) : (
                      <Text style={[styles.catLetter, { color: palette.color }]}>
                        {item.name.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.catLabel} numberOfLines={1}>{item.name}</Text>
                </Pressable>
              );
            }}
          />
        </>
      )}

      {/* Deals — derived from real product discount data */}
      {deals.length > 0 && (
        <>
          <View style={{ paddingHorizontal: spacing.lg }}>
            <SectionHeader
              title="Hot Deals"
              subtitle={`${deals.length} discounted items`}
              actionLabel="See more"
              onAction={() => navigation.navigate('Browse', undefined)}
            />
          </View>
          <FlatList
            data={deals}
            keyExtractor={(p) => p._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
            renderItem={({ item }) => {
              const pct = discountPercent(item.sellingPrice, item.discountPrice);
              return (
                <Pressable
                  style={styles.dealCard}
                  onPress={() => navigation.navigate('ProductDetail', { slug: item.slug })}
                >
                  <View style={styles.dealImageWrap}>
                    <Image
                      source={{ uri: resolveImageUrl(item.images?.[0]) || undefined }}
                      style={styles.dealImage}
                    />
                    {pct > 0 && (
                      <View style={styles.dealDiscount}>
                        <Text style={styles.dealDiscountText}>-{pct}%</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ padding: spacing.sm, gap: 4 }}>
                    {item.vendor ? (
                      <Text style={styles.dealVendor} numberOfLines={1}>
                        {item.vendor.name.toUpperCase()}
                      </Text>
                    ) : null}
                    <Text style={styles.dealName} numberOfLines={2}>{item.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                      <Text style={styles.dealPrice}>
                        {formatPrice(item.discountPrice ?? item.sellingPrice)}
                      </Text>
                      {item.discountPrice ? (
                        <Text style={styles.dealPriceOld}>{formatPrice(item.sellingPrice)}</Text>
                      ) : null}
                    </View>
                  </View>
                </Pressable>
              );
            }}
          />
        </>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <>
          <View style={{ paddingHorizontal: spacing.lg }}>
            <SectionHeader
              title="Featured"
              subtitle="Handpicked for you"
              actionLabel="See more"
              onAction={() => navigation.navigate('Browse', undefined)}
            />
          </View>
          <FlatList
            data={featured}
            keyExtractor={(p) => p._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
            renderItem={({ item }) => (
              <View style={{ width: 180 }}>
                <ProductCard
                  product={item}
                  wishlisted={wishlist.isWishlisted(item._id)}
                  onPress={() => navigation.navigate('ProductDetail', { slug: item.slug })}
                  onAddToCart={() =>
                    cart.add({
                      productId: item._id,
                      slug: item.slug,
                      name: item.name,
                      image: item.images?.[0] || null,
                      sellingPrice: item.sellingPrice,
                      unitPrice: item.discountPrice ?? item.sellingPrice,
                      stock: 99,
                      vendor: item.vendor
                        ? { _id: item.vendor.slug, name: item.vendor.name }
                        : undefined,
                    })
                  }
                  onToggleWishlist={() =>
                    wishlist.toggle({
                      productId: item._id,
                      slug: item.slug,
                      name: item.name,
                      image: item.images?.[0] || null,
                      sellingPrice: item.sellingPrice,
                      unitPrice: item.discountPrice ?? item.sellingPrice,
                      inStock: true,
                      vendor: item.vendor
                        ? { _id: item.vendor.slug, name: item.vendor.name }
                        : undefined,
                    })
                  }
                />
              </View>
            )}
          />
        </>
      )}

      {/* Real Top Vendors */}
      {vendors.length > 0 && (
        <>
          <View style={{ paddingHorizontal: spacing.lg }}>
            <SectionHeader
              title="Top Vendors"
              subtitle={`${vendors.length} verified ${vendors.length === 1 ? 'seller' : 'sellers'}`}
              actionLabel="View all"
              onAction={() => navigation.navigate('Browse', undefined)}
            />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
          >
            {vendors.map((v, i) => {
              const palette = paletteFor(i);
              const logo = resolveImageUrl(v.logo);
              return (
                <Pressable
                  key={v._id}
                  style={styles.vendorCard}
                  onPress={() => navigation.navigate('Browse', undefined)}
                >
                  <View style={[styles.vendorAvatar, { backgroundColor: palette.bg }]}>
                    {logo ? (
                      <Image source={{ uri: logo }} style={styles.vendorLogo} />
                    ) : (
                      <Store size={22} color={palette.color} />
                    )}
                  </View>
                  <Text style={styles.vendorName} numberOfLines={1}>{v.shopName}</Text>
                  {v.shopTitle && v.shopTitle !== v.shopName ? (
                    <Text style={styles.vendorTitle} numberOfLines={1}>{v.shopTitle}</Text>
                  ) : v.address ? (
                    <Text style={styles.vendorTitle} numberOfLines={1}>{v.address}</Text>
                  ) : null}
                  <View style={styles.vendorVerified}>
                    <ShieldCheck size={10} color={colors.emerald} />
                    <Text style={styles.vendorVerifiedText}>Verified</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      )}

      {/* New Arrivals */}
      {newest.length > 0 && (
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.xxxl }}>
          <SectionHeader
            title="New Arrivals"
            subtitle="Fresh in the store"
            actionLabel="See all"
            onAction={() => navigation.navigate('Browse', { newArrivals: true })}
          />
          <View style={{ marginTop: spacing.md, gap: spacing.md }}>
            {newest.slice(0, 4).map((item) => (
              <ProductCard
                key={item._id}
                product={item}
                layout="list"
                wishlisted={wishlist.isWishlisted(item._id)}
                onPress={() => navigation.navigate('ProductDetail', { slug: item.slug })}
                onAddToCart={() =>
                  cart.add({
                    productId: item._id,
                    slug: item.slug,
                    name: item.name,
                    image: item.images?.[0] || null,
                    sellingPrice: item.sellingPrice,
                    unitPrice: item.discountPrice ?? item.sellingPrice,
                    stock: 99,
                    vendor: item.vendor
                      ? { _id: item.vendor.slug, name: item.vendor.name }
                      : undefined,
                  })
                }
                onToggleWishlist={() =>
                  wishlist.toggle({
                    productId: item._id,
                    slug: item.slug,
                    name: item.name,
                    image: item.images?.[0] || null,
                    sellingPrice: item.sellingPrice,
                    unitPrice: item.discountPrice ?? item.sellingPrice,
                    inStock: true,
                    vendor: item.vendor
                      ? { _id: item.vendor.slug, name: item.vendor.name }
                      : undefined,
                  })
                }
              />
            ))}
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}

function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel ? (
        <Pressable onPress={onAction} style={styles.sectionAction} hitSlop={10}>
          <Text style={styles.sectionActionText}>{actionLabel}</Text>
          <ChevronRight size={14} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

function BannerCarousel({ banners, onPress }: { banners: Banner[]; onPress: () => void }) {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const slideWidth = SCREEN_WIDTH - spacing.lg * 2;

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % banners.length;
        scrollRef.current?.scrollTo({ x: next * (slideWidth + spacing.md), animated: true });
        return next;
      });
    }, HERO_SLIDE_INTERVAL);
    return () => clearInterval(t);
  }, [slideWidth, banners.length]);

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={slideWidth + spacing.md}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: spacing.lg }}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / (slideWidth + spacing.md));
          setIndex(i);
        }}
      >
        {banners.map((b) => {
          const url = resolveImageUrl(b.image);
          return (
            <Pressable
              key={b._id}
              onPress={onPress}
              style={[styles.bannerSlide, { width: slideWidth }]}
            >
              {url ? (
                <Image source={{ uri: url }} style={styles.bannerImage} />
              ) : (
                <View style={[styles.bannerImage, { backgroundColor: colors.surfaceMuted }]} />
              )}
              <View style={styles.bannerOverlay} />
              <View style={styles.bannerContent}>
                {b.eyebrow || b.badge ? (
                  <View style={styles.bannerTag}>
                    <Text style={styles.bannerTagText}>{b.badge || b.eyebrow}</Text>
                  </View>
                ) : null}
                <Text style={styles.bannerTitle} numberOfLines={2}>{b.title}</Text>
                {b.subtitle ? (
                  <Text style={styles.bannerSubtitle} numberOfLines={2}>{b.subtitle}</Text>
                ) : null}
                <View style={styles.bannerCta}>
                  <Text style={styles.bannerCtaText}>Shop now</Text>
                  <ArrowRight size={13} color={colors.primary} />
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
      {banners.length > 1 && (
        <View style={styles.dotsRow}>
          {banners.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, opacity: 0.9 },
  heroLocation: { color: colors.white, fontSize: 11, fontWeight: '500', letterSpacing: 0.3 },
  heroBrand: { ...typography.h1, color: colors.white, fontSize: 26, marginTop: 2 },
  heroTagline: { ...typography.body, color: colors.primarySoft, marginTop: 6 },
  iconCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Banner
  bannerSlide: {
    height: 170,
    borderRadius: radius.lg,
    marginRight: spacing.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    position: 'relative',
  },
  bannerImage: { width: '100%', height: '100%' },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  bannerContent: {
    position: 'absolute', left: 0, right: 0, bottom: 0, top: 0,
    padding: spacing.lg,
    justifyContent: 'flex-end',
    gap: 6,
  },
  bannerTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.sm,
    marginBottom: 2,
  },
  bannerTagText: { color: colors.white, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  bannerTitle: { color: colors.white, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  bannerSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 12 },
  bannerCta: {
    marginTop: 6,
    alignSelf: 'flex-start',
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.white,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: radius.pill,
  },
  bannerCtaText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.borderStrong },
  dotActive: { width: 16, backgroundColor: colors.primary },

  // Quick links
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickItem: { alignItems: 'center', gap: 6, flex: 1 },
  quickIcon: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  quickLabel: { ...typography.smallStrong, fontSize: 11, color: colors.text },

  // Categories
  catCard: { width: 90, alignItems: 'center', gap: 8 },
  catIcon: {
    width: 70, height: 70, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  catImage: { width: 70, height: 70, resizeMode: 'cover' },
  catLetter: { fontSize: 28, fontWeight: '800' },
  catLabel: { ...typography.smallStrong, fontSize: 12, textAlign: 'center', color: colors.text },

  // Deals
  dealCard: {
    width: 160,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  dealImageWrap: { width: '100%', aspectRatio: 1, backgroundColor: colors.surfaceMuted, position: 'relative' },
  dealImage: { width: '100%', height: '100%' },
  dealDiscount: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: colors.roseDeep,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
  },
  dealDiscountText: { color: colors.white, fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
  dealVendor: { ...typography.faint, color: colors.textFaint },
  dealName: { ...typography.smallStrong, fontSize: 12, lineHeight: 15, color: colors.text },
  dealPrice: { fontSize: 14, fontWeight: '800', color: colors.roseDeep },
  dealPriceOld: { fontSize: 11, color: colors.textFaint, textDecorationLine: 'line-through' },

  // Vendors
  vendorCard: {
    width: 150,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 6,
  },
  vendorAvatar: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  vendorLogo: { width: 56, height: 56 },
  vendorName: { ...typography.smallStrong, fontSize: 13, textAlign: 'center', color: colors.text },
  vendorTitle: { ...typography.small, fontSize: 11, color: colors.textFaint, textAlign: 'center' },
  vendorVerified: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    marginTop: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: radius.sm,
  },
  vendorVerifiedText: { fontSize: 9, color: colors.emerald, fontWeight: '700' },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  sectionTitle: { ...typography.h3 },
  sectionSubtitle: { ...typography.small, color: colors.textFaint, marginTop: 2 },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sectionActionText: { ...typography.smallStrong, color: colors.primary },
});
