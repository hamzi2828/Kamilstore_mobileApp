import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { ChevronRight, Search, X, Grid3x3 } from 'lucide-react-native';

import ScreenContainer from '@/components/ScreenContainer';
import Loader from '@/components/Loader';
import EmptyState from '@/components/EmptyState';
import { categoriesApi } from '@/api/categories';
import { resolveImageUrl } from '@/api/client';
import { colors, radius, spacing, typography } from '@/theme';
import type { Category } from '@/types';
import type { RootStackParamList, TabParamList } from '@/navigation/types';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<RootStackParamList, 'Categories'>,
  BottomTabNavigationProp<TabParamList>
>;

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

function paletteFor(idx: number) {
  return CATEGORY_PALETTE[idx % CATEGORY_PALETTE.length];
}

export default function CategoriesScreen() {
  const navigation = useNavigation<Nav>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    categoriesApi
      .list()
      .then((res) => setCategories(res.data))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return categories;
    const q = query.trim().toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q),
    );
  }, [categories, query]);

  if (loading) return <Loader fullscreen label="Loading categories..." />;

  return (
    <ScreenContainer padding={false}>
      <FlatList
        data={filtered}
        keyExtractor={(c) => c._id}
        numColumns={2}
        columnWrapperStyle={{ gap: spacing.md, paddingHorizontal: spacing.lg }}
        contentContainerStyle={{ paddingBottom: spacing.xxxl, gap: spacing.md }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.titleIcon}>
                <Grid3x3 size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={typography.h2}>All Categories</Text>
                <Text style={[typography.small, { marginTop: 2 }]}>
                  {categories.length} {categories.length === 1 ? 'category' : 'categories'} available
                </Text>
              </View>
            </View>

            <View style={styles.search}>
              <Search size={18} color={colors.textFaint} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search categories..."
                placeholderTextColor={colors.textFaint}
                style={styles.searchInput}
                returnKeyType="search"
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery('')} hitSlop={10}>
                  <X size={16} color={colors.textFaint} />
                </Pressable>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={{ paddingHorizontal: spacing.lg }}>
            <EmptyState
              icon={<Grid3x3 size={28} color={colors.textFaint} />}
              title="No categories found"
              message={
                query
                  ? `Nothing matches "${query}". Try a different search.`
                  : 'No categories available yet.'
              }
              ctaLabel={query ? 'Clear search' : undefined}
              onCtaPress={() => setQuery('')}
            />
          </View>
        }
        renderItem={({ item, index }) => {
          const palette = paletteFor(index);
          const imgUrl = resolveImageUrl(item.image);
          return (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() =>
                navigation.navigate('Tabs', {
                  screen: 'Browse',
                  params: { category: item.slug },
                })
              }
            >
              <View style={[styles.iconWrap, { backgroundColor: palette.bg }]}>
                {imgUrl ? (
                  <Image source={{ uri: imgUrl }} style={styles.iconImage} />
                ) : (
                  <Text style={[styles.iconLetter, { color: palette.color }]}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
              {item.subCategories && item.subCategories.length > 0 ? (
                <Text style={styles.cardMeta}>
                  {item.subCategories.length} sub-{item.subCategories.length === 1 ? 'category' : 'categories'}
                </Text>
              ) : (
                <Text style={styles.cardMeta}>Tap to browse</Text>
              )}
              <View style={styles.cardArrow}>
                <ChevronRight size={14} color={palette.color} />
              </View>
            </Pressable>
          );
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  titleIcon: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, ...typography.body, paddingVertical: 0 },

  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    minHeight: 150,
  },
  cardPressed: { opacity: 0.85 },
  iconWrap: {
    width: 56, height: 56, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  iconImage: { width: 36, height: 36, borderRadius: 8 },
  iconLetter: { fontSize: 22, fontWeight: '800' },
  cardTitle: { ...typography.bodyStrong, fontSize: 14, color: colors.text },
  cardMeta: { ...typography.small, color: colors.textFaint, fontSize: 11 },
  cardArrow: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center', justifyContent: 'center',
  },
});
