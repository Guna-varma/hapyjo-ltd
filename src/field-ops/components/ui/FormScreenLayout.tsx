import React, { useRef } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, useSafeAreaInsets, useWindowDimensions, View } from '@/field-ops/components/primitives';
import { FormScrollProvider, getKeyboardSafePaddingBottom } from '@/field-ops/context/FormScrollContext';
import { colors, spacing, scrollConfig } from '@/field-ops/theme/tokens';
import { useResponsiveTheme } from '@/field-ops/theme/responsive';

interface FormScreenLayoutProps {
  /** Fixed header (e.g. title + language switcher). */
  header: React.ReactNode;
  /** Form content – only this area scrolls. */
  children: React.ReactNode;
  /** Sticky footer (e.g. primary Save/Submit button). Pass null to omit the bar. */
  footer: React.ReactNode;
  /** Optional padding around scroll content. */
  contentPadding?: number;
}

/**
 * Full-height form layout: fixed header, scrollable form area, sticky footer.
 * Provides FormScrollContext so inputs can trigger scroll-into-view on focus.
 * Keyboard-safe bottom padding and KeyboardAvoidingView for mobile.
 */
export function FormScreenLayout({
  header,
  children,
  footer,
  contentPadding = spacing.md,
}: FormScreenLayoutProps) {
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const theme = useResponsiveTheme();
  const paddingBottom = getKeyboardSafePaddingBottom(height);

  /**
   * Forms are single-column, so they are capped and centred rather than stretched
   * across a wide window. Narrower than the cap (any phone) is unchanged.
   */
  const columnStyle = {
    width: '100%',
    maxWidth: theme.formMaxWidth,
    alignSelf: 'center' as const,
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={columnStyle}>{header}</View>
      </View>

      <FormScrollProvider scrollViewRef={scrollRef}>
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            columnStyle,
            {
              paddingHorizontal: contentPadding,
              paddingBottom: paddingBottom + insets.bottom,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          {...scrollConfig}
        >
          {children}
        </ScrollView>
      </FormScrollProvider>

      {footer != null ? (
        <View
          style={[
            styles.footer,
            {
              paddingBottom: Math.max(spacing.md, insets.bottom),
              paddingTop: spacing.sm,
            },
          ]}
        >
          <View style={columnStyle}>{footer}</View>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: spacing.md,
  },
  footer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
  },
});
