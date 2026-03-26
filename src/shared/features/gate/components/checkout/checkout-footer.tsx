import { Button } from '@/shared/components/ui';
import { SHADOW } from '@/shared/constants/color.const';
import { CheckCircle2, Wallet } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface Props {
  isFormValid: boolean;
  isPending: boolean;
  onCashPress: () => void;
  onQRPress: () => void;
}

export const CheckoutFooter = ({ isFormValid, isPending, onCashPress, onQRPress }: Props) => {
  return (
    <View 
      className="bg-white p-4 pb-10 border-t border-[#F1F5F9] absolute bottom-0 left-0 right-0"
      style={SHADOW.up}
    >
      <Text className="text-center text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-[1.5px]">Phương thức thanh toán</Text>
      <View className="flex-row gap-3">
        <Button 
          disabled={!isFormValid || isPending}
          loading={isPending}
          onPress={onCashPress}
          label="TIỀN MẶT"
          leftIcon={Wallet}
          iconSize={20}
          className={`flex-1 rounded-2xl h-14 border-0 ${!isFormValid || isPending ? 'bg-slate-200' : 'bg-green-500'}`}
          textClassName={!isFormValid || isPending ? 'text-slate-400' : 'text-white font-black text-xs'}
        />
        
        <Button 
          disabled={!isFormValid || isPending}
          onPress={onQRPress}
          label="CHUYỂN KHOẢN"
          leftIcon={CheckCircle2}
          iconSize={20}
          className={`flex-1 rounded-2xl h-14 border-0 ${!isFormValid || isPending ? 'bg-slate-200' : 'bg-violet-500'}`}
          textClassName={!isFormValid || isPending ? 'text-slate-400' : 'text-white font-black text-xs'}
        />
      </View>
    </View>
  );
};
