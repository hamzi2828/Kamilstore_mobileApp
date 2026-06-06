import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UserPlus, Mail, Lock, User as UserIcon, Phone } from 'lucide-react-native';

import PrimaryButton from '@/components/PrimaryButton';
import { useAuth } from '@/context/AuthContext';
import { colors, radius, spacing, typography } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Register'>;

export default function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
      });
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.xxxl }}>
        <Text style={typography.h1}>Create account</Text>
        <Text style={[typography.body, { color: colors.textSubtle, marginTop: 4 }]}>
          Save your cart and wishlist across devices.
        </Text>

        <View style={{ marginTop: spacing.xxl, gap: spacing.md }}>
          <Field icon={<UserIcon size={16} color={colors.textFaint} />} placeholder="Full name" value={form.name} onChange={(v) => update('name', v)} />
          <Field icon={<Mail size={16} color={colors.textFaint} />} placeholder="Email" value={form.email} onChange={(v) => update('email', v)} keyboardType="email-address" />
          <Field icon={<Phone size={16} color={colors.textFaint} />} placeholder="Phone (optional)" value={form.phone} onChange={(v) => update('phone', v)} keyboardType="phone-pad" />
          <Field icon={<Lock size={16} color={colors.textFaint} />} placeholder="Password" value={form.password} onChange={(v) => update('password', v)} secure />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={{ marginTop: spacing.xl }}>
          <PrimaryButton
            label="Sign up"
            loading={submitting}
            icon={<UserPlus size={16} color={colors.white} />}
            onPress={onSubmit}
          />
        </View>

        <View style={styles.footer}>
          <Text style={typography.small}>Already have an account?</Text>
          <Pressable onPress={() => navigation.replace('Login')} hitSlop={6}>
            <Text style={[typography.smallStrong, { color: colors.primary }]}>Sign in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  icon,
  placeholder,
  value,
  onChange,
  secure,
  keyboardType,
}: {
  icon?: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  secure?: boolean;
  keyboardType?: 'default' | 'email-address' | 'number-pad' | 'phone-pad';
}) {
  return (
    <View style={styles.field}>
      {icon}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  input: { flex: 1, ...typography.body, paddingVertical: 0 },
  error: { ...typography.small, color: colors.danger, marginTop: spacing.md },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.xl },
});
