import React, { useRef } from 'react';
import { ActivityIndicator, Haptics, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableWithoutFeedback, useSafeAreaInsets, useWindowDimensions, View } from '@/field-ops/components/primitives';
import { FormScrollProvider, getKeyboardSafePaddingBottom } from '@/field-ops/context/FormScrollContext';
import { modalStyles } from '@/field-ops/components/ui/modalStyles';
import { colors, spacing, scrollConfig } from '@/field-ops/theme/tokens';
import { useModalLayout } from '@/field-ops/theme/modalLayout';

interface FormModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  /** Primary button (e.g. Save). onPrimary called when pressed. */
  primaryLabel: string;
  onPrimary: () => void | Promise<void>;
  /** Optional secondary (Cancel). If not provided, only primary is shown; close via overlay/back. */
  secondaryLabel?: string;
  /** When true, primary shows loading and is disabled. */
  submitting?: boolean;
  children: React.ReactNode;
}

/**
 * Modal with title, scrollable body, fixed footer (Cancel + Primary).
 * Single API for every create/edit flow. Uses modalStyles; Android-friendly keyboard behavior.
 */
export function FormModal({
  visible,
  onClose,
  title,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  submitting = false,
  children,
}: FormModalProps) {
  const scrollRef = useRef<ScrollView>(null);
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const modal = useModalLayout(0.85);
  const maxHeight = modal.height;
  const keyboardSafePaddingBottom = getKeyboardSafePaddingBottom(height);

  const handlePrimary = async () => {
    const result = onPrimary();
    if (result instanceof Promise) {
      await result;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[modalStyles.overlay, modal.overlayStyle]}>
          <Pressable
            style={[styles.sheet, { height: maxHeight, ...modal.cornerStyle }]}
            onPress={(e) => e.stopPropagation()}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'android' ? 'height' : 'padding'}
              style={styles.keyboardView}
            >
              <Text style={modalStyles.title}>{title}</Text>
              <FormScrollProvider scrollViewRef={scrollRef}>
                <ScrollView
                  ref={scrollRef}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={true}
                  {...scrollConfig}
                  contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: keyboardSafePaddingBottom + insets.bottom },
                  ]}
                  style={styles.scrollView}
                >
                  {children}
                </ScrollView>
              </FormScrollProvider>
              <View style={[styles.footerSticky, { paddingBottom: Math.max(spacing.md, insets.bottom) }]}>
                {secondaryLabel != null && (
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      onClose();
                    }}
                    style={[modalStyles.btn, modalStyles.btnSecondary]}
                  >
                    <Text style={modalStyles.btnTextSecondary}>{secondaryLabel}</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={handlePrimary}
                  disabled={submitting}
                  style={[modalStyles.btn, styles.primaryBtn]}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color={colors.surface} />
                  ) : (
                    <Text style={styles.primaryBtnText}>{primaryLabel}</Text>
                  )}
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </Pressable>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    ...modalStyles.sheet,
  },
  keyboardView: {
    flex: 1,
    minHeight: 0,
  },
  scrollView: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    paddingBottom: spacing.md,
  },
  footerSticky: {
    ...modalStyles.footer,
    backgroundColor: colors.surface,
    paddingTop: spacing.sm,
  },
  primaryBtn: {
    flex: 1,
    // Keeps the primary action tappable when the footer wraps on narrow phones.
    minWidth: 120,
    backgroundColor: colors.primary,
    minHeight: 48,
  },
  primaryBtnText: {
    color: colors.surface,
    fontWeight: '600',
    fontSize: 16,
  },
});
