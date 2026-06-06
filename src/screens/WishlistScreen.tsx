import React, { useEffect } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import ScreenContainer from '@/components/ScreenContainer';
import EmptyState from '@/components/EmptyState';
import Loader from '@/components/Loader';
import PrimaryButton from '@/components/PrimaryButton';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { colors, radius, spacing, typography } from '@/theme';
import { formatPrice } from '@/utils/format';
import { resolveImageUrl } from '@/api/client';
import type { RootStackParamList, TabParamList } from '@/navigation/types';

const PLACEHOLDER =
  'https://png.pngtree.com/png-vector/20241018/ourmid/pngtree-running-shoes-or-sneakers-on-a-transparent-background-png-image_14112954.png';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Wishlist'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function WishlistScreen() {
  const navigation = useNavigation<Nav>();
  const { isAuthenticated } = useAuth();
  const { items, isReady, remove, refresh } = useWishlist();
  const { add: addToCart } = useCart();

  useEffect(() => {
    if (isAuthenticated) refresh();
  }, [isAuthenticated, refresh]);

  if (!isReady) {
    return (
      <ScreenContainer padding={false}>
        <Loader fullscreen label="Loading..." />
      </ScreenContainer>
    );
  }

  if (items.length === 0) {
    return (
      <ScreenContainer>
        <EmptyState
          icon={<Heart size={32} color={colors.textFaint} />}
          title="Your wishlist is empty"
          message="Tap the heart on any product to save it."
          ctaLabel="Browse Products"
          onCtaPress={() => navigation.navigate('Browse', undefined)}
        />
      </ScreenContainer>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.bg }}>
        <View style={styles.headerRow}>
          <View>
            <Text style={typography.h2}>Wishlist</Text>
            <Text style={[typography.small, { marginTop: 2 }]}>
              {items.length} {items.length === 1 ? 'item' : 'items'} saved
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <FlatList
        data={items}
        keyExtractor={(i) => i.productId}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Pressable
              onPress={() => navigation.navigate('ProductDetail', { slug: item.slug })}
            >
              <Image
                source={{ uri: resolveImageUrl(item.image) || PLACEHOLDER }}
                style={styles.image}
                resizeMode="cover"
              />
            </Pressable>
            <View style={styles.body}>
              {item.vendor ? (
                <Text style={[typography.faint, { color: colors.textFaint }]} numberOfLines={1}>
                  {item.vendor.name.toUpperCase()}
                </Text>
              ) : null}
              <Pressable
                onPress={() => navigation.navigate('ProductDetail', { slug: item.slug })}
              >
                <Text style={typography.bodyStrong} numberOfLines={2}>
                  {item.name}
                </Text>
              </Pressable>
              <Text style={[typography.h4, { marginTop: 4 }]}>
                {formatPrice(item.unitPrice)}
              </Text>

              <View style={styles.actions}>
                <View style={{ flex: 1 }}>
                  <PrimaryButton
                    label="Add to Cart"
                    size="sm"
                    icon={<ShoppingCart size={14} color={colors.white} />}
                    disabled={!item.inStock}
                    onPress={() =>
                      addToCart({
                        productId: item.productId,
                        slug: item.slug,
                        name: item.name,
                        image: item.image,
                        sellingPrice: item.sellingPrice,
                        unitPrice: item.unitPrice,
                        stock: item.inStock ? 99 : 0,
                        vendor: item.vendor,
                      })
                    }
                  />
                </View>
                <Pressable onPress={() => remove(item.productId)} style={styles.removeBtn} hitSlop={6}>
                  <Trash2 size={18} color={colors.danger} />
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  image: {
    width: 110,
    height: 130,
    backgroundColor: colors.surfaceMuted,
  },
  body: { flex: 1, padding: spacing.md, gap: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
