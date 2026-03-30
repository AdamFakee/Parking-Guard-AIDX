import { COLORS } from '@/shared/constants';
import { formatDisplayPlate } from '@/shared/features/gate';
import { ICard } from '@/shared/types/card';
import { useRouter } from 'expo-router';
import { Calendar, ChevronRight, CreditCard, RefreshCw } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

interface CardItemProps {
  card: ICard;
  onRenew?: (card: ICard) => void;
}

const STATUS_CONFIG = {
  active: {
    label: 'Hợp lệ',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-100',
  },
  expired: {
    label: 'Hết hạn',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-100',
  },
  expiring_soon: {
    label: 'Sắp hết',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-100',
  },
  locked: {
    label: 'Đã khóa',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
  },
};

export const CardItem = React.memo(({ card, onRenew }: CardItemProps) => {
  const router = useRouter();
  const config = STATUS_CONFIG[card.status] || STATUS_CONFIG.active;

  const handlePress = () => {
    router.push(`/(tab)/cards/${card.serialId}`);
  };

  return (
    <Pressable 
      onPress={handlePress}
      className="bg-white rounded-2xl border border-slate-100 p-4 mb-3 shadow-sm active:bg-slate-50"
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-row items-center gap-2">
          <View className={`w-10 h-10 rounded-full items-center justify-center ${config.bgColor}`}>
            <CreditCard size={20} color={card.status === 'locked' ? COLORS.slate[500] : COLORS.brand.blue} />
          </View>
          <View>
            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Biển số: <Text className="text-black font-black text-lg uppercase tracking-tighter">
              {formatDisplayPlate(card.licensePlate)}
            </Text></Text>
            <View className="flex-row items-center gap-1.5">
              <Text className="text-slate-400 text-xs font-medium">S/N: {card.serialId}</Text>
              <View className="w-1 h-1 rounded-full bg-slate-300" />
              <Text className="text-slate-400 text-xs font-medium uppercase">{card.type === 'monthly' ? 'Thẻ tháng' : card.type}</Text>
            </View>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          <View className={`px-2.5 py-1 rounded-full border ${config.bgColor} ${config.borderColor}`}>
            <Text className={`text-[10px] uppercase font-bold tracking-tight ${config.color}`}>
              {config.label}
            </Text>
          </View>
          <View className={`px-2.5 py-1 rounded-full border ${card.usageStatus === 'in' ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
            <Text className={`text-[10px] uppercase font-bold tracking-tight ${card.usageStatus === 'in' ? 'text-blue-600' : 'text-slate-400'}`}>
              {card.usageStatus === 'in' ? 'Đang sử dụng' : 'Không sử dụng'}
            </Text>
          </View>
        </View>
      </View>


      <View className="h-[1px] bg-slate-50 w-full mb-3" />

      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5 mb-1">
            <Text className="text-slate-600 font-semibold text-sm">{card.holderName || 'Khách vãng lai'}</Text>
          </View>
          {card.expiredAt !== 'N/A' && (
            <View className="flex-row items-center gap-1.5">
              <Calendar size={12} color={COLORS.slate[400]} />
              <Text className="text-slate-400 text-[11px]">Hết hạn: {card.expiredAt}</Text>
            </View>
          )}
        </View>
        
        <View className="flex-row items-center gap-3">
          {card.type === 'monthly' && (
            <Pressable
              onPress={(e) => {
                if (onRenew) {
                  onRenew(card);
                } else {
                  router.push(`/(tab)/cards/${card.serialId}/renew`);
                }
              }}
              className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg border ${
                card.status === 'expired' 
                  ? 'bg-rose-600 border-rose-600' 
                  : card.status === 'expiring_soon'
                    ? 'bg-amber-500 border-amber-500'
                    : 'bg-white border-slate-200'
              }`}
            >
              <RefreshCw 
                size={14} 
                color={card.status === 'expired' || card.status === 'expiring_soon' ? 'white' : COLORS.brand.blue} 
              />
              <Text className={`text-xs font-bold ${
                card.status === 'expired' || card.status === 'expiring_soon' ? 'text-white' : 'text-brand-blue'
              }`}>
                Gia hạn
              </Text>
            </Pressable>
          )}
          <ChevronRight size={20} color={COLORS.slate[400]} />
        </View>
      </View>
    </Pressable>
  );
});

CardItem.displayName = 'CardItem';


