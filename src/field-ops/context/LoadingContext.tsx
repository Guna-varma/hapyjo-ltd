import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from '@/field-ops/components/primitives';
import { Loader } from '@/field-ops/components/ui/Loader';
import { useLocale } from '@/field-ops/context/LocaleContext';
import { colors, radius } from '@/field-ops/theme/tokens';

type LoadingContextValue = {
  /** Show global centered loader. Call hideLoading when done. */
  showLoading: () => void;
  /** Hide global loader. */
  hideLoading: () => void;
  /** Run an async function with the global loader visible. Hides on finish or throw. */
  withLoading: <T>(fn: () => Promise<T>) => Promise<T>;
  loading: boolean;
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

/**
 * Keeps a single neat full-screen loader for every interaction. Nested
 * show/hide calls are ref-counted so overlapping work does not flicker off early.
 */
export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const depthRef = useRef(0);

  const showLoading = useCallback(() => {
    depthRef.current += 1;
    setLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    depthRef.current = Math.max(0, depthRef.current - 1);
    if (depthRef.current === 0) setLoading(false);
  }, []);

  const withLoading = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      showLoading();
      try {
        return await fn();
      } finally {
        hideLoading();
      }
    },
    [showLoading, hideLoading]
  );

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading, withLoading, loading }}>
      {children}
      {loading && (
        <View style={styles.root} pointerEvents="box-only" accessibilityRole="progressbar" accessibilityLabel={t('common_loading')}>
          <View style={styles.backdrop} />
          <View style={styles.card}>
            <Loader size={40} />
            <Text style={styles.label}>{t('common_loading')}</Text>
          </View>
        </View>
      )}
    </LoadingContext.Provider>
  );
}

export function useLoading(): LoadingContextValue {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error('useLoading must be used within LoadingProvider');
  return ctx;
}

/**
 * Mirror a local busy flag onto the global loader (forms, buttons, modals).
 * Cleanup always hides when the flag drops or the component unmounts mid-work.
 */
export function useBusyLoading(busy: boolean): void {
  const { showLoading, hideLoading } = useLoading();
  useEffect(() => {
    if (!busy) return;
    showLoading();
    return () => hideLoading();
  }, [busy, showLoading, hideLoading]);
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
  },
  card: {
    minWidth: 132,
    paddingVertical: 22,
    paddingHorizontal: 28,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
