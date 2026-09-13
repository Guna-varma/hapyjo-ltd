import React from 'react';
import { StyleSheet, View, ViewStyle } from '@/field-ops/components/primitives';
import { colors } from '@/field-ops/theme/tokens';
import { TruckLoader } from '@/field-ops/components/ui/TruckLoader';

const DEFAULT_SIZE = 48;

export interface LoaderProps {
  /** Size in pixels (default 48). Used by the compact spinner variant. */
  size?: number;
  /** Optional style for the container. */
  style?: ViewStyle;
  /** Optional: use a different color (default: theme primary blue). */
  color?: string;
}

/**
 * Compact spinner for tight spaces (e.g. inside a button). Full-screen / global
 * busy states use TruckLoader via LoadingProvider instead.
 */
export function Loader({ size = DEFAULT_SIZE, style, color = colors.primary }: LoaderProps) {
  const borderWidth = Math.max(2, Math.round(size / 16));
  const half = size / 2;

  return (
    <View style={[styles.wrap, { width: size, height: size }, style]} accessibilityRole="progressbar">
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: half,
            borderWidth,
            borderTopColor: color,
            borderRightColor: 'transparent',
            borderBottomColor: 'transparent',
            borderLeftColor: 'transparent',
            animation: 'fo-spin 1s linear infinite',
            willChange: 'transform',
          },
        ]}
      />
    </View>
  );
}

/** Full-screen overlay with the global truck loader. */
export function LoaderOverlay({ visible }: { visible?: boolean }) {
  if (!visible) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-only">
      <View style={styles.overlay}>
        <TruckLoader />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    position: 'absolute',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248, 250, 252, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
});
