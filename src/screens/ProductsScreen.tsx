import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { Filter, X, ChevronDown, Check } from 'lucide-react-native';

import ScreenContainer from '@/components/ScreenContainer';
import SearchBar from '@/components/SearchBar';
import ProductCard from '@/components/ProductCard';
import CategoryPill from '@/components/CategoryPill';
import EmptyState from '@/components/EmptyState';
import Loader from '@/components/Loader';
import PrimaryButton from '@/components/PrimaryButton';
import { categoriesApi } from '@/api/categories';
import { productsApi } from '@/api/products';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { colors, radius, spacing, typography } from '@/theme';
import type { Category, Product } from '@/types';
import type { RootStackParamList, TabParamList } from '@/navigation/types';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Browse'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type Route = RouteProp<TabParamList, 'Browse'>;

const SORT_OPTIONS = [
  { id: 'featured', label: 'Featured' },
  { id: 'newest', label: 'Newest' },
  { id: 'price-low', label: 'Price: Low to High' },
  { id: 'price-high', label: 'Price: High to Low' },
  { id: 'name-asc', label: 'Name: A-Z' },
];

const PRICE_RANGES = [
  { id: 'all', label: 'All Prices', min: undefined, max: undefined },
  { id: 'under50', label: 'Under $50', min: 0, max: 50 },
  { id: '50-100', label: '$50 - $100', min: 50, max: 100 },
  { id: '100-500', label: '$100 - $500', min: 100, max: 500 },
  { id: '500-1000', label: '$500 - $1000', min: 500, max: 1000 },
  { id: 'over1000', label: 'Over $1000', min: 1000, max: undefined },
];

const PAGE_LIMIT = 12;

