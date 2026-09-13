import React from 'react';
import { StyleSheet, Text, TouchableOpacity, TouchableOpacityProps, ViewStyle } from '@/field-ops/components/primitives';
import { colors, form, radius } from '@/field-ops/theme/tokens';
import { Loader } from '@/field-ops/components/ui/Loader';
import { useBusyLoading } from '@/field-ops/context/LoadingContext';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'muted' | 'warning';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  /** Stretch to fill a flex row / column. */
  fullWidth?: boolean;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

const VARIANT_BG: Record<ButtonVariant, string> = {
  primary: colors.primary,
  secondary: colors.gray600,
  outline: colors.surface,
  danger: colors.error,
  muted: colors.gray200,
  warning: '#d97706',
};

const VARIANT_TEXT: Record<ButtonVariant, string> = {
  primary: colors.surface,
  secondary: colors.surface,
  outline: colors.primary,
  danger: colors.surface,
  muted: colors.gray700,
  warning: colors.surface,
};

/**
 * Compact, professional action button used across the app.
 * Single-line labels (short copy), fixed height, centered text — no tall
 * chunky bars or wrapping primary CTAs on narrow phones.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  fullWidth,
  style,
  className: _className,
  ...props
}: ButtonProps) {
  useBusyLoading(!!loading);
  const isDisabled = disabled || loading;
  const isTextChild = typeof children === 'string' || typeof children === 'number';
  const height = size === 'sm' ? 40 : size === 'lg' ? 48 : form.buttonHeight;
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 15 : 14;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        {
          minHeight: height,
          height,
          backgroundColor: VARIANT_BG[variant],
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor: colors.primary,
          opacity: isDisabled ? 0.55 : 1,
          alignSelf: fullWidth ? 'stretch' : undefined,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
      disabled={isDisabled}
      accessibilityRole="button"
      {...props}
    >
      {loading ? (
        <Loader size={18} color={variant === 'outline' || variant === 'muted' ? colors.primary : colors.surface} />
      ) : isTextChild ? (
        <Text
          numberOfLines={1}
          style={[styles.label, { color: VARIANT_TEXT[variant], fontSize }]}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    flexShrink: 1,
  },
  label: {
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
});
