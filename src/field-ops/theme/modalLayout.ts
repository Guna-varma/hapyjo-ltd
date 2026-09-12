/**
 * Shared responsive geometry for every modal in the app.
 *
 * On a phone this resolves to exactly the mobile behaviour: a full-width sheet
 * anchored to the bottom, sized to a fraction of the viewport. From tablet width
 * up, the same sheet becomes a centred, capped dialog — the sheet look stretched
 * across a laptop is the one thing that does not survive the platform change.
 *
 * Every modal reads these values so they can never drift apart.
 */

import { useMemo } from 'react';
import { radius } from '@/field-ops/theme/tokens';
import { useResponsiveTheme } from '@/field-ops/theme/responsive';

/** No dialog should grow taller than this, however tall the monitor is. */
const MODAL_MAX_HEIGHT_PX = 760;

export interface ModalLayout {
  /** True once the sheet is presented as a centred dialog. */
  isCentered: boolean;
  /** Height for the sheet, capped in both ratio and absolute pixels. */
  height: number;
  /** Width cap; the sheet is full-bleed on a phone. */
  maxWidth: number;
  /** Style for the overlay: bottom-anchored on phones, centred above that. */
  overlayStyle: {
    flex: 1;
    backgroundColor: string;
    justifyContent: 'flex-end' | 'center';
    alignItems: 'stretch';
    paddingHorizontal: number;
    paddingVertical: number;
  };
  /**
   * Corner radii for the sheet. A bottom sheet rounds only its top corners; a
   * centred dialog rounds all four.
   */
  cornerStyle: {
    borderTopLeftRadius: number;
    borderTopRightRadius: number;
    borderBottomLeftRadius: number;
    borderBottomRightRadius: number;
  };
}

/**
 * @param maxHeightRatio fraction of viewport height the sheet may occupy
 *        (defaults to the app's usual 0.85).
 */
export function useModalLayout(maxHeightRatio = 0.85): ModalLayout {
  const theme = useResponsiveTheme();

  return useMemo(() => {
    const isCentered = !theme.isPhone;
    // Cap by ratio AND by absolute pixels so a tall window does not produce a
    // dialog that runs the full height of the screen.
    const height = Math.min(theme.height * maxHeightRatio, MODAL_MAX_HEIGHT_PX);

    return {
      isCentered,
      height,
      maxWidth: theme.modalMaxWidth,
      overlayStyle: {
        flex: 1 as const,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: (isCentered ? 'center' : 'flex-end') as 'flex-end' | 'center',
        alignItems: 'stretch' as const,
        // Breathing room around a centred dialog; a bottom sheet stays flush.
        paddingHorizontal: isCentered ? 24 : 0,
        paddingVertical: isCentered ? 24 : 0,
      },
      cornerStyle: {
        borderTopLeftRadius: radius.lg,
        borderTopRightRadius: radius.lg,
        borderBottomLeftRadius: isCentered ? radius.lg : 0,
        borderBottomRightRadius: isCentered ? radius.lg : 0,
      },
    };
  }, [theme.isPhone, theme.height, theme.modalMaxWidth, maxHeightRatio]);
}
