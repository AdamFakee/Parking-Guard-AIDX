import { Button, OptionCard } from '@/shared/components/ui';
import { AlertCircle, CalendarClock, Check, ChevronLeft, CreditCard, RotateCcw } from 'lucide-react-native';
import React, { useImperativeHandle, useState, forwardRef } from 'react';
import { Modal, Text, View } from 'react-native';

export interface ExpiredMonthlyCardModalRef {
  show: (tagUid: string) => void;
  hide: () => void;
}

interface ExpiredMonthlyCardModalProps {
  isPending?: boolean;
  onRenew: (tagUid: string) => void;
  onConvertToRegular: (tagUid: string) => void;
  onCancel?: () => void;
}

export const ExpiredMonthlyCardModal = forwardRef<ExpiredMonthlyCardModalRef, ExpiredMonthlyCardModalProps>(({ 
  isPending,
  onRenew, 
  onConvertToRegular, 
  onCancel 
}, ref) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tagUid, setTagUid] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<'renew' | 'convert' | null>(null);

  useImperativeHandle(ref, () => ({
    show: (uid: string) => {
      setTagUid(uid);
      setIsVisible(true);
      setSelectedOption(null);
    },
    hide: () => {
      setIsVisible(false);
    }
  }));

  const handleConfirm = () => {
    if (!tagUid) return;
    if (selectedOption === 'renew') {
      onRenew(tagUid);
    } else if (selectedOption === 'convert') {
      onConvertToRegular(tagUid);
    }
  };

  const handleCancelInternal = () => {
    setIsVisible(false);
    onCancel?.();
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={handleCancelInternal}
    >
      <View className="flex-1 bg-black/70 items-center justify-center p-6">
        <View className="bg-white dark:bg-slate-900 rounded-[32px] p-6 w-full border border-slate-200 dark:border-slate-800 shadow-2xl">
          
          {selectedOption === null ? (
            // --- UI CHỌN OPTION ---
            <>
              <View className="items-center mb-5">
                <View className="bg-red-500/10 p-4 rounded-full mb-3">
                  <AlertCircle size={40} color="#ef4444" />
                </View>
                <Text className="text-2xl font-black text-slate-900 dark:text-white text-center tracking-tight">Thẻ tháng đã hết hạn!</Text>
              </View>

              <Text className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center leading-5 font-medium">
                Vui lòng chọn xử lý cho thẻ này để tiếp tục thực hiện lượt vào.
              </Text>

              <OptionCard 
                isSelected={false}
                onPress={() => setSelectedOption('renew')}
                className="bg-blue-50/50 dark:bg-slate-800/50 border-blue-100 dark:border-slate-700 py-4 rounded-2xl"
                leftIcon={<CalendarClock size={24} color="#3b82f6" />}
              >
                <View>
                  <Text className="font-bold text-slate-900 dark:text-white text-base">Gia hạn thêm 1 tháng</Text>
                  <Text className="text-blue-600 dark:text-slate-400 text-[10px] mt-0.5 uppercase tracking-wider font-bold">Cập nhật hạn dùng & vào xe</Text>
                </View>
              </OptionCard>

              <OptionCard 
                isSelected={false}
                onPress={() => setSelectedOption('convert')}
                className="bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 py-4 rounded-2xl mb-6"
                leftIcon={<CreditCard size={24} color="#94a3b8" />}
              >
                <View>
                  <Text className="font-bold text-slate-900 dark:text-white text-base">Đổi thành vé thường</Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5 uppercase tracking-wider font-bold">Mất quyền lợi thẻ tháng</Text>
                </View>
              </OptionCard>

              <Button 
                label="HỦY THAO TÁC"
                variant="secondary"
                onPress={handleCancelInternal}
                leftIcon={RotateCcw}
                className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border-transparent"
                textClassName="text-slate-600 dark:text-slate-400"
              />
            </>
          ) : (
            // --- UI XÁC NHẬN ---
            <>
              <View className="items-center mb-5">
                <View className={selectedOption === 'renew' ? "bg-blue-500/10 p-5 rounded-full mb-3" : "bg-slate-500/10 p-5 rounded-full mb-3"}>
                  {selectedOption === 'renew' ? (
                    <CalendarClock size={44} color="#3b82f6" />
                  ) : (
                    <CreditCard size={44} color="#94a3b8" />
                  )}
                </View>
                <Text className="text-xl font-black text-slate-900 dark:text-white text-center uppercase tracking-tight">
                  {selectedOption === 'renew' ? 'Xác nhận gia hạn' : 'Xác nhận chuyển đổi'}
                </Text>
              </View>

              <Text className="text-[15px] text-slate-600 dark:text-slate-400 mb-8 text-center leading-6 font-medium">
                {selectedOption === 'renew' 
                  ? 'Bạn có chắc chắn muốn gia hạn thẻ này thêm 1 tháng? Thẻ sẽ tiếp tục được sử dụng làm thẻ tháng.'
                  : 'Bạn có chắc chắn muốn đổi thẻ này sang vé thường? Thẻ sẽ không còn tính năng thẻ tháng sau khi chuyển đổi.'}
              </Text>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Button 
                    label="QUAY LẠI"
                    variant="secondary"
                    onPress={() => setSelectedOption(null)}
                    disabled={isPending}
                    leftIcon={ChevronLeft}
                    className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border-transparent px-2"
                    textClassName="text-slate-600 dark:text-slate-400 text-[13px]"
                  />
                </View>
                
                <View className="flex-[1.2]">
                  <Button 
                    label="XÁC NHẬN"
                    variant="primary"
                    onPress={handleConfirm}
                    loading={isPending}
                    leftIcon={Check}
                    className={selectedOption === 'renew' ? "bg-blue-600 border-blue-600 h-14 rounded-2xl px-2" : "bg-white border-white h-14 rounded-2xl px-2"}
                    textClassName={selectedOption === 'renew' ? "text-white text-[13px]" : "text-slate-900 text-[13px]"}
                  />
                </View>
              </View>
            </>
          )}

        </View>
      </View>
    </Modal>
  );
});

ExpiredMonthlyCardModal.displayName = 'ExpiredMonthlyCardModal';
