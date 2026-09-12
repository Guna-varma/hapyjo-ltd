/**
 * React Native primitives reimplemented as plain React DOM components.
 *
 * These reproduce the layout and interaction semantics the Field Operations
 * screens were written against, so the migrated screens keep their original
 * structure, styling and behaviour. No react-native / react-native-web runtime
 * is involved — every component below is a div/span/button/input.
 *
 * Responsiveness: because RN styles are mostly flex-based, the same styles adapt
 * to wide viewports once the app shell constrains width; screens additionally
 * read useWindowDimensions() exactly as before, which here reports the real
 * browser viewport.
 */

import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { StyleSheet, toCss, type RNStyle } from './style';

export { StyleSheet, toCss };
export type { RNStyle };

/* ------------------------------------------------------------------ *
 * Platform / Dimensions
 * ------------------------------------------------------------------ */

export const Platform = {
  /**
   * Always 'web' here, but typed as the full RN union so the screens' existing
   * `Platform.OS === 'android'` branches still compile (they are simply dead).
   */
  OS: 'web' as 'web' | 'ios' | 'android' | 'macos' | 'windows',
  /** Mirrors RN's Platform.select, always resolving the web (or default) branch. */
  select<T>(spec: { web?: T; default?: T; ios?: T; android?: T; native?: T }): T | undefined {
    if ('web' in spec) return spec.web;
    return spec.default;
  },
  Version: undefined as number | undefined,
};

function getWindowSize() {
  if (typeof window === 'undefined') return { width: 1024, height: 768, scale: 1, fontScale: 1 };
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    scale: window.devicePixelRatio || 1,
    fontScale: 1,
  };
}

/** RN's useWindowDimensions, backed by the real viewport. */
export function useWindowDimensions() {
  const [size, setSize] = useState(getWindowSize);
  useEffect(() => {
    const onResize = () => setSize(getWindowSize());
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);
  return size;
}

export const Dimensions = {
  get(_dim: 'window' | 'screen') {
    return getWindowSize();
  },
  addEventListener(_type: 'change', handler: (info: { window: ReturnType<typeof getWindowSize> }) => void) {
    const onResize = () => handler({ window: getWindowSize() });
    window.addEventListener('resize', onResize);
    return { remove: () => window.removeEventListener('resize', onResize) };
  },
};

/* ------------------------------------------------------------------ *
 * View
 * ------------------------------------------------------------------ */

/**
 * RN default box models live in field-ops.css (.fo-view etc.) rather than inline,
 * so NativeWind utility classes on the same element still win. `cx` merges the
 * primitive's base class with any className a screen passes.
 */
function cx(...parts: (string | undefined | false)[]): string {
  return parts.filter(Boolean).join(' ');
}

/**
 * The event handed to onPress handlers. Screens call e.stopPropagation() on it
 * (RN's synthetic event supports that), so the DOM event is passed straight through.
 */
export interface PressEvent {
  stopPropagation: () => void;
  preventDefault: () => void;
  nativeEvent?: unknown;
}

/**
 * Double-tap protection shared by every touchable. If an onPress handler returns
 * a promise (every async submit in the app does), further presses are ignored
 * until it settles. A React `disabled` flag set inside the handler only takes
 * effect after the next render, which is too late for the second tap of a
 * double-tap; this guard is synchronous, so a form can never be submitted twice.
 * Synchronous handlers are unaffected.
 */
function useAsyncPressGuard(onPress: ((event: PressEvent) => void) | undefined) {
  const busy = useRef(false);
  return useCallback(
    (e: PressEvent) => {
      if (!onPress || busy.current) return;
      const result = onPress(e) as unknown;
      if (result && typeof (result as Promise<unknown>).then === 'function') {
        busy.current = true;
        (result as Promise<unknown>).then(
          () => { busy.current = false; },
          () => { busy.current = false; },
        );
      }
    },
    [onPress],
  );
}

/**
 * Keyboard activation for div[role=button]: Enter and Space press it, as a real
 * <button> would. Space's default (page scroll) is suppressed.
 */
function activateOnKey(
  e: React.KeyboardEvent<HTMLDivElement>,
  disabled: boolean | undefined,
  onPress: ((event: PressEvent) => void) | undefined,
) {
  if (disabled || !onPress) return;
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    e.stopPropagation();
    onPress(e);
  }
}

export interface ViewProps {
  style?: RNStyle;
  children?: ReactNode;
  pointerEvents?: 'none' | 'auto' | 'box-none' | 'box-only';
  onLayout?: (event: { nativeEvent: { layout: { x: number; y: number; width: number; height: number } } }) => void;
  testID?: string;
  className?: string;
  id?: string;
  accessibilityLabel?: string;
  accessibilityRole?: string;
  accessibilityState?: { selected?: boolean; disabled?: boolean; checked?: boolean; expanded?: boolean };
  accessibilityHint?: string;
  collapsable?: boolean;
  removeClippedSubviews?: boolean;
  /** RN gesture-responder props: no-ops on the web, accepted so call sites compile. */
  onStartShouldSetResponder?: () => boolean;
  onMoveShouldSetResponder?: () => boolean;
  onResponderRelease?: () => void;
}

export const View = forwardRef<HTMLDivElement, ViewProps>(function View(
  {
    style,
    children,
    pointerEvents,
    onLayout,
    testID,
    className,
    id,
    accessibilityLabel,
    accessibilityRole,
    accessibilityState,
    accessibilityHint,
    ...rest
  },
  ref,
) {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      innerRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    },
    [ref],
  );

  // onLayout is used by screens to measure; report the element's box.
  useLayoutEffect(() => {
    if (!onLayout || !innerRef.current) return;
    const el = innerRef.current;
    const report = () => {
      const r = el.getBoundingClientRect();
      onLayout({ nativeEvent: { layout: { x: el.offsetLeft, y: el.offsetTop, width: r.width, height: r.height } } });
    };
    report();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(report);
    observer.observe(el);
    return () => observer.disconnect();
  }, [onLayout]);

  const css = toCss(style);
  if (pointerEvents === 'none') css.pointerEvents = 'none';
  else if (pointerEvents === 'box-only' || pointerEvents === 'auto') css.pointerEvents = 'auto';

  void rest;
  return (
    <div
      ref={setRef}
      id={id}
      className={cx('fo-view', className)}
      style={css}
      data-testid={testID}
      aria-label={accessibilityLabel}
      aria-description={accessibilityHint}
      aria-selected={accessibilityState?.selected}
      aria-checked={accessibilityState?.checked}
      aria-expanded={accessibilityState?.expanded}
      role={accessibilityRole}
    >
      {children}
    </div>
  );
});

