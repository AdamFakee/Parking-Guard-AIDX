import { Button } from '@/shared/components/ui';
import { Check, X } from 'lucide-react-native';
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { QRPaymentContent } from './qr-payment-content';

export interface QRPaymentModalRef {
  open: (amount: number, content?: string) => void;
  close: () => void;
}

interface Props {
  onConfirm: () => void;
  isPending?: boolean;
}

export const QRPaymentModal = forwardRef<QRPaymentModalRef, Props>(({ onConfirm, isPending }, ref) => {
  const [isVisible, setIsVisible] = useState(false);
  const [amount, setAmount] = useState(0);
  const [content, setContent] = useState('');
  
  useImperativeHandle(ref, () => ({
    open: (amt, cnt = '') => {
      setAmount(amt);
      setContent(cnt);
      setIsVisible(true);
    },
    close: () => setIsVisible(false)
  }));

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => !isPending && setIsVisible(false)}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-slate-50 dark:bg-slate-900 rounded-t-[44px] pt-4 px-6 pb-8 h-[92%] border-t border-slate-200 dark:border-slate-800">
          {/* Header */}
          <View className="flex-row justify-between items-center py-5 border-b border-slate-200 dark:border-slate-800 mb-6">
            <View className="flex-row items-center gap-3">
              <View className="size-8 bg-blue-500 rounded-xl items-center justify-center">
                 <Check size={18} color="white" />
              </View>
              <Text className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Thanh toán QR</Text>
            </View>
            <Pressable disabled={isPending} onPress={() => setIsVisible(false)} className="size-10 bg-slate-100 dark:bg-slate-800 rounded-full items-center justify-center">
              <X size={20} color="#64748b" />
            </Pressable>
          </View>
          
          <View className="flex-1">
            <QRPaymentContent 
              amount={amount}
              content={content}
            />
          </View>

          {/* Action */}
          <View className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              disabled={isPending}
              loading={isPending}
              onPress={handleConfirm}
              label={isPending ? 'Đang xử lý giao dịch...' : 'TÔI ĐÃ NHẬN TIỀN'}
              leftIcon={!isPending ? Check : undefined}
              className={'h-16'}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
});

QRPaymentModal.displayName = 'QRPaymentModal';
