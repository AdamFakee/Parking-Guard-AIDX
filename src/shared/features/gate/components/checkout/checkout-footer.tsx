import { Button } from '@/shared/components/ui';
import { SHADOW } from '@/shared/constants/color.const';
import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isFreeCheckout } from '../../services/gate-session.service';

interface Props {
  isFormValid: boolean;
  isPending: boolean;
  onCashPress: () => void;
  onQRPress: () => void;
  totalFee?: number;
}

/** Footer checkout — brand-blue only (no green). */
export const CheckoutFooter = ({
  isFormValid,
  isPending,
  onCashPress,
  onQRPress,
  totalFee,
}: Props) => {
  const insets = useSafeAreaInsets();
  const free = totalFee !== undefined && isFreeCheckout(totalFee);
  const disabled = !isFormValid || isPending;

  return (
    <View
      className="bg-white p-4 border-t border-slate-100 absolute bottom-0 left-0 right-0"
      style={[SHADOW.up, { paddingBottom: Math.max(insets.bottom, 24) }]}
    >
      {free ? (
        <Button
          disabled={disabled}
          loading={isPending}
          onPress={onCashPress}
          label="XÁC NHẬN XE RA"
          className={`rounded-2xl h-14 border-0 ${disabled ? 'bg-slate-200' : 'bg-brand-blue'}`}
          textClassName={disabled ? 'text-slate-400' : 'text-white font-black text-sm'}
        />
      ) : (
        <>
          <Text className="text-center text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-[1.5px]">
            Phương thức thanh toán
          </Text>
          <View className="flex-row gap-3">
            <Button
              disabled={disabled}
              loading={isPending}
              onPress={onCashPress}
              label="TIỀN MẶT"
              className={`flex-1 rounded-2xl h-14 border-0 ${disabled ? 'bg-slate-200' : 'bg-brand-blue'}`}
              textClassName={disabled ? 'text-slate-400' : 'text-white font-black text-xs'}
            />
            <Button
              disabled={disabled}
              onPress={onQRPress}
              label="CHUYỂN KHOẢN"
              className={`flex-1 rounded-2xl h-14 border-2 ${
                disabled ? 'bg-slate-100 border-slate-200' : 'bg-white border-brand-blue'
              }`}
              textClassName={disabled ? 'text-slate-400' : 'text-brand-blue font-black text-xs'}
            />
          </View>
        </>
      )}
    </View>
  );
};
