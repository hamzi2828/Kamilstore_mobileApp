import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CheckCircle2,
  CreditCard,
  Lock,
  MapPin,
  Truck,
  Wallet,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import PrimaryButton from '@/components/PrimaryButton';
import EmptyState from '@/components/EmptyState';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { ordersApi } from '@/api/orders';
import { resolveImageUrl } from '@/api/client';
import { colors, radius, spacing, typography } from '@/theme';
import { formatPrice } from '@/utils/format';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Checkout'>;

const PLACEHOLDER =
  'https://png.pngtree.com/png-vector/20241018/ourmid/pngtree-running-shoes-or-sneakers-on-a-transparent-background-png-image_14112954.png';

const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, AMEX', icon: CreditCard },
  { id: 'paypal', label: 'PayPal', desc: 'Pay with your PayPal account', icon: Wallet },
  { id: 'cod', label: 'Cash on Delivery', desc: 'Pay when your order arrives', icon: Wallet },
];

const SHIPPING_OPTIONS = [
  { id: 'standard', title: 'Free Standard Shipping', desc: '5-7 business days', price: 0 },
  { id: 'express', title: 'Express Shipping', desc: '2-3 business days', price: 14.99 },
];

export default function CheckoutScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { items, totalItems, subtotal, clear } = useCart();

  const [step, setStep] = useState(1);
  const [shippingMethodId, setShippingMethodId] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [shippingInfo, setShippingInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
  });

  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });

  // Pre-fill from auth user
  useEffect(() => {
    if (!user) return;
    setShippingInfo((p) => {
      const [first = '', ...rest] = (user.name || '').trim().split(' ');
      return {
        ...p,
        firstName: p.firstName || first,
        lastName: p.lastName || rest.join(' '),
        email: p.email || user.email || '',
        phone: p.phone || user.phone || '',
      };
    });
  }, [user]);

  const shippingMethod = SHIPPING_OPTIONS.find((s) => s.id === shippingMethodId)!;
  const shipping = shippingMethod.price;
  const tax = useMemo(() => +(subtotal * 0.08).toFixed(2), [subtotal]);
  const total = +(subtotal + shipping + tax).toFixed(2);

  const isShippingValid = useMemo(() => {
    const required: (keyof typeof shippingInfo)[] = [
      'firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode',
    ];
    return required.every((k) => shippingInfo[k].trim().length > 0);
  }, [shippingInfo]);

  const isPaymentValid = useMemo(() => {
    if (paymentMethod !== 'card') return true;
    return (
      card.number.replace(/\s/g, '').length >= 12 &&
      card.name.trim().length > 0 &&
      /^\d{2}\/\d{2}$/.test(card.expiry) &&
      /^\d{3,4}$/.test(card.cvv)
    );
  }, [paymentMethod, card]);

  const placeOrder = async () => {
    setPlacing(true);
    setError(null);
    try {
      // Group cart items by vendor — one sub-order per vendor
      const groups = new Map<string, { vendorId: string; vendorName: string; items: typeof items }>();
      for (const item of items) {
        const vendorId = item.vendor?._id || 'unknown';
        const vendorName = item.vendor?.name || 'Unknown Vendor';
        const existing = groups.get(vendorId);
        if (existing) existing.items.push(item);
        else groups.set(vendorId, { vendorId, vendorName, items: [item] });
      }

      const baseId = Date.now().toString(36).toUpperCase();
      const masterId = `KS-${baseId}`;

      const subOrders = Array.from(groups.values()).map((g, idx) => ({
        orderId: `${masterId}-V${idx + 1}`,
        vendor: { id: g.vendorId, name: g.vendorName },
        items: g.items.map((it) => ({
          productId: it.productId,
          name: it.name,
          slug: it.slug,
          image: it.image,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          variantSku: it.variantSku,
        })),
        amount: +g.items.reduce((s, it) => s + it.unitPrice * it.quantity, 0).toFixed(2),
      }));

      const payload = {
        masterOrderId: masterId,
        customer: {
          name: `${shippingInfo.firstName} ${shippingInfo.lastName}`.trim(),
          email: shippingInfo.email,
          phone: shippingInfo.phone,
          userId: user?._id,
        },
        shippingAddress: {
          line1: shippingInfo.address,
          city: shippingInfo.city,
          state: shippingInfo.state,
          zipCode: shippingInfo.zipCode,
          country: shippingInfo.country,
        },
        paymentMethod: paymentMethod as 'card' | 'paypal' | 'cod',
        shippingMethod: shippingMethodId,
        totals: { subtotal, shipping, tax, total },
        subOrders,
      };

      const json = await ordersApi.place(payload);
      if (!json.success) throw new Error(json.message || 'Failed to place order');

      clear();
      setOrderId(json.data?.masterOrderId || masterId);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (orderId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', padding: spacing.xl }}>
          <View style={styles.successIcon}>
            <CheckCircle2 size={56} color={colors.success} />
          </View>
          <Text style={[typography.h2, { marginTop: spacing.lg }]}>Order placed!</Text>
          <Text style={[typography.body, { color: colors.textSubtle, marginTop: 4, textAlign: 'center' }]}>
            Thanks for shopping with us.
          </Text>
          <Text style={[typography.body, { marginTop: spacing.md }]}>
            Order ID: <Text style={typography.bodyStrong}>{orderId}</Text>
          </Text>
          <Text style={[typography.body, { marginTop: 4 }]}>
            Total: <Text style={typography.bodyStrong}>{formatPrice(total)}</Text>
          </Text>

          <View style={{ width: '100%', marginTop: spacing.xl, gap: spacing.sm }}>
            <PrimaryButton
              label="Continue Shopping"
              onPress={() => navigation.navigate('Tabs', { screen: 'Browse' })}
            />
            <PrimaryButton
              variant="outline"
              label="Back to Home"
              onPress={() => navigation.navigate('Tabs', { screen: 'Home' })}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}>
        <EmptyState
          icon={<MapPin size={28} color={colors.textFaint} />}
          title="Your cart is empty"
          message="Add items to your cart before checking out."
          ctaLabel="Browse Products"
          onCtaPress={() => navigation.navigate('Tabs', { screen: 'Browse' })}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 220 }}>
        {/* Step indicator */}
        <View style={styles.stepperRow}>
          {[1, 2, 3].map((s, i) => (
            <React.Fragment key={s}>
              <View style={[styles.stepDot, step >= s && styles.stepDotActive]}>
                <Text style={[styles.stepDotText, step >= s && { color: colors.white }]}>{s}</Text>
              </View>
              {i < 2 ? (
                <View style={[styles.stepLine, step > s && styles.stepLineActive]} />
              ) : null}
            </React.Fragment>
          ))}
        </View>
        <View style={styles.stepLabelsRow}>
          <Text style={styles.stepLabel}>Shipping</Text>
          <Text style={styles.stepLabel}>Payment</Text>
          <Text style={styles.stepLabel}>Review</Text>
        </View>

        {step === 1 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MapPin size={18} color={colors.primary} />
              <Text style={typography.h3}>Shipping Information</Text>
            </View>

            <FormField label="First Name" value={shippingInfo.firstName} onChange={(v) => setShippingInfo({ ...shippingInfo, firstName: v })} />
            <FormField label="Last Name" value={shippingInfo.lastName} onChange={(v) => setShippingInfo({ ...shippingInfo, lastName: v })} />
            <FormField label="Email" value={shippingInfo.email} onChange={(v) => setShippingInfo({ ...shippingInfo, email: v })} keyboardType="email-address" />
            <FormField label="Phone" value={shippingInfo.phone} onChange={(v) => setShippingInfo({ ...shippingInfo, phone: v })} keyboardType="phone-pad" />
            <FormField label="Street Address" value={shippingInfo.address} onChange={(v) => setShippingInfo({ ...shippingInfo, address: v })} />
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <FormField label="City" value={shippingInfo.city} onChange={(v) => setShippingInfo({ ...shippingInfo, city: v })} />
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="State" value={shippingInfo.state} onChange={(v) => setShippingInfo({ ...shippingInfo, state: v })} />
              </View>
            </View>
            <FormField label="ZIP Code" value={shippingInfo.zipCode} onChange={(v) => setShippingInfo({ ...shippingInfo, zipCode: v })} />

            <View style={[styles.cardHeader, { marginTop: spacing.lg }]}>
              <Truck size={18} color={colors.primary} />
              <Text style={typography.h4}>Shipping Method</Text>
            </View>
            {SHIPPING_OPTIONS.map((opt) => (
              <Pressable
                key={opt.id}
                style={[styles.choice, shippingMethodId === opt.id && styles.choiceActive]}
                onPress={() => setShippingMethodId(opt.id)}
              >
                <View style={[styles.radio, shippingMethodId === opt.id && styles.radioOn]}>
                  {shippingMethodId === opt.id ? <View style={styles.radioDot} /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={typography.bodyStrong}>{opt.title}</Text>
                  <Text style={typography.small}>{opt.desc}</Text>
                </View>
                <Text style={[typography.bodyStrong, opt.price === 0 && { color: colors.success }]}>
                  {opt.price === 0 ? 'FREE' : formatPrice(opt.price)}
                </Text>
              </Pressable>
            ))}

            <View style={{ marginTop: spacing.lg }}>
              <PrimaryButton
                label="Continue to Payment"
                disabled={!isShippingValid}
                onPress={() => setStep(2)}
                icon={<ArrowRight size={16} color={colors.white} />}
              />
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <CreditCard size={18} color={colors.primary} />
              <Text style={typography.h3}>Payment Method</Text>
            </View>

            {PAYMENT_METHODS.map((m) => {
              const Icon = m.icon;
              return (
                <Pressable
                  key={m.id}
                  style={[styles.choice, paymentMethod === m.id && styles.choiceActive]}
                  onPress={() => setPaymentMethod(m.id)}
                >
                  <View style={[styles.radio, paymentMethod === m.id && styles.radioOn]}>
                    {paymentMethod === m.id ? <View style={styles.radioDot} /> : null}
                  </View>
                  <Icon size={18} color={colors.textSubtle} />
                  <View style={{ flex: 1 }}>
                    <Text style={typography.bodyStrong}>{m.label}</Text>
                    <Text style={typography.small}>{m.desc}</Text>
                  </View>
                </Pressable>
              );
            })}

            {paymentMethod === 'card' && (
              <View style={{ marginTop: spacing.md }}>
                <View style={styles.cardHeader}>
                  <Lock size={16} color={colors.success} />
                  <Text style={typography.h4}>Card Details</Text>
                </View>
                <FormField label="Card Number" value={card.number} onChange={(v) => setCard({ ...card, number: v })} placeholder="1234 5678 9012 3456" keyboardType="number-pad" />
                <FormField label="Cardholder Name" value={card.name} onChange={(v) => setCard({ ...card, name: v })} placeholder="John Doe" />
                <View style={styles.row2}>
                  <View style={{ flex: 1 }}>
                    <FormField label="Expiry" value={card.expiry} onChange={(v) => setCard({ ...card, expiry: v })} placeholder="MM/YY" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <FormField label="CVV" value={card.cvv} onChange={(v) => setCard({ ...card, cvv: v })} placeholder="123" keyboardType="number-pad" secure />
                  </View>
                </View>
              </View>
            )}

            <View style={styles.btnRow}>
              <View style={{ flex: 1 }}>
                <PrimaryButton variant="outline" label="Back" icon={<ArrowLeft size={16} color={colors.text} />} onPress={() => setStep(1)} />
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  label="Review"
                  icon={<ArrowRight size={16} color={colors.white} />}
                  disabled={!isPaymentValid}
                  onPress={() => setStep(3)}
                />
              </View>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <CheckCircle2 size={18} color={colors.primary} />
              <Text style={typography.h3}>Review Your Order</Text>
            </View>

            <ReviewBlock title="Ship To" onEdit={() => setStep(1)}>
              {shippingInfo.firstName} {shippingInfo.lastName}{'\n'}
              {shippingInfo.address}{'\n'}
              {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}{'\n'}
              {shippingInfo.country}{'\n'}
              {shippingInfo.phone}
            </ReviewBlock>

            <ReviewBlock title="Shipping Method" onEdit={() => setStep(1)}>
              {shippingMethod.title} · {shippingMethod.desc} —{' '}
              {shippingMethod.price === 0 ? 'FREE' : formatPrice(shippingMethod.price)}
            </ReviewBlock>

            <ReviewBlock title="Payment" onEdit={() => setStep(2)}>
              {paymentMethod === 'card'
                ? `Card ending in ${card.number.replace(/\s/g, '').slice(-4) || '****'}`
                : paymentMethod === 'paypal'
                ? 'PayPal'
                : 'Cash on Delivery'}
            </ReviewBlock>

            <Text style={[typography.h4, { marginTop: spacing.md }]}>Items</Text>
            <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
              {items.map((i) => (
                <View key={i._id} style={styles.itemRow}>
                  <Image source={{ uri: resolveImageUrl(i.image) || PLACEHOLDER }} style={styles.itemImg} />
                  <View style={{ flex: 1 }}>
                    <Text style={typography.bodyStrong} numberOfLines={2}>{i.name}</Text>
                    <Text style={typography.small}>
                      {i.variantLabel ? `${i.variantLabel} · ` : ''}Qty {i.quantity}
                    </Text>
                  </View>
                  <Text style={typography.bodyStrong}>{formatPrice(i.unitPrice * i.quantity)}</Text>
                </View>
              ))}
            </View>

            {error ? (
              <Text style={[typography.small, { color: colors.danger, marginTop: spacing.sm }]}>
                {error}
              </Text>
            ) : null}

            <View style={styles.btnRow}>
              <View style={{ flex: 1 }}>
                <PrimaryButton variant="outline" label="Back" icon={<ArrowLeft size={16} color={colors.text} />} onPress={() => setStep(2)} />
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  label={`Place Order ${formatPrice(total)}`}
                  loading={placing}
                  onPress={placeOrder}
                  icon={<Lock size={16} color={colors.white} />}
                />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.summary}>
        <View style={styles.summaryInner}>
          <View style={styles.summaryRow}>
            <Text style={typography.small}>Subtotal ({totalItems} items)</Text>
            <Text style={typography.bodyStrong}>{formatPrice(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={typography.small}>Shipping</Text>
            <Text style={typography.bodyStrong}>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={typography.small}>Tax (8%)</Text>
            <Text style={typography.bodyStrong}>{formatPrice(tax)}</Text>
          </View>
          <View style={[styles.summaryRow, { marginTop: 4 }]}>
            <Text style={typography.h4}>Total</Text>
            <Text style={typography.h4}>{formatPrice(total)}</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  keyboardType,
  secure,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'number-pad' | 'phone-pad';
  secure?: boolean;
}) {
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        keyboardType={keyboardType}
        secureTextEntry={secure}
        style={styles.input}
      />
    </View>
  );
}

function ReviewBlock({
  title,
  children,
  onEdit,
}: {
  title: string;
  children: React.ReactNode;
  onEdit?: () => void;
}) {
  return (
    <View style={styles.reviewBlock}>
      <View style={styles.reviewHeader}>
        <Text style={typography.smallStrong}>{title}</Text>
        {onEdit ? (
          <Pressable onPress={onEdit} hitSlop={6}>
            <Text style={[typography.smallStrong, { color: colors.primary }]}>Edit</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={[typography.body, { color: colors.textSubtle, lineHeight: 20 }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: 8,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepDotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepDotText: { ...typography.smallStrong, color: colors.textSubtle },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.border, marginHorizontal: 4 },
  stepLineActive: { backgroundColor: colors.primary },
  stepLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  stepLabel: { ...typography.faint, color: colors.text, flex: 1, textAlign: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  row2: { flexDirection: 'row', gap: spacing.sm },
  label: { ...typography.smallStrong, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    ...typography.body,
    backgroundColor: colors.surface,
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  choiceActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
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
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  btnRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  reviewBlock: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  itemImg: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#D1FAE5',
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
  summaryInner: { padding: spacing.lg, gap: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
