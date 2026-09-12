import React from 'react';
import { Alert, TouchableOpacity } from '@/field-ops/components/primitives';
import { Info } from 'lucide-react';
import { colors } from '@/field-ops/theme/tokens';

interface InfoButtonProps {
  title: string;
  message: string;
  size?: number;
  color?: string;
}

export function InfoButton({ title, message, size = 18, color = colors.textMuted }: InfoButtonProps) {
  const onPress = () => Alert.alert(title, message);
  return (
    <TouchableOpacity onPress={onPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      <Info size={size} color={color} />
    </TouchableOpacity>
  );
}
