import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from '@/field-ops/components/primitives';
import { useStoreLoading } from '@/field-ops/context/MockAppStoreContext';
import { useLocale } from '@/field-ops/context/LocaleContext';
import { Smile } from 'lucide-react';
import { useResponsiveTheme } from '@/field-ops/theme/responsive';
import { colors, spacing, typography } from '@/field-ops/theme/tokens';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
}

export function EmptyState({ icon, title, message }: EmptyStateProps) {
  const theme = useResponsiveTheme();
  const loading = useStoreLoading();
  const { t } = useLocale();
  const iconSize = theme.scaleMin(48);
  // While the first data load is in flight an empty message would be a lie
  // ("No trips assigned" flashing before the trips arrive); show progress instead.
  if (loading) {
    return (
      <View style={[styles.container, { padding: theme.spacingLg }]}>
        <View style={styles.inner}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.message}>{t('common_loading')}</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={[styles.container, { padding: theme.spacingLg }]}>
      <View style={styles.inner}>
        {icon ?? <Smile size={iconSize} color={colors.textMuted} />}
        <Text style={styles.title}>{title}</Text>
        {message != null && <Text style={styles.message}>{message}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    alignItems: 'center',
  },
  title: {
    fontSize: typography.body.fontSize + 2,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
