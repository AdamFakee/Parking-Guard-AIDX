import { cn } from '@/shared/utils';
import React from 'react';
import { Text, View } from 'react-native';

interface FinanceRowProps {
  label: string;
  value: number;
  color?: string;
  fontBold?: boolean;
}

export const FinanceRow = ({ label, value, color = 'text-slate-900', fontBold = false }: FinanceRowProps) => (
  <View className="flex-row justify-between items-center mb-sm">
    <Text className="text-slate-400 text-sm">{label}</Text>
    <Text className={cn('text-base', fontBold ? 'font-black' : 'font-medium', color)}>
      {(value || 0).toLocaleString('vi-VN')}đ
    </Text>
  </View>
);
