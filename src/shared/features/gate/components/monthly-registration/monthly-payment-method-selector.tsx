import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Banknote, CreditCard } from 'lucide-react-native';
import { cn } from '@/shared/utils';

const styles = {
  shadowSm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
};

interface MonthlyPaymentMethodSelectorProps {
  value: 'cash' | 'qr_transfer';
  onSelect: (method: 'cash' | 'qr_transfer') => void;
}

export const MonthlyPaymentMethodSelector = ({ 
  value, 
  onSelect 
}: MonthlyPaymentMethodSelectorProps) => {
  const options = [
    { value: 'cash' as const, label: 'Tiền mặt', icon: Banknote },
    { value: 'qr_transfer' as const, label: 'Chuyển khoản (QR)', icon: CreditCard },
  ];

  return (
    <View className="gap-2">
      <Text className="text-note1 text-slate-500 font-medium ml-1">Hình thức thanh toán</Text>
      <View className="flex-row gap-3">
        {options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onSelect(opt.value)}
              className={cn(
                'flex-1 flex-row items-center justify-center gap-2 py-4 rounded-2xl border',
                isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-200'
              )}
              style={!isSelected ? styles.shadowSm : undefined}
            >
              <opt.icon size={18} color={isSelected ? 'white' : '#64748B'} />
              <Text className={cn('font-bold text-xs', isSelected ? 'text-white' : 'text-slate-500')}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
