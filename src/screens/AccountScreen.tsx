import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  ChevronRight,
  ShoppingBag,
  Heart,
  Package,
  MapPin,
  CreditCard,
  HelpCircle,
  Settings,
  LogOut,
  LogIn,
  User as UserIcon,
} from 'lucide-react-native';

import ScreenContainer from '@/components/ScreenContainer';
import PrimaryButton from '@/components/PrimaryButton';
import EmptyState from '@/components/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { colors, radius, spacing, typography } from '@/theme';
import type { RootStackParamList, TabParamList } from '@/navigation/types';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Account'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function AccountScreen() {
  const navigation = useNavigation<Nav>();
  const { user, isAuthenticated, logout, loading } = useAuth();
  const { totalItems: cartCount } = useCart();
  const { totalItems: wishCount } = useWishlist();

  if (loading) {
    return <ScreenContainer><Text>Loading...</Text></ScreenContainer>;
  }

  if (!isAuthenticated) {
    return (
      <ScreenContainer scroll>
        <View style={styles.profileGuest}>
          <View style={styles.avatarBig}>
            <UserIcon size={32} color={colors.textFaint} />
          </View>
          <Text style={[typography.h2, { marginTop: spacing.md }]}>Welcome to Kamilstore</Text>
          <Text style={[typography.body, { color: colors.textSubtle, textAlign: 'center', marginTop: 4 }]}>
            Sign in to sync your cart, wishlist, and orders across devices.
          </Text>
          <View style={{ width: '100%', marginTop: spacing.xl, gap: spacing.sm }}>
            <PrimaryButton
              label="Sign in"
              icon={<LogIn size={16} color={colors.white} />}
              onPress={() => navigation.navigate('Login')}
            />
            <PrimaryButton
              variant="outline"
              label="Create account"
              onPress={() => navigation.navigate('Register')}
            />
          </View>
        </View>

        <View style={{ marginTop: spacing.xxl }}>
          <Text style={styles.sectionLabel}>Quick Links</Text>
          <MenuRow
            icon={<ShoppingBag size={18} color={colors.text} />}
            label="Cart"
            badge={cartCount}
            onPress={() => navigation.navigate('Tabs', { screen: 'Cart' })}
          />
          <MenuRow
            icon={<Heart size={18} color={colors.text} />}
            label="Wishlist"
            badge={wishCount}
            onPress={() => navigation.navigate('Tabs', { screen: 'Wishlist' })}
          />
          <MenuRow
            icon={<HelpCircle size={18} color={colors.text} />}
            label="Help & Support"
          />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll>
      {/* Profile card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.name || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={typography.h3}>{user?.name}</Text>
          <Text style={typography.small}>{user?.email}</Text>
          {user?.phone ? <Text style={typography.small}>{user.phone}</Text> : null}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <Stat label="Orders" value={0} />
        <View style={styles.statSep} />
        <Stat label="Cart" value={cartCount} />
        <View style={styles.statSep} />
        <Stat label="Wishlist" value={wishCount} />
      </View>

      <Text style={styles.sectionLabel}>Shopping</Text>
      <MenuRow
        icon={<Package size={18} color={colors.text} />}
        label="My Orders"
        onPress={() => {}}
      />
      <MenuRow
        icon={<ShoppingBag size={18} color={colors.text} />}
        label="Cart"
        badge={cartCount}
        onPress={() => navigation.navigate('Tabs', { screen: 'Cart' })}
      />
      <MenuRow
        icon={<Heart size={18} color={colors.text} />}
        label="Wishlist"
        badge={wishCount}
        onPress={() => navigation.navigate('Tabs', { screen: 'Wishlist' })}
      />

      <Text style={styles.sectionLabel}>Account</Text>
      <MenuRow icon={<MapPin size={18} color={colors.text} />} label="Addresses" />
      <MenuRow icon={<CreditCard size={18} color={colors.text} />} label="Payment Methods" />
      <MenuRow icon={<Settings size={18} color={colors.text} />} label="Settings" />
      <MenuRow icon={<HelpCircle size={18} color={colors.text} />} label="Help & Support" />

      <View style={{ marginTop: spacing.xl }}>
        <PrimaryButton
          variant="outline"
          label="Sign out"
          icon={<LogOut size={16} color={colors.text} />}
          onPress={logout}
        />
      </View>
    </ScreenContainer>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={typography.h3}>{value}</Text>
      <Text style={typography.small}>{label}</Text>
    </View>
  );
}

function MenuRow({
  icon,
  label,
  badge,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: number;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menuRow, pressed && { opacity: 0.85 }]}>
      <View style={styles.menuIconBox}>{icon}</View>
      <Text style={[typography.bodyStrong, { flex: 1 }]}>{label}</Text>
      {typeof badge === 'number' && badge > 0 ? (
        <View style={styles.menuBadge}>
          <Text style={styles.menuBadgeText}>{badge}</Text>
        </View>
      ) : null}
      <ChevronRight size={18} color={colors.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  profileGuest: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  avatarBig: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontSize: 22, fontWeight: '800' },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  statSep: { width: 1, height: 28, backgroundColor: colors.border },
  sectionLabel: {
    ...typography.faint,
    color: colors.textFaint,
    textTransform: 'uppercase',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginBottom: spacing.sm,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  menuBadgeText: { color: colors.white, fontSize: 11, fontWeight: '700' },
});