/** SafeAreaView: on the web, env(safe-area-inset-*) covers notched devices. */
export const SafeAreaView = forwardRef<HTMLDivElement, ViewProps & { edges?: string[] }>(
  function SafeAreaView({ style, children, edges, ...rest }, ref) {
    void edges;
    return (
      <View
        ref={ref}
        style={[
          {
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          } as RNStyle,
          style,
        ]}
        {...rest}
      >
        {children}
      </View>
    );
  },
);

/* ------------------------------------------------------------------ *
 * Text
 * ------------------------------------------------------------------ */

export interface TextProps {
  style?: RNStyle;
  children?: ReactNode;
  numberOfLines?: number;
  onPress?: (event: PressEvent) => void;
  selectable?: boolean;
  testID?: string;
  ellipsizeMode?: string;
  accessibilityRole?: string;
  allowFontScaling?: boolean;
  adjustsFontSizeToFit?: boolean;
  minimumFontScale?: number;
  maxFontSizeMultiplier?: number;
  className?: string;
}

export const Text = forwardRef<HTMLSpanElement, TextProps>(function Text(
  { style, children, numberOfLines, onPress, selectable, testID, className, ...rest },
  ref,
) {
  const css = toCss(style);
  if (numberOfLines === 1) {
    // Single-line truncation: ellipsis needs no line clamping.
    css.whiteSpace = 'nowrap';
    css.overflow = 'hidden';
    css.textOverflow = 'ellipsis';
    css.display = 'block';
  } else if (numberOfLines && numberOfLines > 1) {
    css.display = '-webkit-box';
    (css as Record<string, unknown>).WebkitLineClamp = numberOfLines;
    (css as Record<string, unknown>).WebkitBoxOrient = 'vertical';
    css.overflow = 'hidden';
  }
  if (selectable === false) css.userSelect = 'none';
  if (onPress) css.cursor = 'pointer';
  void rest;
  return (
    <span
      ref={ref}
      className={cx('fo-text', className)}
      style={css}
      data-testid={testID}
      onClick={onPress ? (e) => { e.stopPropagation(); onPress(e); } : undefined}
    >
      {children}
    </span>
  );
});

/* ------------------------------------------------------------------ *
 * Touchables / Pressable
 * ------------------------------------------------------------------ */

export interface TouchableProps {
  style?: RNStyle;
  children?: ReactNode;
  onPress?: (event: PressEvent) => void;
  onLongPress?: () => void;
  disabled?: boolean;
  activeOpacity?: number;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityRole?: string;
  hitSlop?: unknown;
  delayLongPress?: number;
  underlayColor?: string;
  className?: string;
  accessibilityState?: { selected?: boolean; disabled?: boolean; checked?: boolean; expanded?: boolean };
  accessibilityHint?: string;
  onPressIn?: (event: PressEvent) => void;
  onPressOut?: (event: PressEvent) => void;
  /** RN gesture-responder props: no-ops on the web, accepted so call sites compile. */
  onStartShouldSetResponder?: () => boolean;
}

/** TouchableOpacity: dims on press, same as RN's default activeOpacity behaviour. */
export const TouchableOpacity = forwardRef<HTMLDivElement, TouchableProps>(
  function TouchableOpacity(
    {
      style,
      children,
      onPress,
      onLongPress,
      disabled,
      activeOpacity = 0.2,
      testID,
      accessibilityLabel,
      delayLongPress = 500,
      className,
      accessibilityState,
      onPressIn,
      onPressOut,
    },
    ref,
  ) {
    const [pressed, setPressed] = useState(false);
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const longPressFired = useRef(false);
    const guardedPress = useAsyncPressGuard(onPress);

    const clearTimer = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    };
    useEffect(() => clearTimer, []);

    const css = toCss(style);
    if (pressed && !disabled) css.opacity = activeOpacity;

    return (
      <div
        ref={ref}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        className={cx('fo-touchable', className)}
        style={css}
        data-testid={testID}
        aria-label={accessibilityLabel}
        aria-pressed={accessibilityState?.selected}
        onKeyDown={(e) => activateOnKey(e, disabled, guardedPress)}
        onPointerDown={(e) => {
          setPressed(true);
          onPressIn?.(e);
          longPressFired.current = false;
          if (onLongPress) {
            longPressTimer.current = setTimeout(() => {
              longPressFired.current = true;
              onLongPress();
            }, delayLongPress);
          }
        }}
        onPointerUp={(e) => { setPressed(false); onPressOut?.(e); clearTimer(); }}
        onPointerLeave={(e) => { setPressed(false); onPressOut?.(e); clearTimer(); }}
        onPointerCancel={(e) => { setPressed(false); onPressOut?.(e); clearTimer(); }}
        onClick={(e) => {
          e.stopPropagation();
          // Suppress the click that follows a long press, as RN does.
          if (longPressFired.current) { longPressFired.current = false; return; }
          if (!disabled) guardedPress(e);
        }}
      >
        {children}
      </div>
    );
  },
);

/** TouchableHighlight / TouchableWithoutFeedback share TouchableOpacity's shape. */
export const TouchableHighlight = TouchableOpacity;

export function TouchableWithoutFeedback({
  children,
  onPress,
  disabled,
}: {
  children?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: RNStyle;
}) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={1} style={{ flexDirection: 'column' }}>
      {children}
    </TouchableOpacity>
  );
}

export interface PressableProps extends Omit<TouchableProps, 'style' | 'children'> {
  style?: RNStyle | ((state: { pressed: boolean }) => RNStyle);
  children?: ReactNode | ((state: { pressed: boolean }) => ReactNode);
}

