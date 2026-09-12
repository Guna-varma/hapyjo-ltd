/**
 * Converts React Native style objects into React CSS properties.
 *
 * Why this exists: the Field Operations app's ~19k lines of screens are written
 * against React Native's layout model and its design tokens (theme/tokens.ts).
 * Rewriting every style by hand would be a redesign — and the brief is parity.
 * So instead this layer reproduces RN's layout semantics in plain CSS, letting the
 * screen bodies keep their original styles and therefore their original look.
 *
 * No react-native / react-native-web runtime is involved: this is plain React + CSS.
 *
 * The differences from web CSS that matter, and are handled here:
 *   - RN defaults every View to `display:flex; flex-direction:column`
 *   - unitless numbers mean density-independent pixels
 *   - `shadow*` / `elevation` collapse into `box-shadow`
 *   - `flex: 1` means `flex: 1 1 0%` plus `min-height/min-width: 0`
 *   - style props may be arrays, nested arrays, or contain false/null
 */

import type { CSSProperties } from 'react';

/**
 * An RN-ish style value: object, array, or falsy (as RN allows).
 *
 * Deliberately not typed as CSSProperties: React Native style objects use
 * RN-only shapes (`transform: [{ rotate }]`, `shadowOffset`, Animated values)
 * that CSSProperties rejects, and toCss() is what converts them. Keeping this
 * permissive lets the migrated screens retain their original style objects
 * verbatim instead of being rewritten.
 */
export type RNStyleObject = Record<string, unknown>;
/**
 * `object` is included because the screens annotate their own style maps as
 * `Record<string, object>` (React Native's StyleProp is equally permissive), and
 * flattenStyle handles any object shape.
 */
export type RNStyle = RNStyleObject | object | null | undefined | false | RNStyle[];

/** Properties that are lengths in RN and need a `px` suffix when numeric. */
const UNITLESS_IN_CSS = new Set([
  'flex',
  'flexGrow',
  'flexShrink',
  'opacity',
  'zIndex',
  'fontWeight',
  // NOTE: lineHeight is deliberately NOT here. In React Native `lineHeight: 20`
  // means 20 device pixels; a unitless CSS line-height would mean 20x font-size.
  'order',
  'aspectRatio',
  'scale',
  'flexOrder',
]);

/** RN shadow/elevation props are consumed into box-shadow rather than passed through. */
const SHADOW_PROPS = new Set([
  'shadowColor',
  'shadowOffset',
  'shadowOpacity',
  'shadowRadius',
  'elevation',
]);

/**
 * React Native layout shorthands with no CSS equivalent. Each expands to the two
 * CSS longhands. In RN a more specific key (paddingLeft) beats the shorthand
 * (paddingHorizontal) regardless of declaration order, so shorthands are expanded
 * in a first pass and specific keys applied afterwards.
 */
const RN_SHORTHANDS: Record<string, string[]> = {
  paddingHorizontal: ['paddingLeft', 'paddingRight'],
  paddingVertical: ['paddingTop', 'paddingBottom'],
  marginHorizontal: ['marginLeft', 'marginRight'],
  marginVertical: ['marginTop', 'marginBottom'],
};

/** RN logical (start/end) props mapped to their CSS logical equivalents. */
const RN_LOGICAL: Record<string, string> = {
  paddingStart: 'paddingInlineStart',
  paddingEnd: 'paddingInlineEnd',
  marginStart: 'marginInlineStart',
  marginEnd: 'marginInlineEnd',
  start: 'insetInlineStart',
  end: 'insetInlineEnd',
  borderStartWidth: 'borderInlineStartWidth',
  borderEndWidth: 'borderInlineEndWidth',
  borderStartColor: 'borderInlineStartColor',
  borderEndColor: 'borderInlineEndColor',
  borderTopStartRadius: 'borderStartStartRadius',
  borderTopEndRadius: 'borderStartEndRadius',
  borderBottomStartRadius: 'borderEndStartRadius',
  borderBottomEndRadius: 'borderEndEndRadius',
};

/** RN-only props that have no CSS meaning and must not reach the DOM. */
const DROPPED_PROPS = new Set([
  'includeFontPadding',
  'textAlignVertical',
  'writingDirection',
  'overlayColor',
  'tintColor',
  'resizeMode',
]);

