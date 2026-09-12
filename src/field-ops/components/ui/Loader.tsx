import React from 'react';
import { StyleSheet, View, ViewStyle } from '@/field-ops/components/primitives';
import { colors } from '@/field-ops/theme/tokens';

const DEFAULT_SIZE = 48;

export interface LoaderProps {
  /** Size in pixels (default 48). */
  size?: number;
  /** Optional style for the container. */
  style?: ViewStyle;
  /** Optional: use a different color (default: theme primary blue). */
  color?: string;
}

/**
 * Generic app loader: rotating circle with theme primary (blue).
 * Use when an interaction is taking time (e.g. save, submit, refetch).
 */
export function Loader({ size = DEFAULT_SIZE, style, color = colors.primary }: LoaderProps) {
  const borderWidth = Math.max(2, Math.round(size / 16));
  const half = size / 2;

  // Web: the 1s linear rotation the mobile Animated.loop produced, as a CSS
  // keyframe (fo-spin, field-ops.css). It runs on the compositor, so it stays
  // perfectly smooth even while the main thread is busy loading data.
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

/**
 * Full-screen overlay with centered loader. Use for screen-level loading (e.g. initial fetch).
 */
export function LoaderOverlay({ visible, ...loaderProps }: LoaderProps & { visible?: boolean }) {
  if (!visible) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-only">
      <View style={styles.overlay}>
        <Loader size={48} {...loaderProps} />
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
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
