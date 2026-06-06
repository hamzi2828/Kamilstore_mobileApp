import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '@/theme';
import { formatPrice } from '@/utils/format';

interface Props {
  sellingPrice: number;
  discountPrice?: number;
  size?: 'md' | 'lg';
}

export default function PriceText({ sellingPrice, discountPrice, size = 'md' }: Props) {
  const hasDiscount = typeof discountPrice === 'number' && discountPrice < sellingPrice;
  const display = hasDiscount ? discountPrice! : sellingPrice;

  return (
    <View style={styles.row}>
      <Text style={[size === 'lg' ? styles.lg : styles.md, { color: colors.text }]}>
        {formatPrice(display)}
      </Text>
      {hasDiscount && (
        <Text style={styles.strike}>{formatPrice(sellingPrice)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' },
  md: { ...typography.h4, fontSize: 15 },
  lg: { ...typography.h2, fontSize: 22 },
  strike: {
    ...typography.small,
    color: colors.textFaint,
    textDecorationLine: 'line-through',
  },
});
