import { Button, OptionCard } from '@/shared/components/ui';
import { useShiftStore } from '@/shared/features/shift';
import { useResponsive } from '@/shared/hooks';
import { AlertCircle, CalendarClock, CreditCard, QrCode, RotateCcw, Smartphone, Wallet } from 'lucide-react-native';
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Modal, Text, View } from 'react-native';

import { toastQueue } from '@/shared/utils/toast.util';
import { DEFAULT_MONTHLY_PRICE_MOTORBIKE } from '../const';
import { useConvertCardToRegular, useRenewMonthlyCard, useSystemConfig } from '../hooks';
import { QRPaymentContent } from './qr-payment-content';

export interface ExpiredMonthlyCardModalRef {
  show: (tagUid: string) => void;
  hide: () => void;
}

interface ExpiredMonthlyCardModalProps {
  onSuccess: (tagUid: string, type: 'renew' | 'convert') => void;
  onCancel?: () => void;
}

type TViewMode = 'selection' | 'confirmation' | 'qr_payment';

export const ExpiredMonthlyCardModal = forwardRef<ExpiredMonthlyCardModalRef, ExpiredMonthlyCardModalProps>(({ 
  onSuccess, 
  onCancel 
}, ref) => {
  const { hp } = useResponsive();
  
  const [isVisible, setIsVisible] = useState(false);
  const [tagUid, setTagUid] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<TViewMode>('selection');
  const [selectedOption, setSelectedOption] = useState<'renew' | 'convert' | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qr_transfer'>('cash');

  // --- FEATURE LOGIC (Hooks) ---
  const { currentShift } = useShiftStore();
  const { data: sysConfig } = useSystemConfig();
  const { mutateAsync: performRenew, isPending: isRenewing } = useRenewMonthlyCard();
  const { mutateAsync: performConvert, isPending: isConverting } = useConvertCardToRegular();
  
  const isPending = isRenewing || isConverting;

  useImperativeHandle(ref, () => ({
    show: (uid: string) => {
      setTagUid(uid);
      setIsVisible(true);
      setViewMode('selection');
      setSelectedOption(null);
      setPaymentMethod('cash');
    },
    hide: () => {
      setIsVisible(false);
    }
  }));

  const handleConfirm = async () => {
    if (!tagUid || !currentShift?.id) {
      if (!currentShift?.id) {
        toastQueue.show({
          type: 'error',
          text1: 'Lỗi',
          text2: 'Không tìm thấy ca trực hiện tại',
        });
      }
      return;
    }
    
    // Nếu chọn Renew + QR và chưa hiển thị QR -> chuyển sang bước QR
    if (selectedOption === 'renew' && paymentMethod === 'qr_transfer' && viewMode !== 'qr_payment') {
      setViewMode('qr_payment');
      return;
    }

    try {
      if (selectedOption === 'renew') {
        const price = sysConfig?.monthlyPriceMotorbike || DEFAULT_MONTHLY_PRICE_MOTORBIKE;
        await performRenew({
          cardUid: tagUid,
          shiftId: currentShift.id,
          price,
          paymentMethod,
          months: 1
        });
        onSuccess(tagUid, 'renew');
      } else if (selectedOption === 'convert') {
        await performConvert(tagUid);
        onSuccess(tagUid, 'convert');
      }
      setIsVisible(false);
    } catch (error: any) {
      toastQueue.show({
        type: 'error',
        text1: 'Thất bại',
        text2: 'Đã có lỗi xảy ra: ' + error.message,
      });
    }
  };

  const handleCancelInternal = () => {
    setIsVisible(false);
    onCancel?.();
  };

  const renewPrice = sysConfig?.monthlyPriceMotorbike || DEFAULT_MONTHLY_PRICE_MOTORBIKE;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={handleCancelInternal}
    >
      <View className="flex-1 bg-black/70 items-center justify-center p-4">
        <View className="bg-white dark:bg-slate-900 rounded-[48px] p-8 w-full max-w-[540px] border border-slate-200 dark:border-slate-800 shadow-2xl relative">

          {viewMode === 'selection' ? (
            // --- BƯỚC 1: CHỌN HÀNH ĐỘNG ---
            <>
              <View className="items-center mb-6">
                <View className="bg-red-500/10 p-5 rounded-full mb-4">
                  <AlertCircle size={48} color="#ef4444" />
                </View>
                <Text className="text-3xl font-black text-slate-900 dark:text-white text-center tracking-tight">Thẻ tháng hết hạn!</Text>
              </View>

              <Text className="text-[15px] text-slate-500 dark:text-slate-400 mb-8 text-center leading-6 font-medium px-4">
                Thẻ này đã quá hạn phí tháng. Vui lòng chọn cách xử lý để xe có thể vào bãi.
              </Text>

              <View className="space-y-4 mb-8">
                <OptionCard 
                  isSelected={false}
                  onPress={() => {
                    setSelectedOption('renew');
                    setViewMode('confirmation');
                  }}
                  leftIcon={<CalendarClock size={28} color="#3b82f6" />}
                >
                  <View>
                    <Text className="font-black text-slate-900 dark:text-white text-lg">Gia hạn thêm 1 tháng</Text>
                  </View>
                </OptionCard>

                <OptionCard 
                  isSelected={false}
                  onPress={() => {
                    setSelectedOption('convert');
                    setViewMode('confirmation');
                  }}
                  leftIcon={<CreditCard size={28} color="#3b82f6" />}
                >
                  <View>
                    <Text className="font-black text-slate-900 dark:text-white text-lg">Đổi thành vé thường</Text>
                  </View>
                </OptionCard>
              </View>

              <Button 
                label="BỎ QUA"
                variant="secondary"
                onPress={handleCancelInternal}
                leftIcon={RotateCcw}
                className="h-16 rounded-[24px] bg-slate-100 dark:bg-slate-800 border-transparent"
                textClassName="text-slate-600 dark:text-slate-400 font-bold"
              />
            </>
          ) : viewMode === 'confirmation' ? (
            // --- BƯỚC 2: XÁC NHẬN & CHỌN PHƯƠNG THỨC THANH TOÁN---
            <>
              <View className="items-center mb-6">
                <View className={selectedOption === 'renew' ? "bg-blue-500/10 p-6 rounded-full mb-4" : "bg-slate-500/10 p-6 rounded-full mb-4"}>
                  {selectedOption === 'renew' ? (
                    <CalendarClock size={52} color="#3b82f6" />
                  ) : (
                    <CreditCard size={52} color="#94a3b8" />
                  )}
                </View>
                <Text className="text-2xl font-black text-slate-900 dark:text-white text-center uppercase tracking-tighter">
                  {selectedOption === 'renew' ? 'Xác nhận gia hạn' : 'Xác nhận chuyển đổi'}
                </Text>
              </View>

              <Text className="text-[15px] text-slate-600 dark:text-slate-400 mb-8 text-center leading-6 font-medium">
                {selectedOption === 'renew' 
                  ? 'Vui lòng chọn phương thức thanh toán để hoàn tất thủ tục gia hạn.'
                  : 'Sau khi chuyển đổi, thẻ này sẽ không còn các ưu đãi của thẻ tháng. Bạn vẫn muốn tiếp tục?'}
              </Text>

              {selectedOption === 'renew' && (
                <View className="space-y-4 mb-10">
                  <OptionCard 
                    isSelected={paymentMethod === 'cash'}
                    onPress={() => setPaymentMethod('cash')}
                    leftIcon={<Wallet size={24} color={paymentMethod === 'cash' ? '#3b82f6' : '#94a3b8'} />}
                  >
                    <Text className={`font-black uppercase tracking-widest ${paymentMethod === 'cash' ? 'text-primary' : 'text-slate-400'}`}>Tiền mặt</Text>
                  </OptionCard>

                  <OptionCard 
                    isSelected={paymentMethod === 'qr_transfer'}
                    onPress={() => setPaymentMethod('qr_transfer')}
                    leftIcon={<Smartphone size={24} color={paymentMethod === 'qr_transfer' ? '#3b82f6' : '#94a3b8'} />}
                  >
                    <Text className={`font-black uppercase tracking-widest ${paymentMethod === 'qr_transfer' ? 'text-primary' : 'text-slate-400'}`}>Quét mã QR</Text>
                  </OptionCard>
                </View>
              )}

              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Button 
                    label="QUAY LẠI"
                    variant='outline'
                    onPress={() => setViewMode('selection')}
                    disabled={isPending}
                    textClassName="text-slate-500 font-bold"
                    className='p-3'
                  />
                </View>
                
                <View className="flex-1">
                  <Button 
                    label={selectedOption === 'renew' && paymentMethod === 'qr_transfer' ? "XEM MÃ QR" : "XÁC NHẬN"}
                    variant="primary"
                    onPress={handleConfirm}
                    loading={isPending}
                    textClassName="text-white font-black"
                    className='p-3'
                  />
                </View>
              </View>
            </>
          ) : (
            // --- BƯỚC 3: HIỂN THỊ QR THANH TOÁN ---
            <View style={{ height: hp(90) }}>
              <View className="flex-row items-center justify-between mb-6">
                <View className="flex-row items-center gap-3">
                  <View className="size-10 bg-blue-500 rounded-2xl items-center justify-center">
                    <QrCode size={24} color="white" />
                  </View>
                  <Text className="text-md font-black text-slate-900 dark:text-white uppercase tracking-tighter">Thanh toán</Text>
                </View>
                <View className="bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-full border border-orange-100 dark:border-orange-900/50">
                   <Text className="text-orange-600 dark:text-orange-500 text-[10px] font-black tracking-widest">CHỜ CHUYỂN KHOẢN</Text>
                </View>
              </View>

              <View className="flex-1">
                <QRPaymentContent 
                  amount={renewPrice}
                  content={`GIAHAN ${tagUid?.slice(-6)}`}
                  isExpiredRenew
                />
              </View>

              <View className="mt-6 border-t border-slate-100 dark:border-slate-800 gap-4">
                 <Button 
                  label="XÁC NHẬN ĐÃ NHẬN TIỀN"
                  variant="primary"
                  onPress={handleConfirm}
                  loading={isPending}
                  disabled={isPending}
                  textClassName="tracking-wider"
                />
                 
                 <Button 
                  label="QUAY LẠI CHỈNH SỬA"
                  variant="outline"
                  onPress={() => setViewMode('confirmation')}
                  disabled={isPending}
                  textClassName="tracking-wider"
                />
              </View>
            </View>
          )}

        </View>
      </View>
    </Modal>
  );
});

ExpiredMonthlyCardModal.displayName = 'ExpiredMonthlyCardModal';

ExpiredMonthlyCardModal.displayName = 'ExpiredMonthlyCardModal';
