import React, { useEffect, useMemo, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Heart, Minus, Plus, ShoppingCart, Star, Store } from 'lucide-react-native';

import Loader from '@/components/Loader';
import PrimaryButton from '@/components/PrimaryButton';
import PriceText from '@/components/PriceText';
import ProductCard from '@/components/ProductCard';
import { productsApi } from '@/api/products';
import { resolveImageUrl } from '@/api/client';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { colors, radius, spacing, typography } from '@/theme';
import { discountPercent } from '@/utils/format';
import type { ProductDetailResponse } from '@/types';
import type { RootStackParamList } from '@/navigation/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Nav = NativeStackNavigationProp<RootStackParamList, 'ProductDetail'>;
type Route = RouteProp<RootStackParamList, 'ProductDetail'>;

const PLACEHOLDER =
  'https://png.pngtree.com/png-vector/20241018/ourmid/pngtree-running-shoes-or-sneakers-on-a-transparent-background-png-image_14112954.png';

export default function ProductDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { slug } = route.params;
  const cart = useCart();
  const wishlist = useWishlist();

  const [data, setData] = useState<ProductDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    productsApi
      .detail(slug)
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const product = data?.product;
  const vendor = data?.vendor;
  const related = data?.related ?? [];

  const variant = product?.variantPricing?.[selectedVariantIdx];
  const sellingPrice = useMemo(() => {
    if (!product) return 0;
    const prices = (product.variantPricing || []).map((v) => v.sellingPrice).filter(Boolean);
    const min = prices.length ? Math.min(...prices) : 0;
    return variant?.sellingPrice ?? min;
  }, [product, variant]);

  const discountPrice = useMemo(() => {
    if (!variant) return undefined;
    if (!variant.discountValue || variant.discountValue <= 0) return undefined;
    if (variant.discountType === 'flat') {
      return Math.max(0, variant.sellingPrice - variant.discountValue);
    }
    if (variant.discountType === 'percentage') {
      return variant.sellingPrice * (1 - variant.discountValue / 100);
    }
    return undefined;
  }, [variant]);

  const discount = discountPercent(sellingPrice, discountPrice);

  const wishlisted = product ? wishlist.isWishlisted(String(product._id)) : false;

  const images = useMemo(() => {
    if (!product) return [PLACEHOLDER];
    const all = [
      product.thumbnailImage,
      ...(product.images || []),
    ]
      .map((src) => resolveImageUrl(src))
      .filter(Boolean) as string[];
    return all.length > 0 ? all : [PLACEHOLDER];
  }, [product]);

  if (loading) return <Loader fullscreen label="Loading product..." />;

  if (error || !product) {
    return (
      <SafeAreaView style={styles.errorWrap}>
        <Text style={typography.h3}>Couldn&apos;t load product</Text>
        <Text style={[typography.body, { color: colors.textSubtle, marginTop: 4 }]}>
          {error || 'Try again later.'}
        </Text>
        <View style={{ marginTop: spacing.lg, width: 200 }}>
          <PrimaryButton label="Go back" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Image gallery */}
        <View style={styles.gallery}>
          <FlatList
            data={images}
            keyExtractor={(uri, i) => `${i}-${uri}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setSelectedImageIdx(idx);
            }}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.heroImage} resizeMode="cover" />
            )}
          />
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft size={20} color={colors.text} />
          </Pressable>
          <Pressable
            style={[styles.heartBtn, wishlisted && { backgroundColor: colors.rose }]}
            onPress={() =>
              wishlist.toggle({
                productId: String(product._id),
                slug: product.slug,
                name: product.name,
                image: product.images?.[0] || null,
                sellingPrice,
                unitPrice: discountPrice ?? sellingPrice,
                inStock: true,
                vendor: vendor ? { _id: String(vendor._id), name: vendor.name } : undefined,
              })
            }
          >
            <Heart
              size={20}
              color={wishlisted ? colors.white : colors.text}
              fill={wishlisted ? colors.white : 'transparent'}
            />
          </Pressable>
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discount}%</Text>
            </View>
          )}
          {images.length > 1 && (
            <View style={styles.dotsRow}>
              {images.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, selectedImageIdx === i && styles.dotActive]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Body */}
        <View style={styles.body}>
          {vendor ? (
            <View style={styles.vendorRow}>
              <Store size={14} color={colors.textFaint} />
              <Text style={styles.vendorName}>{vendor.name}</Text>
            </View>
          ) : null}
          <Text style={typography.h2}>{product.name}</Text>

          <View style={styles.metaRow}>
            <View style={styles.starsInline}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Star
                  key={i}
                  size={14}
                  color={colors.amber}
                  fill={i < 4 ? colors.amber : 'transparent'}
                />
              ))}
              <Text style={[typography.small, { marginLeft: 4 }]}>4.8 · 0 reviews</Text>
            </View>
          </View>

          <View style={{ marginTop: spacing.md }}>
            <PriceText
              sellingPrice={sellingPrice}
              discountPrice={discountPrice}
              size="lg"
            />
          </View>

          {product.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={[typography.body, { color: colors.textSubtle, lineHeight: 22 }]}>
                {product.description}
              </Text>
            </View>
          ) : null}

          {product.variantPricing && product.variantPricing.length > 1 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Variants</Text>
              <View style={styles.variantWrap}>
                {product.variantPricing.map((v, i) => {
                  const label =
                    v.combination?.map((c) => c.valueName).filter(Boolean).join(' · ') ||
                    v.sku;
                  return (
                    <Pressable
                      key={v._id || v.sku || i}
                      onPress={() => setSelectedVariantIdx(i)}
                      style={[
                        styles.variantChip,
                        selectedVariantIdx === i && styles.variantChipOn,
                      ]}
                    >
                      <Text
                        style={[
                          typography.smallStrong,
                          selectedVariantIdx === i && { color: colors.white },
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.qtyRow}>
              <Pressable
                style={styles.qtyBtn}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus size={16} color={colors.text} />
              </Pressable>
              <Text style={[typography.h4, { width: 40, textAlign: 'center' }]}>{quantity}</Text>
              <Pressable style={styles.qtyBtn} onPress={() => setQuantity((q) => q + 1)}>
                <Plus size={16} color={colors.text} />
              </Pressable>
            </View>
          </View>

          {related.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>You may also like</Text>
              <FlatList
                data={related}
                keyExtractor={(p) => p._id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: spacing.md, paddingTop: spacing.sm }}
                renderItem={({ item }) => (
                  <View style={{ width: 170 }}>
                    <ProductCard
                      product={item}
                      wishlisted={wishlist.isWishlisted(item._id)}
                      onPress={() => navigation.push('ProductDetail', { slug: item.slug })}
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
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <SafeAreaView edges={['bottom']} style={styles.cta}>
        <View style={styles.ctaInner}>
          <PrimaryButton
            label="Add to Cart"
            icon={<ShoppingCart size={16} color={colors.white} />}
            onPress={() => {
              const variantLabel =
                variant?.combination?.map((c) => c.valueName).filter(Boolean).join(' · ');
              cart.add({
                productId: String(product._id),
                slug: product.slug,
                name: product.name,
                image: product.images?.[0] || null,
                sellingPrice,
                unitPrice: discountPrice ?? sellingPrice,
                stock: variant?.quantity ?? 99,
                quantity,
                variantSku: variant?.sku,
                variantLabel,
                vendor: vendor ? { _id: String(vendor._id), name: vendor.name } : undefined,
              });
              navigation.navigate('Tabs', { screen: 'Cart' });
            }}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.bg,
  },
  gallery: { position: 'relative', backgroundColor: colors.surfaceMuted },
  heroImage: { width: SCREEN_WIDTH, height: SCREEN_WIDTH },
  backBtn: {
    position: 'absolute',
    top: spacing.xl + 8,
    left: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBtn: {
    position: 'absolute',
    top: spacing.xl + 8,
    right: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountBadge: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    backgroundColor: colors.roseDeep,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  discountText: { color: colors.white, fontSize: 11, fontWeight: '800' },
  dotsRow: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    gap: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.2)' },
  dotActive: { backgroundColor: colors.text, width: 14 },
  body: {
    backgroundColor: colors.bg,
    padding: spacing.lg,
    gap: 8,
  },
  vendorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  vendorName: { ...typography.faint, color: colors.textFaint },
  metaRow: { marginTop: 6 },
  starsInline: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  section: { marginTop: spacing.xl },
  sectionTitle: { ...typography.h4, marginBottom: spacing.sm },
  variantWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  variantChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  variantChipOn: { borderColor: colors.primary, backgroundColor: colors.primary },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  qtyBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
  ctaInner: { padding: spacing.lg },
});
