/**
 * Browser replacement for @react-native-community/slider.
 *
 * Same props the app passes (minimumValue, maximumValue, step, value, disabled,
 * onValueChange, and the three tint colours), implemented with <input type="range">
 * so it is keyboard-accessible and works with mouse and touch.
 */

import React, { useId } from 'react';
import { toCss, type RNStyle } from './style';

export interface SliderProps {
  style?: RNStyle;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  value?: number;
  disabled?: boolean;
  onValueChange?: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
  testID?: string;
  accessibilityLabel?: string;
}

export function Slider({
  style,
  minimumValue = 0,
  maximumValue = 1,
  step = 0,
  value = 0,
  disabled,
  onValueChange,
  onSlidingComplete,
  minimumTrackTintColor = '#2563eb',
  maximumTrackTintColor = '#e2e8f0',
  thumbTintColor = '#2563eb',
  testID,
  accessibilityLabel,
}: SliderProps) {
  // Scoped class so each slider can carry its own track/thumb colours.
  const scope = 'fo-slider-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');

  const clamped = Math.min(Math.max(value, minimumValue), maximumValue);
  const span = maximumValue - minimumValue;
  const percent = span > 0 ? ((clamped - minimumValue) / span) * 100 : 0;

  // The filled portion is painted with a gradient, matching the native
  // minimum/maximum track tint split at the thumb position.
  const trackBackground =
    'linear-gradient(to right, ' +
    minimumTrackTintColor + ' 0%, ' +
    minimumTrackTintColor + ' ' + percent + '%, ' +
    maximumTrackTintColor + ' ' + percent + '%, ' +
    maximumTrackTintColor + ' 100%)';

  const css = {
    ...toCss(style),
    width: '100%',
    height: 28,
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    background: 'transparent',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    margin: 0,
    padding: 0,
  };

  return (
    <>
      <style>{
        '.' + scope + '{-webkit-appearance:none;appearance:none}' +
        '.' + scope + '::-webkit-slider-runnable-track{height:4px;border-radius:999px;background:' + trackBackground + '}' +
        '.' + scope + '::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:22px;height:22px;margin-top:-9px;border-radius:50%;background:' + thumbTintColor + ';border:2px solid #fff;box-shadow:0 1px 3px rgba(15,23,42,0.3)}' +
        '.' + scope + '::-moz-range-track{height:4px;border-radius:999px;background:' + maximumTrackTintColor + '}' +
        '.' + scope + '::-moz-range-progress{height:4px;border-radius:999px;background:' + minimumTrackTintColor + '}' +
        '.' + scope + '::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:' + thumbTintColor + ';border:2px solid #fff;box-shadow:0 1px 3px rgba(15,23,42,0.3)}'
      }</style>
      <input
        type="range"
        className={scope}
        style={css}
        min={minimumValue}
        max={maximumValue}
        step={step && step > 0 ? step : 'any'}
        value={clamped}
        disabled={disabled}
        data-testid={testID}
        aria-label={accessibilityLabel}
        onChange={(e) => onValueChange?.(Number(e.target.value))}
        onPointerUp={(e) => onSlidingComplete?.(Number((e.target as HTMLInputElement).value))}
        onKeyUp={(e) => onSlidingComplete?.(Number((e.target as HTMLInputElement).value))}
      />
    </>
  );
}

export default Slider;
