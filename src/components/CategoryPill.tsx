import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

interface Props {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export default function CategoryPill({ label, active, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        active ? styles.active : styles.inactive,
        pressed ? { opacity: 0.85 } : null,
      ]}
    >
      <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  active: { backgroundColor: colors.primary, borderColor: colors.primary },
  inactive: { backgroundColor: colors.surface, borderColor: colors.border },
  label: { ...typography.smallStrong },
  labelActive: { color: colors.white },
  labelInactive: { color: colors.text },
});
