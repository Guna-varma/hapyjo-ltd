/**
 * React Native style -> CSS conversion.
 *
 * These rules are what let the migrated screens keep their original style objects
 * and still lay out correctly in a browser, so they are worth pinning down.
 */
import { describe, it, expect } from 'vitest';
import { toCss, flattenStyle, StyleSheet } from '../style';

describe('flattenStyle', () => {
  it('merges arrays with later entries winning', () => {
    expect(flattenStyle([{ color: 'red' }, { color: 'blue' }])).toEqual({ color: 'blue' });
  });

  it('skips falsy entries, as RN allows conditional styles', () => {
    expect(flattenStyle([{ a: 1 }, false, null, undefined, { b: 2 }])).toEqual({ a: 1, b: 2 });
  });

  it('flattens nested arrays', () => {
    expect(flattenStyle([{ a: 1 }, [{ b: 2 }, [{ c: 3 }]]])).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('returns an empty object for no style', () => {
    expect(flattenStyle(undefined)).toEqual({});
    expect(flattenStyle(null)).toEqual({});
    expect(flattenStyle(false)).toEqual({});
  });
});

describe('toCss', () => {
  it('adds px to numeric lengths', () => {
    const css = toCss({ padding: 16, marginTop: 8, width: 100, borderRadius: 12 });
    expect(css.padding).toBe('16px');
    expect(css.marginTop).toBe('8px');
    expect(css.width).toBe('100px');
    expect(css.borderRadius).toBe('12px');
  });

  it('leaves genuinely unitless properties alone', () => {
    const css = toCss({ opacity: 0.5, zIndex: 10, fontWeight: 600, flexGrow: 1 });
    expect(css.opacity).toBe(0.5);
    expect(css.zIndex).toBe(10);
    expect(css.fontWeight).toBe(600);
    expect(css.flexGrow).toBe(1);
  });

  it('expands RN flex:n to CSS flex with min-size 0 so children can shrink', () => {
    const css = toCss({ flex: 1 });
    expect(css.flex).toBe('1 1 0%');
    expect(css.minHeight).toBe(0);
    expect(css.minWidth).toBe(0);
  });

  it('passes string lengths through untouched', () => {
    const css = toCss({ width: '100%', height: 'env(safe-area-inset-top, 0px)' });
    expect(css.width).toBe('100%');
    expect(css.height).toBe('env(safe-area-inset-top, 0px)');
  });

  it('collapses shadow* props into a single box-shadow with alpha applied', () => {
    const css = toCss({
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    });
    expect(css.boxShadow).toBe('0px 2px 4px rgba(0, 0, 0, 0.08)');
    // The RN-only props must not leak to the DOM.
    expect('shadowColor' in css).toBe(false);
    expect('shadowOffset' in css).toBe(false);
  });

  it('derives a box-shadow from Android elevation', () => {
    const css = toCss({ elevation: 4 });
    expect(typeof css.boxShadow).toBe('string');
    expect(css.boxShadow).toContain('rgba(0, 0, 0, 0.2)');
    expect('elevation' in css).toBe(false);
  });

  it('expands 3-digit hex shadow colours', () => {
    const css = toCss({ shadowColor: '#0f0', shadowOpacity: 0.5, shadowRadius: 2 });
    expect(css.boxShadow).toContain('rgba(0, 255, 0, 0.5)');
  });

  it('converts RN transform arrays into a CSS transform string', () => {
    const css = toCss({ transform: [{ translateX: 10 }, { scale: 0.97 }, { rotate: '45deg' }] });
    expect(css.transform).toBe('translateX(10px) scale(0.97) rotate(45deg)');
  });

  it('treats a numeric rotate as degrees', () => {
    expect(toCss({ transform: [{ rotate: 90 }] }).transform).toBe('rotate(90deg)');
  });

  it('drops RN-only props that have no CSS meaning', () => {
    const css = toCss({ includeFontPadding: false, textAlignVertical: 'center', resizeMode: 'cover' });
    expect('includeFontPadding' in css).toBe(false);
    expect('textAlignVertical' in css).toBe(false);
    expect('resizeMode' in css).toBe(false);
  });

  it('lets the caller style override the primitive base style', () => {
    const css = toCss({ flexDirection: 'row' }, { flexDirection: 'column', display: 'flex' });
    expect(css.flexDirection).toBe('row');
    expect(css.display).toBe('flex');
  });

  it('adds px to gap values', () => {
    const css = toCss({ gap: 12, rowGap: 4 });
    expect(css.gap).toBe('12px');
    expect(css.rowGap).toBe('4px');
  });

  it('ignores undefined values', () => {
    const css = toCss({ color: undefined, padding: 8 });
    expect('color' in css).toBe(false);
    expect(css.padding).toBe('8px');
  });
});

describe('StyleSheet', () => {
  it('create() returns the styles unchanged so toCss can read them', () => {
    const styles = StyleSheet.create({ card: { padding: 16 } });
    expect(styles.card).toEqual({ padding: 16 });
    expect(toCss(styles.card).padding).toBe('16px');
  });

  it('absoluteFillObject spreads into a full-bleed absolute box', () => {
    const css = toCss({ ...StyleSheet.absoluteFillObject });
    expect(css.position).toBe('absolute');
    expect(css.top).toBe('0px');
    expect(css.bottom).toBe('0px');
  });

  it('flatten() matches flattenStyle', () => {
    expect(StyleSheet.flatten([{ a: 1 }, { b: 2 }])).toEqual({ a: 1, b: 2 });
  });

  it('exposes a 1px hairline', () => {
    expect(StyleSheet.hairlineWidth).toBe(1);
  });
});

describe('React Native layout shorthands', () => {
  it('expands paddingHorizontal / paddingVertical to CSS longhands', () => {
    const css = toCss({ paddingHorizontal: 16, paddingVertical: 8 });
    expect(css.paddingLeft).toBe('16px');
    expect(css.paddingRight).toBe('16px');
    expect(css.paddingTop).toBe('8px');
    expect(css.paddingBottom).toBe('8px');
    expect('paddingHorizontal' in css).toBe(false);
    expect('paddingVertical' in css).toBe(false);
  });

  it('expands marginHorizontal / marginVertical, including "auto" centring', () => {
    const css = toCss({ marginHorizontal: 'auto', marginVertical: 4 });
    expect(css.marginLeft).toBe('auto');
    expect(css.marginRight).toBe('auto');
    expect(css.marginTop).toBe('4px');
    expect(css.marginBottom).toBe('4px');
  });

  it('lets a specific longhand override the shorthand regardless of key order', () => {
    const css = toCss({ paddingLeft: 4, paddingHorizontal: 16 });
    expect(css.paddingLeft).toBe('4px');
    expect(css.paddingRight).toBe('16px');
  });

  it('maps RN start/end props to CSS logical properties', () => {
    const css = toCss({ paddingStart: 12, marginEnd: 6, start: 0 });
    expect(css.paddingInlineStart).toBe('12px');
    expect(css.marginInlineEnd).toBe('6px');
    expect(css.insetInlineStart).toBe('0px');
  });
});

describe('lineHeight semantics', () => {
  it('treats a numeric lineHeight as pixels, as React Native does', () => {
    // A unitless CSS line-height of 20 would mean 20x the font size.
    expect(toCss({ lineHeight: 20 }).lineHeight).toBe('20px');
  });
});

describe('border semantics', () => {
  it('draws a border as soon as a width is given, as React Native does', () => {
    const css = toCss({ borderWidth: 1, borderColor: '#e2e8f0' });
    expect(css.borderWidth).toBe('1px');
    expect(css.borderStyle).toBe('solid');
  });

  it('applies to single-side widths too', () => {
    expect(toCss({ borderTopWidth: 1 }).borderStyle).toBe('solid');
  });

  it('does not force a style when the width is zero or a style is given', () => {
    expect(toCss({ borderWidth: 0 }).borderStyle).toBeUndefined();
    expect(toCss({ borderWidth: 1, borderStyle: 'dashed' }).borderStyle).toBe('dashed');
  });
});
