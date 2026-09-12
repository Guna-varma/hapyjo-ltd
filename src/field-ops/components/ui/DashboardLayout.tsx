import React from 'react';
import { ScrollView, ScrollViewProps, StyleSheet, View } from '@/field-ops/components/primitives';
import { colors, layout, scrollConfig } from '@/field-ops/theme/tokens';
import { useResponsiveTheme } from '@/field-ops/theme/responsive';

interface DashboardLayoutProps extends Omit<ScrollViewProps, 'contentContainerStyle'> {
  children: React.ReactNode;
  scroll?: boolean;
}

/**
 * Shared layout wrapper for all dashboards and forms.
 * Responsive: horizontal padding, vertical spacing, extra bottom padding so content is not cut off on any device.
 */
export function DashboardLayout({ children, scroll = true, ...scrollProps }: DashboardLayoutProps) {
  const theme = useResponsiveTheme();

  const contentStyle = {
    // Padding widens with the viewport tier; 16px on phones, as before.
    paddingHorizontal: theme.screenPadding,
    paddingTop: layout.cardSpacingVertical,
    paddingBottom: layout.cardSpacingVertical * 2.5,
    flexGrow: 1,
    // Capped and centred on wide screens so dashboard cards do not stretch
    // across a monitor. A phone is narrower than the cap, so nothing changes.
    width: '100%',
    maxWidth: theme.screenMaxWidth,
    alignSelf: 'center' as const,
  };

  if (scroll) {
    return (
      <ScrollView
        style={styles.fill}
        contentContainerStyle={contentStyle}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={true}
        {...scrollConfig}
        {...scrollProps}
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[styles.fill, contentStyle]}>{children}</View>;
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
});
