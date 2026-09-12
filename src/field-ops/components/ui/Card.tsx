import React from 'react';
import { StyleSheet, View, ViewProps } from '@/field-ops/components/primitives';
import { colors, layout, cardShadow } from '@/field-ops/theme/tokens';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ children, style, className = '', ...props }: CardProps) {
  return (
    <View
      style={[styles.card, style]}
      className={className}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: layout.cardRadius,
    padding: layout.cardPadding,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
});
