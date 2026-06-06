import React, { useEffect } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import ScreenContainer from '@/components/ScreenContainer';
import EmptyState from '@/components/EmptyState';
import Loader from '@/components/Loader';
import PrimaryButton from '@/components/PrimaryButton';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { colors, radius, spacing, typography } from '@/theme';
import { formatPrice } from '@/utils/format';
import { resolveImageUrl } from '@/api/client';
import type { RootStackParamList } from '@/navigation/types';

const PLACEHOLDER =
  'https://png.pngtree.com/png-vector/20241018/ourmid/pngtree-running-shoes-or-sneakers-on-a-transparent-background-png-image_14112954.png';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function CartScreen() {
  const navigation = useNavigation<Nav>();
  const { isAuthenticated } = useAuth();
  const {
    items,
    totalItems,
    subtotal,
    isReady,
    setQuantity,
    remove,
    clear,
    refresh,
  } = useCart();

  useEffect(() => {
    if (isAuthenticated) refresh();
  }, [isAuthenticated, refresh]);

  if (!isReady) {
    return (
      <ScreenContainer padding={false}>
        <Loader fullscreen label="Loading cart..." />
      </ScreenContainer>
    );
  }

  if (items.length === 0) {
    return (
      <ScreenContainer>
        <EmptyState
          icon={<ShoppingBag size={32} color={colors.textFaint} />}
          title="Your cart is empty"
          message="Find something you love and it'll show up here."
          ctaLabel="Start Shopping"
          onCtaPress={() => navigation.navigate('Tabs', { screen: 'Browse' })}
        />
      </ScreenContainer>
    );
  }

  const shipping = subtotal >= 50 || subtotal === 0 ? 0 : 9.99; // free over $50
  const total = subtotal + shipping;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.bg }}>
        <View style={styles.headerRow}>
          <View>
            <Text style={typography.h2}>Cart</Text>
            <Text style={[typography.small, { marginTop: 2 }]}>
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </Text>
          </View>
          <Pressable onPress={clear} hitSlop={8}>
            <Text style={styles.clearLink}>Clear</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <FlatList
        data={items}
        keyExtractor={(i) => i._id}
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: 220,
          gap: spacing.md,
        }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.line}>
            <Image
              source={{ uri: resolveImageUrl(item.image) || PLACEHOLDER }}
              style={styles.lineImage}
              resizeMode="cover"
            />
            <View style={styles.lineInfo}>
              {item.vendor ? (
                <Text style={[typography.faint, { color: colors.textFaint }]} numberOfLines={1}>
                  {item.vendor.name.toUpperCase()}
                </Text>
              ) : null}
              <Text style={typography.bodyStrong} numberOfLines={2}>
                {item.name}
              </Text>
              {item.variantLabel ? (
                <Text style={typography.small}>{item.variantLabel}</Text>
              ) : null}
              <Text style={[typography.h4, { marginTop: 4 }]}>
                {formatPrice(item.unitPrice * item.quantity)}
              </Text>

              <View style={styles.qtyRow}>
                <Pressable
                  style={styles.qtyBtn}
                  onPress={() => setQuantity(item._id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  <Minus size={14} color={colors.text} />
                </Pressable>
                <Text style={[typography.bodyStrong, { width: 36, textAlign: 'center' }]}>
                  {item.quantity}
                </Text>
                <Pressable
                  style={styles.qtyBtn}
                  onPress={() => setQuantity(item._id, item.quantity + 1)}
                >
                  <Plus size={14} color={colors.text} />
                </Pressable>
                <Pressable onPress={() => remove(item._id)} hitSlop={8} style={{ marginLeft: 'auto' }}>
                  <Trash2 size={18} color={colors.danger} />
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />

      {/* Sticky summary */}
      <SafeAreaView edges={['bottom']} style={styles.summary}>
        <View style={styles.summaryInner}>
          <View style={styles.summaryRow}>
            <Text style={typography.small}>Subtotal</Text>
            <Text style={typography.bodyStrong}>{formatPrice(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={typography.small}>Shipping</Text>
            <Text style={typography.bodyStrong}>
              {shipping === 0 ? 'FREE' : formatPrice(shipping)}
            </Text>
          </View>
          <View style={[styles.summaryRow, { marginTop: 4 }]}>
            <Text style={typography.h4}>Total</Text>
            <Text style={typography.h4}>{formatPrice(total)}</Text>
          </View>
          <View style={{ marginTop: spacing.md }}>
            <PrimaryButton
              label="Proceed to Checkout"
              onPress={() => navigation.navigate('Checkout')}
            />
          </View>
        </View>
      </SafeAreaView>
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
  clearLink: { ...typography.smallStrong, color: colors.danger },
  line: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  lineImage: {
    width: 90,
    height: 90,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  lineInfo: { flex: 1, gap: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 8 },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryInner: { padding: spacing.lg, gap: 6 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