/** Pressable, including RN's function-style `style` and `children` forms. */
export function Pressable({ style, children, onPress, onLongPress, disabled, testID, accessibilityLabel, className, accessibilityState, onPressIn, onPressOut }: PressableProps) {
  const [pressed, setPressed] = useState(false);
  const guardedPress = useAsyncPressGuard(onPress);
  const resolvedStyle = typeof style === 'function' ? style({ pressed }) : style;
  const css = toCss(resolvedStyle);
  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      className={cx('fo-touchable', className)}
      style={css}
      data-testid={testID}
      aria-label={accessibilityLabel}
      aria-pressed={accessibilityState?.selected}
      onKeyDown={(e) => activateOnKey(e, disabled, guardedPress)}
      onPointerDown={(e) => { setPressed(true); onPressIn?.(e); }}
      onPointerUp={(e) => { setPressed(false); onPressOut?.(e); }}
      onPointerLeave={(e) => { setPressed(false); onPressOut?.(e); }}
      onContextMenu={onLongPress ? (e) => { e.preventDefault(); onLongPress(); } : undefined}
      onClick={(e) => { e.stopPropagation(); if (!disabled) guardedPress(e); }}
    >
      {typeof children === 'function' ? children({ pressed }) : children}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * ScrollView / FlatList
 * ------------------------------------------------------------------ */

export interface ScrollViewProps {
  style?: RNStyle;
  contentContainerStyle?: RNStyle;
  children?: ReactNode;
  horizontal?: boolean;
  showsVerticalScrollIndicator?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  keyboardShouldPersistTaps?: string;
  refreshControl?: ReactNode;
  onScroll?: (e: { nativeEvent: { contentOffset: { x: number; y: number } } }) => void;
  scrollEventThrottle?: number;
  testID?: string;
  nestedScrollEnabled?: boolean;
  bounces?: boolean;
  decelerationRate?: string | number;
  overScrollMode?: string;
  directionalLockEnabled?: boolean;
  scrollEnabled?: boolean;
  keyboardDismissMode?: string;
  className?: string;
  onScrollBeginDrag?: () => void;
  onScrollEndDrag?: () => void;
  onMomentumScrollEnd?: () => void;
  contentInsetAdjustmentBehavior?: string;
  automaticallyAdjustKeyboardInsets?: boolean;
  pagingEnabled?: boolean;
  onContentSizeChange?: (w: number, h: number) => void;
}

export interface ScrollViewHandle {
  scrollTo: (opts: { x?: number; y?: number; animated?: boolean }) => void;
  scrollToEnd: (opts?: { animated?: boolean }) => void;
}

export const ScrollView = forwardRef<ScrollViewHandle, ScrollViewProps>(function ScrollView(
  {
    style,
    contentContainerStyle,
    children,
    horizontal,
    showsVerticalScrollIndicator,
    showsHorizontalScrollIndicator,
    refreshControl,
    onScroll,
    testID,
    scrollEnabled = true,
    className,
    onScrollBeginDrag,
  },
  ref,
) {
  const elRef = useRef<HTMLDivElement | null>(null);

  React.useImperativeHandle(ref, () => ({
    scrollTo: ({ x, y, animated = true }) => {
      elRef.current?.scrollTo({
        left: x ?? elRef.current.scrollLeft,
        top: y ?? elRef.current.scrollTop,
        behavior: animated ? 'smooth' : 'auto',
      });
    },
    scrollToEnd: ({ animated = true } = {}) => {
      const el = elRef.current;
      if (!el) return;
      el.scrollTo({
        left: horizontal ? el.scrollWidth : 0,
        top: horizontal ? 0 : el.scrollHeight,
        behavior: animated ? 'smooth' : 'auto',
      });
    },
  }));

  const outer = toCss(style, {
    overflowX: horizontal ? 'auto' : 'hidden',
    overflowY: horizontal ? 'hidden' : 'auto',
    ...(scrollEnabled === false ? { overflow: 'hidden' } : {}),
  } as CSSProperties);

  const inner = toCss(contentContainerStyle);

  const hideScrollbar =
    (horizontal && showsHorizontalScrollIndicator === false) ||
    (!horizontal && showsVerticalScrollIndicator === false);


  return (
    <div
      ref={elRef}
      style={outer}
      data-testid={testID}
      className={cx('fo-scroll', className, hideScrollbar && 'fo-hide-scrollbar')}
      onPointerDown={onScrollBeginDrag}
      onWheel={onScrollBeginDrag}
      onTouchStart={onScrollBeginDrag}
      onScroll={
        onScroll
          ? (e) =>
              onScroll({
                nativeEvent: {
                  contentOffset: {
                    x: (e.target as HTMLDivElement).scrollLeft,
                    y: (e.target as HTMLDivElement).scrollTop,
                  },
                },
              })
          : undefined
      }
    >
      {refreshControl}
      <div
        className={cx('fo-scroll-content', horizontal && 'fo-scroll-content-horizontal')}
        style={inner}
      >
        {children}
      </div>
    </div>
  );
});

export interface FlatListProps<T> {
  data: readonly T[] | null | undefined;
  renderItem: (info: { item: T; index: number }) => ReactNode;
  keyExtractor?: (item: T, index: number) => string;
  ListEmptyComponent?: ReactNode | (() => ReactNode);
  ListHeaderComponent?: ReactNode | (() => ReactNode);
  ListFooterComponent?: ReactNode | (() => ReactNode);
  ItemSeparatorComponent?: React.ComponentType<unknown> | null;
  style?: RNStyle;
  contentContainerStyle?: RNStyle;
  columnWrapperStyle?: RNStyle;
  className?: string;
  numColumns?: number;
  horizontal?: boolean;
  showsVerticalScrollIndicator?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  refreshControl?: ReactNode;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  scrollEnabled?: boolean;
  testID?: string;
  extraData?: unknown;
  initialNumToRender?: number;
  removeClippedSubviews?: boolean;
  keyboardShouldPersistTaps?: string;
  nestedScrollEnabled?: boolean;
}

function renderSlot(slot: ReactNode | (() => ReactNode)): ReactNode {
  return typeof slot === 'function' ? (slot as () => ReactNode)() : slot;
}

/**
 * FlatList rendered eagerly. The app's lists are page-sized (sites, vehicles,
 * trips for one user), so virtualisation is not needed and eager rendering keeps
 * in-page search (Ctrl+F) and printing working in a browser.
 */
export function FlatList<T>({
  data,
  renderItem,
  keyExtractor,
  ListEmptyComponent,
  ListHeaderComponent,
  ListFooterComponent,
  ItemSeparatorComponent,
  style,
  contentContainerStyle,
  columnWrapperStyle,
  numColumns,
  horizontal,
  showsVerticalScrollIndicator,
  showsHorizontalScrollIndicator,
  refreshControl,
  onEndReached,
  scrollEnabled,
  testID,
}: FlatListProps<T>) {
  const items = data ?? [];
  const Separator = ItemSeparatorComponent;

  const rows: ReactNode[] = [];
  if (numColumns && numColumns > 1) {
    for (let i = 0; i < items.length; i += numColumns) {
      const chunk = items.slice(i, i + numColumns);
      rows.push(
        <View
          key={`row-${i}`}
          style={[{ flexDirection: 'row' } as RNStyle, columnWrapperStyle]}
        >
          {chunk.map((item, j) => (
            <React.Fragment key={keyExtractor ? keyExtractor(item, i + j) : String(i + j)}>
              {renderItem({ item, index: i + j })}
            </React.Fragment>
          ))}
        </View>,
      );
    }
  } else {
    items.forEach((item, index) => {
      rows.push(
        <React.Fragment key={keyExtractor ? keyExtractor(item, index) : String(index)}>
          {renderItem({ item, index })}
          {Separator && index < items.length - 1 ? <Separator /> : null}
        </React.Fragment>,
      );
    });
  }

  // onEndReached fires when the sentinel at the list tail becomes visible.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!onEndReached || !sentinelRef.current || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) onEndReached();
      },
      { rootMargin: '100px' },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [onEndReached, items.length]);

  return (
    <ScrollView
      style={style}
      contentContainerStyle={contentContainerStyle}
      horizontal={horizontal}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      refreshControl={refreshControl}
      scrollEnabled={scrollEnabled}
      testID={testID}
    >
      {renderSlot(ListHeaderComponent)}
      {items.length === 0 ? renderSlot(ListEmptyComponent) : rows}
      {renderSlot(ListFooterComponent)}
      {onEndReached ? <div ref={sentinelRef} style={{ height: 1 }} /> : null}
    </ScrollView>
  );
}

