import React, { createContext, useCallback, useContext, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, useSafeAreaInsets, View } from '@/field-ops/components/primitives';
import { colors, radius, spacing, typography } from '@/field-ops/theme/tokens';

type ToastContextValue = {
  showToast: (message: string, options?: { duration?: number }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 2500;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [opacity] = useState(() => new Animated.Value(0));
  const insets = useSafeAreaInsets();

  const showToast = useCallback(
    (msg: string, options?: { duration?: number }) => {
      setMessage(msg);
      const duration = options?.duration ?? TOAST_DURATION_MS;
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(duration),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setMessage(null));
    },
    [opacity]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message != null && (
        <Animated.View
          pointerEvents="none"
          style={[styles.toast, { bottom: insets.bottom + 80 }, { opacity }]}
        >
          <Text style={styles.toastText} numberOfLines={2}>{message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const toastShadow = Platform.select({
  web: { boxShadow: '0 2px 4px rgba(0,0,0,0.25)' as const },
  default: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
});

const styles = StyleSheet.create({
  toast: {
    // Fixed to the viewport and above every modal (modals portal at z-index 1000,
    // alerts at 2000), so a "Saved" toast is never hidden behind the dialog that
    // triggered it or scrolled out of view.
    position: 'fixed',
    zIndex: 3000,
    left: spacing.md,
    right: spacing.md,
    // On wide viewports the toast stays a compact, centred pill instead of a
    // bar spanning the window. Narrower than the cap (phones) is unchanged.
    maxWidth: 480,
    marginHorizontal: 'auto',
    backgroundColor: colors.gray700,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...toastShadow,
  },
  toastText: {
    color: colors.surface,
    fontSize: typography.body.fontSize,
    fontWeight: '500',
    textAlign: 'center',
  },
});