export default function ProductsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const cart = useCart();
  const wishlist = useWishlist();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPrice, setSelectedPrice] = useState(PRICE_RANGES[0]);
  const [sortBy, setSortBy] = useState('featured');
  const [newArrivals, setNewArrivals] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const effectiveSort = newArrivals ? 'newest' : sortBy;

  // React to route params (Home screen pushes us with newArrivals or category)
  useFocusEffect(
    useCallback(() => {
      if (route.params?.newArrivals) setNewArrivals(true);
      if (route.params?.category) setSelectedCategory(route.params.category);
    }, [route.params?.newArrivals, route.params?.category]),
  );

  // Categories once
  useEffect(() => {
    categoriesApi.list().then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset page when other filters change
  useEffect(() => {
    setPage(1);
  }, [selectedCategory, selectedPrice, effectiveSort, searchTerm]);

  // Fetch
  useEffect(() => {
    let cancelled = false;
    if (page === 1) setLoading(true);
    else setLoadingMore(true);

    productsApi
      .list({
        search: searchTerm || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        minPrice: selectedPrice.min,
        maxPrice: selectedPrice.max,
        sort: effectiveSort,
        page,
        limit: PAGE_LIMIT,
      })
      .then((res) => {
        if (cancelled) return;
        if (page === 1) setProducts(res.data);
        else setProducts((prev) => [...prev, ...res.data]);
        setPages(res.pagination?.pages ?? 1);
        setTotal(res.pagination?.total ?? res.data.length);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [searchTerm, selectedCategory, selectedPrice, effectiveSort, page]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
  };

  const onEndReached = () => {
    if (loadingMore) return;
    if (page < pages) setPage((p) => p + 1);
  };

  const clearAll = () => {
    setSearchInput('');
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedPrice(PRICE_RANGES[0]);
    setSortBy('featured');
    setNewArrivals(false);
  };

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (selectedCategory !== 'all') n++;
    if (selectedPrice.id !== 'all') n++;
    if (newArrivals) n++;
    return n;
  }, [selectedCategory, selectedPrice, newArrivals]);

  const renderHeader = () => (
    <View style={{ paddingBottom: spacing.md }}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <Text style={typography.h2}>All Products</Text>
        <Text style={[typography.small, { marginTop: 4 }]}>
          {loading ? 'Loading...' : `${total} products`}
        </Text>
        <View style={{ marginTop: spacing.md }}>
          <SearchBar value={searchInput} onChangeText={setSearchInput} />
        </View>

        <View style={styles.toolbar}>
          <Pressable
            style={styles.toolbarBtn}
            onPress={() => setFiltersOpen(true)}
          >
            <Filter size={16} color={colors.text} />
            <Text style={typography.smallStrong}>Filters</Text>
            {activeFilterCount > 0 ? (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            ) : null}
          </Pressable>

          <Pressable style={styles.toolbarBtn} onPress={() => setFiltersOpen(true)}>
            <Text style={typography.smallStrong}>
              Sort: {SORT_OPTIONS.find((o) => o.id === effectiveSort)?.label || 'Featured'}
            </Text>
            <ChevronDown size={14} color={colors.text} />
          </Pressable>
        </View>
      </View>

      {/* Categories rail */}
      <FlatList
        data={[{ _id: 'all', name: 'All', slug: 'all' } as unknown as Category, ...categories]}
        keyExtractor={(c) => c._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm, paddingTop: spacing.md }}
        renderItem={({ item }) => (
          <CategoryPill
            label={item.name}
            active={selectedCategory === item.slug}
            onPress={() => setSelectedCategory(item.slug)}
          />
        )}
      />
    </View>
  );

  if (loading && products.length === 0) {
    return (
      <ScreenContainer padding={false}>
        {renderHeader()}
        <Loader label="Loading products..." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer padding={false}>
      <FlatList
        data={products}
        keyExtractor={(p) => p._id}
        ListHeaderComponent={renderHeader}
        numColumns={2}
        columnWrapperStyle={{ gap: spacing.md, paddingHorizontal: spacing.lg }}
        contentContainerStyle={{ paddingBottom: spacing.xxxl, gap: spacing.md }}
        showsVerticalScrollIndicator={false}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? <Loader /> : page >= pages && total > 0 ? (
            <Text style={styles.endText}>You&apos;ve reached the end</Text>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon={<Filter size={28} color={colors.textFaint} />}
            title="No products found"
            message="Try adjusting your search or filters."
            ctaLabel={activeFilterCount > 0 || searchTerm ? 'Clear filters' : undefined}
            onCtaPress={clearAll}
          />
        }
        renderItem={({ item }) => (
          <View style={{ flex: 1 }}>
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

      <FilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        sortBy={effectiveSort}
        onSortBy={(v) => {
          setSortBy(v);
          setNewArrivals(false);
        }}
        priceId={selectedPrice.id}
        onPrice={(id) => setSelectedPrice(PRICE_RANGES.find((r) => r.id === id) || PRICE_RANGES[0])}
        newArrivals={newArrivals}
        onNewArrivals={setNewArrivals}
        onClearAll={clearAll}
      />
    </ScreenContainer>
  );
}

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  sortBy: string;
  onSortBy: (v: string) => void;
  priceId: string;
  onPrice: (id: string) => void;
  newArrivals: boolean;
  onNewArrivals: (v: boolean) => void;
  onClearAll: () => void;
}

function FilterSheet({
  open,
  onClose,
  sortBy,
  onSortBy,
  priceId,
  onPrice,
  newArrivals,
  onNewArrivals,
  onClearAll,
}: FilterSheetProps) {
  return (
    <Modal animationType="slide" visible={open} transparent onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHeader}>
          <Text style={typography.h3}>Filters & Sort</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <X size={22} color={colors.text} />
          </Pressable>
        </View>

        <Text style={styles.sheetSection}>Quick Filters</Text>
        <Pressable
          style={styles.row}
          onPress={() => onNewArrivals(!newArrivals)}
        >
          <View style={[styles.checkbox, newArrivals && styles.checkboxOn]}>
            {newArrivals ? <Check size={14} color={colors.white} /> : null}
          </View>
          <Text style={typography.body}>New Arrivals (sort by newest)</Text>
        </Pressable>

        <Text style={styles.sheetSection}>Sort By</Text>
        {SORT_OPTIONS.map((o) => (
          <Pressable key={o.id} style={styles.row} onPress={() => onSortBy(o.id)}>
            <View style={[styles.radio, sortBy === o.id && styles.radioOn]}>
              {sortBy === o.id ? <View style={styles.radioDot} /> : null}
            </View>
            <Text style={typography.body}>{o.label}</Text>
          </Pressable>
        ))}

        <Text style={styles.sheetSection}>Price Range</Text>
        {PRICE_RANGES.map((r) => (
          <Pressable key={r.id} style={styles.row} onPress={() => onPrice(r.id)}>
            <View style={[styles.radio, priceId === r.id && styles.radioOn]}>
              {priceId === r.id ? <View style={styles.radioDot} /> : null}
            </View>
            <Text style={typography.body}>{r.label}</Text>
          </Pressable>
        ))}

        <View style={styles.sheetFooter}>
          <PrimaryButton variant="outline" label="Clear all" onPress={onClearAll} />
          <View style={{ height: spacing.sm }} />
          <PrimaryButton label="Show results" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginLeft: 2,
  },
  filterBadgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  endText: {
    ...typography.small,
    color: colors.textFaint,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },

  // Filter sheet
  modalBackdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sheetSection: {
    ...typography.smallStrong,
    color: colors.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.primary },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  sheetFooter: { marginTop: spacing.lg },
});
