import React from 'react';
import { ScrollView, ScrollViewProps, StyleProp, View, ViewStyle } from '@/field-ops/components/primitives';
import { layout, scrollConfig } from '@/field-ops/theme/tokens';
import { useResponsiveTheme } from '@/field-ops/theme/responsive';

interface ScreenContainerProps extends Omit<ScrollViewProps, 'contentContainerStyle'> {
  children: React.ReactNode;
  /** If true (default), content is in a ScrollView. If false, just a padded View. */
  scroll?: boolean;
  /** Extra class for the inner content container */
  contentClassName?: string;
  /** Optional extra content container styles (merged with default padding) */
  contentContainerStyle?: StyleProp<ViewStyle>;
}

const defaultContentStyle: ViewStyle = {
  paddingHorizontal: layout.screenPaddingHorz,
  paddingVertical: layout.cardSpacingVertical,
  flexGrow: 1,
};

/**
 * Wraps screen content with consistent padding (16px). Use for main screens and forms.
 */
export function ScreenContainer({
  children,
  scroll = true,
  contentClassName = '',
  contentContainerStyle,
  ...scrollProps
}: ScreenContainerProps) {
  const theme = useResponsiveTheme();

  /**
   * Content is capped and centred on wide viewports so rows and text do not
   * stretch across a large monitor. On a phone the viewport is narrower than the
   * cap, so this resolves to full width exactly as before.
   */
  const responsiveContentStyle: ViewStyle = {
    paddingHorizontal: theme.screenPadding,
    width: '100%',
    maxWidth: theme.screenMaxWidth,
    alignSelf: 'center',
  };

  const contentStyle = contentContainerStyle
    ? [defaultContentStyle, responsiveContentStyle, contentContainerStyle]
    : [defaultContentStyle, responsiveContentStyle];

  if (scroll) {
    return (
      <ScrollView
        className="flex-1"
        contentContainerStyle={contentStyle}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        {...scrollConfig}
        {...scrollProps}
      >
        <View className={contentClassName}>{children}</View>
      </ScrollView>
    );
  }

  return (
    <View
      className={`flex-1 ${contentClassName}`}
      style={[defaultContentStyle, responsiveContentStyle]}
    >
      {children}
    </View>
  );
}