/** SectionList is unused by the app but kept so imports never break silently. */
export const SectionList = FlatList;

/* ------------------------------------------------------------------ *
 * TextInput
 * ------------------------------------------------------------------ */

export interface TextInputProps {
  value?: string;
  defaultValue?: string;
  onChangeText?: (text: string) => void;
  onChange?: (e: unknown) => void;
  placeholder?: string;
  placeholderTextColor?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'number-pad' | 'decimal-pad' | 'email-address' | 'phone-pad' | 'url';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  editable?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  style?: RNStyle;
  onFocus?: (e?: unknown) => void;
  onBlur?: (e?: unknown) => void;
  onSubmitEditing?: () => void;
  returnKeyType?: string;
  testID?: string;
  textAlignVertical?: string;
  blurOnSubmit?: boolean;
  selectTextOnFocus?: boolean;
  inputMode?: string;
  accessibilityLabel?: string;
  textContentType?: string;
  className?: string;
}

function keyboardTypeToInput(kind: TextInputProps['keyboardType']): {
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
} {
  switch (kind) {
    case 'numeric':
    case 'number-pad':
      return { type: 'text', inputMode: 'numeric' };
    case 'decimal-pad':
      return { type: 'text', inputMode: 'decimal' };
    case 'email-address':
      return { type: 'email', inputMode: 'email' };
    case 'phone-pad':
      return { type: 'tel', inputMode: 'tel' };
    case 'url':
      return { type: 'url', inputMode: 'url' };
    default:
      return { type: 'text' };
  }
}

export interface TextInputHandle {
  focus: () => void;
  blur: () => void;
  clear: () => void;
}

export const TextInput = forwardRef<TextInputHandle, TextInputProps>(function TextInput(
  {
    value,
    defaultValue,
    onChangeText,
    placeholder,
    placeholderTextColor,
    secureTextEntry,
    keyboardType,
    autoCapitalize,
    autoCorrect,
    autoFocus,
    editable = true,
    multiline,
    numberOfLines,
    maxLength,
    style,
    onFocus,
    onBlur,
    onSubmitEditing,
    testID,
    accessibilityLabel,
    className,
  },
  ref,
) {
  const elRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const placeholderId = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  React.useImperativeHandle(ref, () => ({
    focus: () => elRef.current?.focus(),
    blur: () => elRef.current?.blur(),
    clear: () => onChangeText?.(''),
  }));

  const css = toCss(style);
  const { type, inputMode } = keyboardTypeToInput(keyboardType);

  const shared = {
    placeholder,
    maxLength,
    autoFocus,
    disabled: !editable,
    readOnly: !editable,
    'aria-label': accessibilityLabel,
    'data-testid': testID,
    className: cx('fo-input', className, placeholderTextColor ? `fo-ph-${placeholderId}` : undefined),
    autoCapitalize,
    autoCorrect: autoCorrect === false ? ('off' as const) : undefined,
    spellCheck: autoCorrect === false ? false : undefined,
    onFocus: () => onFocus?.(),
    onBlur: () => onBlur?.(),
  };

  // placeholderTextColor has no inline-style equivalent; scope a rule to this input.
  const placeholderRule = placeholderTextColor ? (
    <style>{`.fo-ph-${placeholderId}::placeholder{color:${placeholderTextColor};opacity:1}`}</style>
  ) : null;

  if (multiline) {
    return (
      <>
        {placeholderRule}
        <textarea
          ref={(n) => { elRef.current = n; }}
          value={value}
          defaultValue={defaultValue}
          rows={numberOfLines}
          style={{ ...css, resize: 'vertical' }}
          onChange={(e) => onChangeText?.(e.target.value)}
          {...shared}
        />
      </>
    );
  }

  return (
    <>
      {placeholderRule}
      <input
        ref={(n) => { elRef.current = n; }}
        type={secureTextEntry ? 'password' : type}
        inputMode={secureTextEntry ? undefined : inputMode}
        value={value}
        defaultValue={defaultValue}
        style={css}
        onChange={(e) => onChangeText?.(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onSubmitEditing) {
            e.preventDefault();
            onSubmitEditing();
          }
        }}
        {...shared}
      />
    </>
  );
});

/* ------------------------------------------------------------------ *
 * Image
 * ------------------------------------------------------------------ */

export interface ImageSource {
  uri?: string;
}

export interface ImageProps {
  source?: ImageSource | string | number | null;
  style?: RNStyle;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center' | 'repeat';
  onLoad?: () => void;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: (e?: unknown) => void;
  testID?: string;
  accessibilityLabel?: string;
  alt?: string;
  fadeDuration?: number;
  className?: string;
}

const RESIZE_MODE_TO_OBJECT_FIT: Record<string, CSSProperties['objectFit']> = {
  cover: 'cover',
  contain: 'contain',
  stretch: 'fill',
  center: 'none',
  repeat: 'none',
};

export function Image({ source, style, resizeMode = 'cover', onLoad, onLoadEnd, onError, testID, accessibilityLabel, alt, className }: ImageProps) {
  const uri = typeof source === 'string' ? source : (source as ImageSource | null)?.uri;
  // `resizeMode` may also arrive inside the style object (RN allows both).
  const styleResize = (StyleSheet.flatten(style).resizeMode as string | undefined) ?? resizeMode;
  const css = toCss(style, {
    objectFit: RESIZE_MODE_TO_OBJECT_FIT[styleResize] ?? 'cover',
  });
  if (!uri) return <div className={cx('fo-image', className)} style={css} data-testid={testID} />;
  return (
    <img
      src={uri}
      className={cx('fo-image', className)}
      style={css}
      alt={alt ?? accessibilityLabel ?? ''}
      data-testid={testID}
      onLoad={() => { onLoad?.(); onLoadEnd?.(); }}
      onError={(e) => { onError?.(e); onLoadEnd?.(); }}
    />
  );
}

