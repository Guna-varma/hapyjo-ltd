import React, { useRef } from 'react';
import { Text, TouchableOpacity, View } from '@/field-ops/components/primitives';
import { useLocale } from '@/field-ops/context/LocaleContext';

/** Format YYYY-MM-DD for display (e.g. "21 Feb 2025") */
export function formatDateLabel(isoDate: string): string {
  if (!isoDate || isoDate.length < 10) return '';
  const d = new Date(isoDate + 'T12:00:00');
  if (isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Parse YYYY-MM-DD to Date at noon to avoid timezone shifts */
export function parseDateToLocal(isoDate: string): Date {
  if (!isoDate || isoDate.length < 10) return new Date();
  const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Date to YYYY-MM-DD */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 'short' = "Mar 4, 2026"; 'iso' = "2026-03-04" (YYYY-MM-DD only) */
export type DateDisplayFormat = 'short' | 'iso';

interface DatePickerFieldProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  className?: string;
  /** Display format in the field: 'short' (default) or 'iso' (YYYY-MM-DD only). */
  displayFormat?: DateDisplayFormat;
  /** Inline validation error (e.g. "Dates must be in YYYY-MM-DD format only."). */
  error?: string;
}

function displayValue(value: string, format: DateDisplayFormat): string {
  if (!value || value.length < 10) return '';
  return format === 'iso' ? value.slice(0, 10) : formatDateLabel(value);
}

export function DatePickerField({
  value,
  onValueChange,
  label,
  placeholder,
  minimumDate,
  maximumDate,
  className = '',
  displayFormat = 'short',
  error,
}: DatePickerFieldProps) {
  const { t } = useLocale();
  const webInputRef = useRef<HTMLInputElement | null>(null);
  const placeholderText = placeholder ?? t('common_select_date');
  const displayText = value ? displayValue(value, displayFormat) : '';

  // Uses the browser's native date picker via <input type="date">.
  return (
    <View className={className}>
      {label ? (
        <Text className="text-xs text-gray-500 mb-1">{label}</Text>
      ) : null}
      <View style={{ position: 'relative' as const }}>
        <TouchableOpacity
          onPress={() => webInputRef.current?.click()}
          className="border border-gray-300 rounded-lg px-3 py-2.5 bg-white"
          activeOpacity={0.7}
        >
          <Text className={value ? 'text-gray-900' : 'text-gray-500'}>
            {displayText || placeholderText}
          </Text>
        </TouchableOpacity>
        {error ? <Text style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{error}</Text> : null}
        {React.createElement('input', {
          ref: (el: HTMLInputElement | null) => {
            (webInputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
          },
          type: 'date',
          value: value || '',
          min: minimumDate ? toISODate(minimumDate) : undefined,
          max: maximumDate ? toISODate(maximumDate) : undefined,
          onChange: (e: { target: { value: string } }) => onValueChange(e.target.value || ''),
          style: {
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer',
            fontSize: 16,
            zIndex: 1,
          },
        })}
      </View>
    </View>
  );
}
