import React, { useState } from 'react';
import { Pressable, PressableProps, StyleSheet, ViewStyle } from '@/field-ops/components/primitives';

/**
 * Web port of the reanimated-based PressableScale: same 0.97 press scale and
 * spring-like feel, driven by a CSS transform/transition instead of
 * react-native-reanimated (which has no browser runtime).
 */

const ACTIVE_SCALE = 0.97;
/** Approximates withSpring({ damping: 15, stiffness: 400 }). */
const SPRING_TRANSITION = 'transform 140ms cubic-bezier(0.2, 0.8, 0.3, 1)';

interface PressableScaleProps extends PressableProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPressIn?: (e?: unknown) => void;
  onPressOut?: (e?: unknown) => void;
}

export function PressableScale({ children, style, onPressIn, onPressOut, ...props }: PressableScaleProps) {
  const [pressed, setPressed] = useState(false);

  const handlePressIn = (e?: unknown) => {
    setPressed(true);
    onPressIn?.(e);
  };

  const handlePressOut = (e?: unknown) => {
    setPressed(false);
    onPressOut?.(e);
  };

  return (
    <Pressable
      style={[
        StyleSheet.flatten(style),
        { transform: [{ scale: pressed ? ACTIVE_SCALE : 1 }], transition: SPRING_TRANSITION },
      ]}
      {...props}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {children}
    </Pressable>
  );
}
