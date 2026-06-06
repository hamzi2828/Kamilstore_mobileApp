import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Heart, ShoppingCart, Star } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '@/theme';
import { discountPercent, formatPrice } from '@/utils/format';
import { resolveImageUrl } from '@/api/client';
import type { Product } from '@/types';

const PLACEHOLDER =
  'https://png.pngtree.com/png-vector/20241018/ourmid/pngtree-running-shoes-or-sneakers-on-a-transparent-background-png-image_14112954.png';

interface Props {
  product: Product;
  onPress?: () => void;
  onAddToCart?: () => void;
  onToggleWishlist?: () => void;
  wishlisted?: boolean;
  /** Width: 'half' for two-up grid, 'full' for list mode */
  layout?: 'grid' | 'list';
}

export default function ProductCard({
  product,
  onPress,
  onAddToCart,
  onToggleWishlist,
  wishlisted = false,
  layout = 'grid',
}: Props) {
  const discount = discountPercent(product.sellingPrice, product.discountPrice);
  const image = resolveImageUrl(product.images?.[0]) || PLACEHOLDER;

  if (layout === 'list') {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.list, pressed && styles.pressed]}>
        <Image source={{ uri: image }} style={styles.listImage} resizeMode="cover" />
        <View style={styles.listInfo}>
          {product.vendor ? (
            <Text style={styles.vendor} numberOfLines={1}>
              {product.vendor.name.toUpperCase()}
            </Text>
          ) : null}
          <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
          <Stars rating={product.rating} reviewCount={product.reviewCount} />
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(product.discountPrice ?? product.sellingPrice)}</Text>
            {product.discountPrice ? (
              <Text style={styles.priceOld}>{formatPrice(product.sellingPrice)}</Text>
            ) : null}
          </View>
        </View>
        <View style={styles.listActions}>
          <Pressable onPress={onToggleWishlist} style={styles.iconBtn} hitSlop={8}>
            <Heart
              size={18}
              color={wishlisted ? colors.white : colors.text}
              fill={wishlisted ? colors.rose : 'transparent'}
            />
          </Pressable>
          <Pressable onPress={onAddToCart} style={[styles.iconBtn, styles.iconBtnDark]} hitSlop={8}>
            <ShoppingCart size={18} color={colors.white} />
          </Pressable>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.imageWrap}>
        <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
        )}
        <Pressable
          onPress={onToggleWishlist}
          style={[styles.heartBtn, wishlisted && styles.heartBtnActive]}
          hitSlop={6}
        >
          <Heart
            size={16}
            color={wishlisted ? colors.white : colors.text}
            fill={wishlisted ? colors.rose : 'transparent'}
          />
        </Pressable>
      </View>

      <View style={styles.info}>
        {product.vendor ? (
          <Text style={styles.vendor} numberOfLines={1}>
            {product.vendor.name.toUpperCase()}
          </Text>
        ) : null}
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Stars rating={product.rating} reviewCount={product.reviewCount} />
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(product.discountPrice ?? product.sellingPrice)}</Text>
          {product.discountPrice ? (
            <Text style={styles.priceOld}>{formatPrice(product.sellingPrice)}</Text>
          ) : null}
        </View>
        <Pressable onPress={onAddToCart} style={styles.cartBtn}>
          <ShoppingCart size={14} color={colors.white} />
          <Text style={styles.cartBtnText}>Add</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

function Stars({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  return (
    <View style={styles.starsRow}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          size={11}
          color={i < Math.floor(rating) ? colors.text : colors.borderStrong}
          fill={i < Math.floor(rating) ? colors.text : 'transparent'}
        />
      ))}
      <Text style={styles.starCount}>({reviewCount})</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.85 },
  imageWrap: {
    aspectRatio: 1,
    backgroundColor: colors.surfaceMuted,
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  discountBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.roseDeep,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  discountText: { color: colors.white, fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  heartBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  heartBtnActive: { backgroundColor: colors.rose },
  info: { padding: spacing.md, gap: 6 },
  vendor: { ...typography.faint, color: colors.textFaint },
  name: { ...typography.bodyStrong, lineHeight: 18 },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  starCount: { ...typography.faint, marginLeft: 4 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  price: { ...typography.h4, fontSize: 15 },
  priceOld: {
    ...typography.small,
    color: colors.textFaint,
    textDecorationLine: 'line-through',
  },
  cartBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.text,
    borderRadius: radius.md,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cartBtnText: { color: colors.white, ...typography.smallStrong, fontSize: 13 },

  // List layout
  list: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    alignItems: 'center',
  },
  listImage: {
    width: 90,
    height: 90,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  listInfo: { flex: 1, gap: 4 },
  listActions: { gap: 8 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnDark: { backgroundColor: colors.text },
});
