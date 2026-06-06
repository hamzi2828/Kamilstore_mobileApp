import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography, radius } from '@/theme';
import PrimaryButton from './PrimaryButton';

interface Props {
  icon: React.ReactNode;
  title: string;
  message?: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
}

export default function EmptyState({ icon, title, message, ctaLabel, onCtaPress }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconBox}>{icon}</View>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {ctaLabel ? (
        <View style={{ width: 220, marginTop: spacing.lg }}>
          <PrimaryButton label={ctaLabel} onPress={onCtaPress} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: spacing.xl,
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...typography.h3, marginBottom: spacing.xs, textAlign: 'center' },
  message: { ...typography.body, color: colors.textSubtle, textAlign: 'center' },
});