interface ShadowInput {
  shadowColor?: string;
  shadowOffset?: { width?: number; height?: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
}

/** Builds a single box-shadow from RN's shadow* / elevation props. */
function shadowToBoxShadow(s: ShadowInput): string | null {
  const hasShadow =
    s.shadowOpacity != null || s.shadowRadius != null || s.shadowOffset != null;
  const hasElevation = typeof s.elevation === 'number' && s.elevation > 0;
  if (!hasShadow && !hasElevation) return null;

  const offsetX = s.shadowOffset?.width ?? 0;
  const offsetY = s.shadowOffset?.height ?? (hasElevation ? Math.round((s.elevation ?? 0) / 2) : 0);
  const blur = s.shadowRadius ?? (hasElevation ? (s.elevation ?? 0) : 0);
  const opacity = s.shadowOpacity ?? (hasElevation ? 0.2 : 0);
  const base = s.shadowColor ?? '#000000';

  return `${offsetX}px ${offsetY}px ${blur}px ${withOpacity(base, opacity)}`;
}

/** Applies an alpha to a hex/rgb colour so shadowOpacity survives. */
function withOpacity(color: string, opacity: number): string {
  const a = Math.max(0, Math.min(1, opacity));
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  const rgb = /^rgba?\(([^)]+)\)$/i.exec(color);
  if (rgb) {
    const parts = rgb[1].split(',').map((p) => p.trim());
    const [r, g, b] = parts;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  return color;
}

/** Flattens nested/conditional style arrays into one object, last write winning. */
export function flattenStyle(style: RNStyle): Record<string, unknown> {
  if (!style) return {};
  if (Array.isArray(style)) {
    const out: Record<string, unknown> = {};
    for (const entry of style) Object.assign(out, flattenStyle(entry));
    return out;
  }
  return { ...(style as Record<string, unknown>) };
}

/**
 * Converts a (possibly nested) RN style into React CSS.
 * `base` lets a primitive supply RN's per-component defaults, which the caller's
 * own style can still override.
 */
export function toCss(style: RNStyle, base?: CSSProperties): CSSProperties {
  const flat = flattenStyle(style);
  const out: Record<string, unknown> = { ...(base ?? {}) };

  const shadow: ShadowInput = {};
  let transforms: string[] = [];

  // Pass 1: expand RN shorthands so specific longhands below can override them.
  for (const [key, rawValue] of Object.entries(flat)) {
    const longhands = RN_SHORTHANDS[key];
    if (!longhands || rawValue === undefined) continue;
    for (const longhand of longhands) {
      out[longhand] = typeof rawValue === 'number' ? `${rawValue}px` : rawValue;
    }
  }

  for (const [key, rawValue] of Object.entries(flat)) {
    if (rawValue === undefined) continue;
    if (RN_SHORTHANDS[key]) continue; // already expanded above

    const logical = RN_LOGICAL[key];
    if (logical) {
      out[logical] = typeof rawValue === 'number' ? `${rawValue}px` : rawValue;
      continue;
    }

    if (SHADOW_PROPS.has(key)) {
      (shadow as Record<string, unknown>)[key] = rawValue;
      continue;
    }
    if (DROPPED_PROPS.has(key)) continue;

    // RN's transform is an array of single-key objects.
    if (key === 'transform' && Array.isArray(rawValue)) {
      transforms = rawValue
        .flatMap((t) => Object.entries(t as Record<string, unknown>))
        .map(([fn, v]) => {
          if (fn === 'translateX' || fn === 'translateY') return `${fn}(${numToPx(v)})`;
          if (fn === 'rotate' || fn === 'rotateX' || fn === 'rotateY' || fn === 'rotateZ') {
            return `${fn}(${typeof v === 'number' ? `${v}deg` : String(v)})`;
          }
          return `${fn}(${String(v)})`;
        });
      continue;
    }

    if (key === 'flex' && typeof rawValue === 'number') {
      // RN `flex: n` == CSS `flex: n 1 0%`, and needs min-size 0 to actually shrink.
      out.flex = `${rawValue} 1 0%`;
      if (out.minHeight === undefined) out.minHeight = 0;
      if (out.minWidth === undefined) out.minWidth = 0;
      continue;
    }

    if (key === 'gap' || key === 'rowGap' || key === 'columnGap') {
      out[key] = numToPx(rawValue);
      continue;
    }

    if (typeof rawValue === 'number' && !UNITLESS_IN_CSS.has(key)) {
      out[key] = `${rawValue}px`;
      continue;
    }

    out[key] = rawValue;
  }

  const boxShadow = shadowToBoxShadow(shadow);
  if (boxShadow && out.boxShadow === undefined) out.boxShadow = boxShadow;
  if (transforms.length > 0) out.transform = transforms.join(' ');

  // React Native draws a border as soon as a width is given (style defaults to
  // solid); CSS draws nothing until border-style is set. Buttons and inputs also
  // reset `border: 0`, which clears the style, so set it explicitly here.
  if (out.borderStyle === undefined) {
    const hasBorderWidth = Object.keys(out).some(
      (k) => k.startsWith('border') && k.endsWith('Width') && out[k] !== 0 && out[k] !== '0px',
    );
    if (hasBorderWidth) out.borderStyle = 'solid';
  }

  return out as CSSProperties;
}

function numToPx(v: unknown): string {
  return typeof v === 'number' ? `${v}px` : String(v);
}

/**
 * Identity implementation of StyleSheet, matching the API the screens use.
 * RN returns opaque ids; returning the objects themselves is equivalent here
 * because toCss() accepts plain objects.
 */
export const StyleSheet = {
  create<T extends Record<string, RNStyle>>(styles: T): T {
    return styles;
  },
  flatten(style: RNStyle): Record<string, unknown> {
    return flattenStyle(style);
  },
  absoluteFillObject: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  absoluteFill: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  /** RN returns the thinnest line the display can draw; 1 CSS px on the web. */
  hairlineWidth: 1,
};