/** ImageBackground: the image fills the box, children stack above it. */
export function ImageBackground({
  source,
  style,
  imageStyle,
  resizeMode,
  children,
}: ImageProps & { imageStyle?: RNStyle; children?: ReactNode }) {
  return (
    <View style={style}>
      <Image
        source={source}
        resizeMode={resizeMode}
        style={[{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' } as RNStyle, imageStyle]}
      />
      {children}
    </View>
  );
}

/* ------------------------------------------------------------------ *
 * ActivityIndicator
 * ------------------------------------------------------------------ */

export function ActivityIndicator({
  size = 'small',
  color = '#2563eb',
  style,
  testID,
}: {
  size?: 'small' | 'large' | number;
  color?: string;
  style?: RNStyle;
  animating?: boolean;
  testID?: string;
}) {
  const px = typeof size === 'number' ? size : size === 'large' ? 36 : 20;
  return (
    <div
      style={{
        ...toCss(style),
        width: px,
        height: px,
        borderRadius: '50%',
        border: `${Math.max(2, Math.round(px / 10))}px solid ${color}33`,
        borderTopColor: color,
        animation: 'fo-spin 0.8s linear infinite',
        boxSizing: 'border-box',
        flexShrink: 0,
      }}
      role="progressbar"
      data-testid={testID}
    />
  );
}

/* ------------------------------------------------------------------ *
 * Modal
 * ------------------------------------------------------------------ */

export interface ModalProps {
  visible?: boolean;
  transparent?: boolean;
  animationType?: 'none' | 'slide' | 'fade';
  onRequestClose?: () => void;
  onShow?: () => void;
  onDismiss?: () => void;
  children?: ReactNode;
  statusBarTranslucent?: boolean;
  presentationStyle?: string;
  hardwareAccelerated?: boolean;
}

/**
 * Modal rendered into a portal above the app. Escape maps to RN's hardware
 * back / onRequestClose, and body scroll is locked while open.
 */
/**
 * Finds the modal's sheet — the first descendant painted with an opaque
 * background — and tags it and its parent overlay with classes so field-ops.css
 * can centre and cap it on wider viewports. This keeps every one of the app's
 * modals responsive from one place; the screens' own overlay/sheet markup is
 * untouched. Non-transparent (full-page) modals are left alone.
 */
function tagModalSheet(root: HTMLElement): void {
  root.querySelectorAll('.fo-modal-sheet, .fo-modal-overlay').forEach((el) => {
    el.classList.remove('fo-modal-sheet', 'fo-modal-overlay');
  });
  const candidates = root.querySelectorAll<HTMLElement>('*');
  for (const el of candidates) {
    const bg = getComputedStyle(el).backgroundColor;
    const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(bg);
    if (!m) continue;
    const alpha = m[4] === undefined ? 1 : parseFloat(m[4]);
    if (alpha < 0.99) continue;
    el.classList.add('fo-modal-sheet');
    el.parentElement?.classList.add('fo-modal-overlay');
    return;
  }
}

export function Modal({ visible, transparent, animationType = 'fade', onRequestClose, onShow, children }: ModalProps) {
  const portalRef = useRef<HTMLDivElement | null>(null);

  // Tag the sheet after the children have painted (and once more a frame later,
  // in case the screen renders its content asynchronously).
  useLayoutEffect(() => {
    if (!visible || !transparent || !portalRef.current) return;
    const root = portalRef.current;
    tagModalSheet(root);
    const frame = requestAnimationFrame(() => tagModalSheet(root));
    return () => cancelAnimationFrame(frame);
  }, [visible, transparent]);

  useEffect(() => {
    if (!visible) return;
    onShow?.();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onRequestClose?.();
    };
    window.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
    // onShow/onRequestClose are read fresh each open; only `visible` should retrigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible || typeof document === 'undefined') return null;

  const animation =
    animationType === 'slide'
      ? 'fo-modal-slide 0.22s ease-out'
      : animationType === 'none'
        ? undefined
        : 'fo-modal-fade 0.18s ease-out';

  return createPortal(
    <div
      ref={portalRef}
      className={transparent ? 'fo-app fo-modal fo-modal-transparent' : 'fo-app fo-modal'}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: transparent ? 'transparent' : '#f8fafc',
        animation,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------ *
 * RefreshControl / KeyboardAvoidingView
 * ------------------------------------------------------------------ */

/**
 * RefreshControl: a browser has no pull-to-refresh gesture to hook, so this
 * renders an explicit refresh affordance plus the spinner while refreshing —
 * the same capability, reachable with a mouse or a tap.
 */
export function RefreshControl({
  refreshing,
  onRefresh,
  tintColor = '#2563eb',
}: {
  refreshing?: boolean;
  onRefresh?: () => void;
  tintColor?: string;
  colors?: string[];
  progressBackgroundColor?: string;
}) {
  if (!onRefresh) return null;
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: refreshing ? '10px 0' : '4px 0',
        flexShrink: 0,
      }}
    >
      {refreshing ? (
        <ActivityIndicator color={tintColor} />
      ) : (
        <button
          type="button"
          onClick={onRefresh}
          style={{
            font: 'inherit',
            fontSize: 12,
            fontWeight: 600,
            color: tintColor,
            background: 'none',
            border: 0,
            cursor: 'pointer',
            padding: '4px 10px',
            minHeight: 28,
          }}
        >
          Refresh
        </button>
      )}
    </div>
  );
}

/** Browsers reflow around the virtual keyboard themselves; this is a pass-through. */
export function KeyboardAvoidingView({ style, children }: ViewProps & { behavior?: string; enabled?: boolean; keyboardVerticalOffset?: number }) {
  return <View style={style}>{children}</View>;
}

export const Keyboard = {
  dismiss() {
    const active = document.activeElement as HTMLElement | null;
    active?.blur?.();
  },
  addListener() {
    return { remove() {} };
  },
};

/* ------------------------------------------------------------------ *
 * Switch
 * ------------------------------------------------------------------ */

export function Switch({
  value,
  onValueChange,
  disabled,
  trackColor,
  thumbColor,
}: {
  value?: boolean;
  onValueChange?: (v: boolean) => void;
  disabled?: boolean;
  trackColor?: { false?: string; true?: string };
  thumbColor?: string;
  ios_backgroundColor?: string;
}) {
  const on = !!value;
  const track = on ? (trackColor?.true ?? '#2563eb') : (trackColor?.false ?? '#cbd5e1');
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => !disabled && onValueChange?.(!on)}
      style={{
        width: 48,
        height: 28,
        borderRadius: 999,
        border: 0,
        padding: 2,
        backgroundColor: track,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: on ? 'flex-end' : 'flex-start',
        transition: 'background-color 0.15s ease',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          backgroundColor: thumbColor ?? '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
          display: 'block',
          transition: 'transform 0.15s ease',
        }}
      />
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * Animated (minimal, CSS-transition backed)
 * ------------------------------------------------------------------ */

class AnimatedValue {
  private current: number;
  private listeners = new Set<(v: number) => void>();

  constructor(initial: number) {
    this.current = initial;
  }
  getValue(): number {
    return this.current;
  }
  setValue(v: number) {
    this.current = v;
    this.listeners.forEach((l) => l(v));
  }
  addListener(fn: (v: number) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private frame: number | null = null;

  /** Stops an in-flight animateTo() so a stopped animation cannot keep ticking. */
  cancelAnimation() {
    if (this.frame !== null) {
      cancelAnimationFrame(this.frame);
      this.frame = null;
    }
  }

  /** Drives the value with rAF so interpolation and opacity animate smoothly. */
  animateTo(to: number, duration: number, onDone?: () => void) {
    this.cancelAnimation();
    const from = this.current;
    if (duration <= 0) {
      this.setValue(to);
      onDone?.();
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      this.setValue(from + (to - from) * t);
      if (t < 1) {
        this.frame = requestAnimationFrame(step);
      } else {
        this.frame = null;
        onDone?.();
      }
    };
    this.frame = requestAnimationFrame(step);
  }
  interpolate({ inputRange, outputRange }: { inputRange: number[]; outputRange: (number | string)[] }) {
    const view = new AnimatedInterpolation(this, inputRange, outputRange);
    return view;
  }
}

class AnimatedInterpolation {
  constructor(
    readonly parent: AnimatedValue,
    readonly inputRange: number[],
    readonly outputRange: (number | string)[],
  ) {}
  getValue(): number | string {
    const v = this.parent.getValue();
    const { inputRange: ir, outputRange: or } = this;
    for (let i = 0; i < ir.length - 1; i++) {
      if (v >= ir[i] && v <= ir[i + 1]) {
        const ratio = (v - ir[i]) / (ir[i + 1] - ir[i] || 1);
        const a = or[i];
        const b = or[i + 1];
        if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * ratio;
        return ratio < 0.5 ? a : b;
      }
    }
    return v <= ir[0] ? or[0] : or[or.length - 1];
  }
  addListener(fn: (v: number) => void) {
    return this.parent.addListener(fn);
  }
}

/**
 * stop() is always present so callers can unconditionally cancel on unmount.
 * reset() returns the driven value(s) to where the animation began, which is what
 * Animated.loop relies on between iterations (RN's resetBeforeIteration default).
 */
type AnimationNode = { start: (cb?: () => void) => void; stop: () => void; reset: () => void };

function timing(
  value: AnimatedValue,
  config: { toValue: number; duration?: number; useNativeDriver?: boolean; delay?: number },
): AnimationNode {
  let cancelled = false;
  // The value at first start is the iteration origin a loop returns to.
  let origin: number | null = null;
  return {
    start(cb) {
      cancelled = false;
      if (origin === null) origin = value.getValue();
      const run = () => {
        if (cancelled) return;
        value.animateTo(config.toValue, config.duration ?? 300, () => {
          if (!cancelled) cb?.();
        });
      };
      if (config.delay) setTimeout(run, config.delay);
      else run();
    },
    stop() {
      cancelled = true;
      value.cancelAnimation();
    },
    reset() {
      if (origin !== null) value.setValue(origin);
    },
  };
}

/** Subscribes a component to an Animated value / interpolation. */
function useAnimatedValue(node: unknown): unknown {
  const [, force] = useState(0);
  useEffect(() => {
    const target = node as { addListener?: (fn: (v: number) => void) => (() => void) | { remove?: () => void } };
    if (!target?.addListener) return;
    const sub = target.addListener(() => force((n) => n + 1));
    return () => {
      if (typeof sub === 'function') sub();
      else sub?.remove?.();
    };
  }, [node]);
  if (node instanceof AnimatedValue || node instanceof AnimatedInterpolation) return node.getValue();
  return node;
}

function isAnimated(v: unknown): v is AnimatedValue | AnimatedInterpolation {
  return v instanceof AnimatedValue || v instanceof AnimatedInterpolation;
}

/**
 * Resolves Animated values in a style object to plain values, including those
 * nested inside a `transform` array (e.g. transform: [{ rotate: interpolation }]).
 */
function resolveAnimatedStyle(style: RNStyle): RNStyle {
  const flat = StyleSheet.flatten(style);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(flat)) {
    if (isAnimated(v)) {
      out[k] = v.getValue();
    } else if (k === 'transform' && Array.isArray(v)) {
      out[k] = v.map((entry) => {
        const resolved: Record<string, unknown> = {};
        for (const [fn, val] of Object.entries(entry as Record<string, unknown>)) {
          resolved[fn] = isAnimated(val) ? val.getValue() : val;
        }
        return resolved;
      });
    } else {
      out[k] = v;
    }
  }
  return out as RNStyle;
}

/** Collects every Animated node in a style, including inside transform arrays. */
function collectAnimatedNodes(style: RNStyle): (AnimatedValue | AnimatedInterpolation)[] {
  const flat = StyleSheet.flatten(style);
  const nodes: (AnimatedValue | AnimatedInterpolation)[] = [];
  for (const [k, v] of Object.entries(flat)) {
    if (isAnimated(v)) nodes.push(v);
    else if (k === 'transform' && Array.isArray(v)) {
      for (const entry of v) {
        for (const val of Object.values(entry as Record<string, unknown>)) {
          if (isAnimated(val)) nodes.push(val);
        }
      }
    }
  }
  return nodes;
}

/**
 * Keeps an element's inline style in sync with the Animated values in `style`
 * by writing to the DOM directly on each tick. This is what makes animations
 * smooth: no React render per frame, so a busy main thread (data loading) does
 * not stutter the motion.
 */
function useAnimatedDomStyle(ref: React.RefObject<HTMLElement | null>, style: RNStyle) {
  const styleRef = useRef(style);
  styleRef.current = style;
  const animatedNodes = collectAnimatedNodes(style);
  useEffect(() => {
    if (animatedNodes.length === 0) return;
    const apply = () => {
      const el = ref.current;
      if (!el) return;
      const css = toCss(resolveAnimatedStyle(styleRef.current));
      for (const [k, v] of Object.entries(css)) {
        (el.style as unknown as Record<string, string>)[k] = v == null ? '' : String(v);
      }
    };
    const unsubs = animatedNodes.map((n) => n.addListener(apply));
    return () => unsubs.forEach((u) => u());
    // The node set is stable for a given component; only its size can change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animatedNodes.length]);
}

function AnimatedView({ style, children, pointerEvents, ...rest }: ViewProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  useAnimatedDomStyle(ref, style);
  return (
    <View ref={ref} style={resolveAnimatedStyle(style)} pointerEvents={pointerEvents} {...rest}>
      {children}
    </View>
  );
}

function AnimatedText({ style, children, ...rest }: TextProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  useAnimatedDomStyle(ref, style);
  return (
    <Text ref={ref} style={resolveAnimatedStyle(style)} {...rest}>
      {children}
    </Text>
  );
}

export const Animated = {
  Value: AnimatedValue,
  View: AnimatedView,
  Text: AnimatedText,
  timing,
  delay(duration: number): AnimationNode {
    let timer: ReturnType<typeof setTimeout> | null = null;
    return {
      start: (cb) => {
        timer = setTimeout(() => cb?.(), duration);
      },
      stop: () => {
        if (timer) clearTimeout(timer);
      },
      reset: () => {},
    };
  },
  sequence(nodes: AnimationNode[]): AnimationNode {
    return {
      start(cb) {
        const run = (i: number) => {
          if (i >= nodes.length) { cb?.(); return; }
          nodes[i].start(() => run(i + 1));
        };
        run(0);
      },
      stop() {
        nodes.forEach((n) => n.stop());
      },
      reset() {
        // Reverse order so the first step's origin is the value that stands:
        // a looped sequence restarts from where the whole sequence began.
        [...nodes].reverse().forEach((n) => n.reset());
      },
    };
  },
  parallel(nodes: AnimationNode[]): AnimationNode {
    return {
      start(cb) {
        let done = 0;
        if (nodes.length === 0) { cb?.(); return; }
        nodes.forEach((n) => n.start(() => { done += 1; if (done === nodes.length) cb?.(); }));
      },
      stop() {
        nodes.forEach((n) => n.stop());
      },
      reset() {
        nodes.forEach((n) => n.reset());
      },
    };
  },
  /**
   * Repeats `node` indefinitely. Like React Native (resetBeforeIteration: true),
   * the driven values return to their origin before each iteration — without
   * that a rotation would animate 1 -> 1 after its first sweep and appear frozen.
   */
  loop(node: AnimationNode): AnimationNode {
    let cancelled = false;
    return {
      start() {
        cancelled = false;
        const run = () => {
          if (cancelled) return;
          node.reset();
          node.start(run);
        };
        run();
      },
      stop() {
        cancelled = true;
        node.stop();
      },
      reset() {
        node.reset();
      },
    };
  },
  spring(value: AnimatedValue, config: { toValue: number; useNativeDriver?: boolean }): AnimationNode {
    // Approximated with a short timing curve; visual intent is preserved.
    return timing(value, { toValue: config.toValue, duration: 220 });
  },
};

export { useAnimatedValue };

/* ------------------------------------------------------------------ *
 * Alert  (promise-backed dialog host)
 * ------------------------------------------------------------------ */

export interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertRequest {
  id: number;
  title: string;
  message?: string;
  buttons: AlertButton[];
}

type AlertListener = (req: AlertRequest) => void;
let alertListener: AlertListener | null = null;
let alertSeq = 0;
/** Queues alerts raised before the host mounts so none are dropped. */
const pendingAlerts: AlertRequest[] = [];

/**
 * RN's Alert.alert, rendered by <AlertHost /> (mounted in the app shell).
 * Same signature and button semantics, so call sites port unchanged.
 */
export const Alert = {
  alert(title: string, message?: string, buttons?: AlertButton[]) {
    const req: AlertRequest = {
      id: ++alertSeq,
      title,
      message,
      buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }],
    };
    if (alertListener) alertListener(req);
    else pendingAlerts.push(req);
  },
};

/** Renders Alert.alert() dialogs. Mount once, near the root of the app. */
export function AlertHost() {
  const [queue, setQueue] = useState<AlertRequest[]>([]);

  useEffect(() => {
    alertListener = (req) => setQueue((q) => [...q, req]);
    if (pendingAlerts.length > 0) {
      setQueue((q) => [...q, ...pendingAlerts.splice(0, pendingAlerts.length)]);
    }
    return () => {
      alertListener = null;
    };
  }, []);

  const current = queue[0];
  const dismiss = useCallback(() => setQueue((q) => q.slice(1)), []);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const cancelButton = current?.buttons.find((b) => b.style === 'cancel');
  const singleButton = current && current.buttons.length === 1 ? current.buttons[0] : undefined;

  /**
   * Keyboard + focus behaviour expected of a dialog: focus moves into it on open
   * (and returns afterwards), Tab is trapped inside, and Escape acts like the
   * Android back gesture on a cancelable alert — the cancel action, or the sole
   * button of a single-button alert.
   */
  useEffect(() => {
    if (!current) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const buttons = dialog ? Array.from(dialog.querySelectorAll<HTMLButtonElement>('button')) : [];
    // Default focus: the non-cancel action, else the first button.
    const primary = buttons.find((b) => b.dataset.alertStyle !== 'cancel') ?? buttons[0];
    primary?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        const target = cancelButton ?? singleButton;
        if (target) {
          target.onPress?.();
          dismiss();
        }
        return;
      }
      if (e.key === 'Tab' && buttons.length > 0) {
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    // Capture phase so an open Modal's own Escape handler does not fire first.
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      previouslyFocused?.focus?.();
    };
    // Re-arm per alert; the button list is derived from `current`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  if (!current) return null;

  const onBackdrop = () => {
    // Matches RN/Android: tapping outside triggers the cancel action when there is one.
    if (cancelButton) {
      cancelButton.onPress?.();
      dismiss();
    }
  };

  return createPortal(
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label={current.title}
      className="fo-app"
      onClick={onBackdrop}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        backgroundColor: 'rgba(15,23,42,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        animation: 'fo-modal-fade 0.15s ease-out',
      }}
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 14,
          padding: 20,
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 12px 32px rgba(15,23,42,0.22)',
        }}
      >
        <div style={{ fontSize: 17, fontWeight: 700, color: '#1e293b' }}>{current.title}</div>
        {current.message ? (
          <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.45, color: '#475569', whiteSpace: 'pre-wrap' }}>
            {current.message}
          </div>
        ) : null}
        <div
          style={{
            marginTop: 20,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            justifyContent: 'flex-end',
          }}
        >
          {current.buttons.map((button, i) => {
            const destructive = button.style === 'destructive';
            const cancel = button.style === 'cancel';
            return (
              <button
                key={`${button.text ?? 'btn'}-${i}`}
                type="button"
                data-alert-style={button.style ?? 'default'}
                onClick={() => {
                  button.onPress?.();
                  dismiss();
                }}
                style={{
                  font: 'inherit',
                  fontSize: 15,
                  fontWeight: 600,
                  minHeight: 44,
                  padding: '10px 18px',
                  borderRadius: 10,
                  border: cancel ? '1px solid #e2e8f0' : 0,
                  cursor: 'pointer',
                  backgroundColor: destructive ? '#dc2626' : cancel ? '#ffffff' : '#2563eb',
                  color: cancel ? '#475569' : '#ffffff',
                }}
              >
                {button.text ?? 'OK'}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------ *
 * Misc RN APIs used by the screens
 * ------------------------------------------------------------------ */

/** RN's AppState, mapped onto the page visibility API. */
export type AppStateStatus = 'active' | 'background' | 'inactive';

export const AppState = {
  get currentState(): AppStateStatus {
    if (typeof document === 'undefined') return 'active';
    return document.visibilityState === 'visible' ? 'active' : 'background';
  },
  addEventListener(type: 'change', handler: (state: AppStateStatus) => void) {
    if (type !== 'change' || typeof document === 'undefined') {
      return { remove() {} };
    }
    const onVisibility = () =>
      handler(document.visibilityState === 'visible' ? 'active' : 'background');
    // A browser tab regaining focus is also a return-to-foreground.
    const onFocus = () => handler('active');
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    return {
      remove() {
        document.removeEventListener('visibilitychange', onVisibility);
        window.removeEventListener('focus', onFocus);
      },
    };
  },
};

/** RN's Linking, mapped onto window.open / location. */
export const Linking = {
  async openURL(url: string): Promise<void> {
    window.open(url, '_blank', 'noopener,noreferrer');
  },
  async canOpenURL(_url: string): Promise<boolean> {
    return true;
  },
  async getInitialURL(): Promise<string | null> {
    return typeof window !== 'undefined' ? window.location.href : null;
  },
  addEventListener() {
    return { remove() {} };
  },
  /**
   * A page cannot open browser site settings programmatically. The call sites pair
   * this with an explanatory message, so resolving without navigating keeps that
   * flow intact while the user grants permission through the browser's own UI.
   */
  async openSettings(): Promise<void> {
    // No browser API exists for this.
  },
};

/** Clipboard, used by the user-management screen to copy temporary passwords. */
export const Clipboard = {
  async setStringAsync(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback for browsers/contexts without the async clipboard API.
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        return ok;
      } catch {
        return false;
      }
    }
  },
  async getStringAsync(): Promise<string> {
    try {
      return await navigator.clipboard.readText();
    } catch {
      return '';
    }
  },
};

/** Haptics: the Vibration API where available, otherwise a no-op. */
export const Haptics = {
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' } as const,
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' } as const,
  async impactAsync(style?: string): Promise<void> {
    if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
    const ms = style === 'heavy' ? 20 : style === 'medium' ? 12 : 8;
    try {
      navigator.vibrate(ms);
    } catch {
      // ignore
    }
  },
  async notificationAsync(_type?: string): Promise<void> {
    if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
    try {
      navigator.vibrate([10, 40, 10]);
    } catch {
      // ignore
    }
  },
  async selectionAsync(): Promise<void> {
    if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
    try {
      navigator.vibrate(5);
    } catch {
      // ignore
    }
  },
};

/** Safe-area insets; the web handles these via env() so report zeros. */
export function useSafeAreaInsets() {
  return useMemo(() => ({ top: 0, bottom: 0, left: 0, right: 0 }), []);
}

export function SafeAreaProvider({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

/** Matches RN's no-op on web. */
export const LogBox = { ignoreLogs() {}, ignoreAllLogs() {} };

export const InteractionManager = {
  runAfterInteractions(fn: () => void) {
    const id = requestAnimationFrame(() => fn());
    return { cancel: () => cancelAnimationFrame(id) };
  },
};

/** Android-only on RN; unused on web but kept so imports resolve. */
export const UIManager = { setLayoutAnimationEnabledExperimental() {} };
export const LayoutAnimation = {
  configureNext() {},
  Presets: { easeInEaseOut: {}, linear: {}, spring: {} },
};

/** A no-op provider matching FormScrollContext's RN ScrollView ref shape. */
const NoopContext = createContext<null>(null);
export function useNoopContext() {
  return useContext(NoopContext);
}


/* ------------------------------------------------------------------ *
 * Type aliases matching the React Native names the screens import
 * ------------------------------------------------------------------ */

/** RN style prop types all collapse to the same RN-ish style shape here. */
export type ViewStyle = RNStyle;
export type TextStyle = RNStyle;
export type ImageStyle = RNStyle;
export type StyleProp<T> = T | T[] | null | undefined | false;
export type TouchableOpacityProps = TouchableProps;
export type ScaledSize = { width: number; height: number; scale: number; fontScale: number };

/* ------------------------------------------------------------------ *
 * Remaining RN APIs referenced by the screens
 * ------------------------------------------------------------------ */

/**
 * StatusBar has no web equivalent; the `theme-color` meta tag is the closest
 * analogue and is already set in app.html. Rendering nothing keeps call sites valid.
 */
export function StatusBar(_props: {
  style?: string;
  barStyle?: string;
  backgroundColor?: string;
  translucent?: boolean;
  hidden?: boolean;
}): null {
  return null;
}

/**
 * RN exposes StatusBar.currentHeight (Android only). A browser has no status bar
 * the page must offset for, so 0 is the correct value here.
 */
StatusBar.currentHeight = 0;

/**
 * Android runtime permissions do not exist on the web: a browser grants camera,
 * location and notification access through its own per-origin prompts, which the
 * relevant adapters trigger. Reporting "granted" keeps the mobile call sites
 * working while the browser remains the real gatekeeper.
 */
export const PermissionsAndroid = {
  PERMISSIONS: {
    POST_NOTIFICATIONS: 'android.permission.POST_NOTIFICATIONS',
    ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
    CAMERA: 'android.permission.CAMERA',
  },
  RESULTS: { GRANTED: 'granted', DENIED: 'denied', NEVER_ASK_AGAIN: 'never_ask_again' },
  async request(): Promise<string> {
    return 'granted';
  },
  async check(): Promise<boolean> {
    return true;
  },
};

/** RN's findNodeHandle; on the web a ref already holds the DOM node. */
export function findNodeHandle(ref: unknown): unknown {
  if (ref && typeof ref === 'object' && 'current' in ref) {
    return (ref as { current: unknown }).current;
  }
  return ref;
}

/* ------------------------------------------------------------------ *
 * Type-space declarations for the component names
 * ------------------------------------------------------------------ */

/**
 * React Native exports each component as both a value and a type, and the screens
 * use the type form for refs (e.g. `React.RefObject<ScrollView>`). Declaring an
 * interface of the same name occupies the type space alongside the const above,
 * which is the same pattern React Native itself uses.
 */

/** A ref to a ScrollView exposes its imperative scroll methods. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ScrollView extends ScrollViewHandle {}

/** A ref to a TextInput exposes focus/blur/clear. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface TextInput extends TextInputHandle {}

/** A ref to a View/Text is the underlying DOM element on the web. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface View extends HTMLDivElement {}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Text extends HTMLSpanElement {}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Image extends HTMLImageElement {}
