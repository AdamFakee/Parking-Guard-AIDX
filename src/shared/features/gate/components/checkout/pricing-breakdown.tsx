import { COLORS, SHADOW } from '@/shared/constants/color.const';
import { TPricingResult } from '@/shared/features/gate';
import { Calculator } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface Props {
  cardUid?: string | null;
  pricing: TPricingResult;
  showSurcharge?: boolean;
}

export const PricingBreakdown = ({ cardUid, pricing, showSurcharge = true }: Props) => {
  return (
    <View 
      className="bg-white rounded-2xl overflow-hidden border border-[#F1F5F9]"
      style={[SHADOW.bottom, { elevation: 2 }]}
    >
      <View className="p-5">
        <View className="flex-row items-center mb-4">
          <Calculator size={18} color={COLORS.slate[500]} />
          <Text className="text-[12px] font-bold text-slate-400 uppercase tracking-widest ml-2">Thanh toán</Text>
        </View>
        
        <View className="flex-row justify-between mb-2">
          <Text className="text-sm text-slate-500">Mã thẻ</Text>
          <Text className="text-sm font-bold text-[#1E293B]">{cardUid || 'Không sử dụng thẻ'}</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-sm text-slate-500">Thời gian đỗ</Text>
          <Text className="text-sm font-bold text-[#1E293B]">{pricing.duration}</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-sm text-slate-500">Tiền gửi xe</Text>
          <Text className="text-sm font-bold text-[#1E293B]">{pricing.fee.toLocaleString()}đ</Text>
        </View>
        {showSurcharge && pricing.surcharge > 0 && (
          <View className="flex-row justify-between">
            <Text className="text-red-500 text-sm font-bold">Phụ thu mất thẻ</Text>
            <Text className="text-sm font-bold text-red-500">+{pricing.surcharge.toLocaleString()}đ</Text>
          </View>
        )}
      </View>
      
      <View className="bg-[#fff7ed] p-6 items-center justify-center border-t border-[#ffedd5]">
        <Text className="text-[10px] font-black text-amber-500 uppercase tracking-[2px] mb-1">Tổng cộng</Text>
        <Text className="text-[32px] font-black text-amber-500" style={{ fontFamily: 'monospace' }}>
          {pricing.total.toLocaleString()}đ
        </Text>
      </View>
    </View>
  );
};
