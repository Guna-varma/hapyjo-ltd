import { useMemo } from 'react';
import { ScaledSize, useWindowDimensions } from '@/field-ops/components/primitives';

/** Base width for scaling (typical phone). Smaller phones scale down, larger scale up slightly. */
const BASE_WIDTH = 375;
const MIN_SCALE = 0.85;
const MAX_SCALE = 1.15;

/**
 * Layout breakpoints for the web build.
 *
 * Below TABLET_MIN_WIDTH every derived value is exactly what the mobile app used,
 * so phone rendering is unchanged; the wider tiers add constraints rather than
 * altering the design.
 */
export const TABLET_MIN_WIDTH = 768;
export const DESKTOP_MIN_WIDTH = 1024;
/** Phones in landscape / very short windows need tighter vertical rhythm. */
export const SHORT_VIEWPORT_HEIGHT = 600;

/** Widest a list/dashboard column grows before it is centred. */
const SCREEN_MAX_WIDTH = 1120;
/** Widest a form column grows; long single-column forms get unreadable past this. */
const FORM_MAX_WIDTH = 640;
/** Widest a modal/sheet grows before it is centred. */
const MODAL_MAX_WIDTH = 560;

/**
 * Scale a number by screen width so UI stays proportional on all phone sizes.
 * Use for spacing, font sizes, icon sizes, and fixed dimensions.
 */
export function scaleByWidth(value: number, dimensions: { width: number }): number {
  const scale = Math.min(Math.max(dimensions.width / BASE_WIDTH, MIN_SCALE), MAX_SCALE);
  return Math.round(value * scale);
}

/**
 * Scale by the smaller dimension (useful for squares or when height matters).
 */
export function scaleByMinDimension(value: number, dimensions: ScaledSize): number {
  const min = Math.min(dimensions.width, dimensions.height);
  const scale = Math.min(Math.max(min / BASE_WIDTH, MIN_SCALE), MAX_SCALE);
  return Math.round(value * scale);
}

export interface ResponsiveTheme {
  /** Screen dimensions */
  width: number;
  height: number;
  /** Breakpoint flags (web layout tiers) */
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  /** True for short viewports (landscape phones, small windows) */
  isShort: boolean;
  /** Max width for list/dashboard content before it is centred */
  screenMaxWidth: number;
  /** Max width for form content before it is centred */
  formMaxWidth: number;
  /** Max width for modals and sheets before they are centred */
  modalMaxWidth: number;
  /** Column count for card/photo grids at this width */
  gridColumns: number;
  /** Scale a value by width (spacing, fonts, icons) */
  scale: (value: number) => number;
  /** Scale by smaller dimension (e.g. thumbnails) */
  scaleMin: (value: number) => number;
  /** Responsive horizontal padding for screen content (same on all screens) */
  screenPadding: number;
  /** Safe for small phones: use for modal max height as fraction of screen */
  modalMaxHeightRatio: number;
  /** Tab bar: icon size, label font size, padding */
  tabIconSize: number;
  tabLabelSize: number;
  tabPaddingH: number;
  tabPaddingV: number;
  tabItemMinWidth: number;
  /** Typography: base sizes that scale */
  fontSizeBase: number;
  fontSizeTitle: number;
  fontSizeCaption: number;
  /** Spacing */
  spacingXs: number;
  spacingSm: number;
  spacingMd: number;
  spacingLg: number;
  spacingXl: number;
}

export function useResponsiveTheme(): ResponsiveTheme {
  const dimensions = useWindowDimensions();
  return useMemo(() => {
    const scale = (v: number) => scaleByWidth(v, dimensions);
    const scaleMin = (v: number) => scaleByMinDimension(v, dimensions);
    const isNarrow = dimensions.width < 360;
    const isShort = dimensions.height < SHORT_VIEWPORT_HEIGHT;
    const isTablet =
      dimensions.width >= TABLET_MIN_WIDTH && dimensions.width < DESKTOP_MIN_WIDTH;
    const isDesktop = dimensions.width >= DESKTOP_MIN_WIDTH;
    const isPhone = dimensions.width < TABLET_MIN_WIDTH;
    // Grids widen with the viewport instead of staying at the phone's single column.
    const gridColumns = isDesktop ? 4 : isTablet ? 3 : dimensions.width >= 480 ? 2 : 1;
    return {
      width: dimensions.width,
      height: dimensions.height,
      isPhone,
      isTablet,
      isDesktop,
      isShort,
      screenMaxWidth: SCREEN_MAX_WIDTH,
      formMaxWidth: FORM_MAX_WIDTH,
      modalMaxWidth: MODAL_MAX_WIDTH,
      gridColumns,
      scale,
      scaleMin,
      screenPadding: isDesktop ? 24 : isTablet ? 20 : 16,
      modalMaxHeightRatio: dimensions.height < 600 ? 0.88 : 0.85,
      tabIconSize: scale(22),
      tabLabelSize: scale(11),
      tabPaddingH: scale(8),
      tabPaddingV: isShort ? scale(8) : scale(10),
      tabItemMinWidth: isNarrow ? 64 : 72,
      fontSizeBase: scale(16),
      fontSizeTitle: scale(22),
      fontSizeCaption: scale(12),
      spacingXs: scale(4),
      spacingSm: scale(8),
      spacingMd: scale(16),
      spacingLg: scale(24),
      spacingXl: scale(32),
    };
  }, [dimensions]);
}
