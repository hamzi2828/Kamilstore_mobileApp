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
import { Eye, EyeOff, LogIn, Mail, Lock } from 'lucide-react-native';

import ScreenContainer from '@/components/ScreenContainer';
import PrimaryButton from '@/components/PrimaryButton';
import { useAuth } from '@/context/AuthContext';
import { colors, radius, spacing, typography } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed');
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
        <Text style={typography.h1}>Welcome back</Text>
        <Text style={[typography.body, { color: colors.textSubtle, marginTop: 4 }]}>
          Sign in to access your cart, wishlist, and orders.
        </Text>

        <View style={{ marginTop: spacing.xxl, gap: spacing.md }}>
          <Field
            icon={<Mail size={16} color={colors.textFaint} />}
            placeholder="Email"
            value={email}
            onChange={setEmail}
            keyboardType="email-address"
          />
          <Field
            icon={<Lock size={16} color={colors.textFaint} />}
            placeholder="Password"
            value={password}
            onChange={setPassword}
            secure={!show}
            trailing={
              <Pressable onPress={() => setShow((v) => !v)} hitSlop={8}>
                {show ? <EyeOff size={16} color={colors.textFaint} /> : <Eye size={16} color={colors.textFaint} />}
              </Pressable>
            }
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={{ marginTop: spacing.xl }}>
          <PrimaryButton
            label="Sign in"
            loading={submitting}
            icon={<LogIn size={16} color={colors.white} />}
            onPress={onSubmit}
          />
        </View>

        <View style={styles.footer}>
          <Text style={typography.small}>Don&apos;t have an account?</Text>
          <Pressable onPress={() => navigation.replace('Register')} hitSlop={6}>
            <Text style={[typography.smallStrong, { color: colors.primary }]}>Sign up</Text>
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
  trailing,
}: {
  icon?: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  secure?: boolean;
  keyboardType?: 'default' | 'email-address' | 'number-pad' | 'phone-pad';
  trailing?: React.ReactNode;
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
      {trailing}
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
  error: {
    ...typography.small,
    color: colors.danger,
    marginTop: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.xl,
  },
});
