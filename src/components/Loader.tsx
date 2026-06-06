import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';

interface Props {
  label?: string;
  fullscreen?: boolean;
}

export default function Loader({ label, fullscreen }: Props) {
  return (
    <View style={[styles.wrap, fullscreen && styles.fullscreen]}>
      <ActivityIndicator color={colors.primary} size="large" />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  fullscreen: { flex: 1 },
  label: { ...typography.small, color: colors.textSubtle },
});
