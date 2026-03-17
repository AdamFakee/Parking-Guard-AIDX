import { Button } from '@/shared/components/ui';
import { Check, X } from 'lucide-react-native';
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSystemConfig } from '../hooks';

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
  
  const { data: sysConfig } = useSystemConfig();

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
        <View className="bg-slate-50 rounded-t-3xl pt-2 px-4 pb-8 h-[90%]">
          {/* Header */}
          <View className="flex-row justify-between items-center py-4 border-b border-slate-200 mb-4">
            <Text className="text-xl font-bold text-slate-800">Thanh toán QR</Text>
            <Pressable disabled={isPending} onPress={() => setIsVisible(false)} className="p-2">
              <X size={24} color="#64748b" />
            </Pressable>
          </View>

          <Text className="text-center text-sm font-medium text-red-500 px-4 mb-4">
            ⚠️ Kiểm tra kỹ trước khi xác nhận!
          </Text>
          
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Amount */}
            <View className="bg-white rounded-2xl p-6 mb-4 items-center border border-slate-100 shadow-sm">
              <Text className="text-sm text-slate-500 mb-1 uppercase tracking-wider font-medium">Số tiền cần thanh toán</Text>
              <Text className="text-4xl font-mono font-bold text-orange-500">{amount.toLocaleString()}đ</Text>
            </View>

            {/* QR Code Section */}
            <View className="items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-6">
              <View className="w-full max-w-[280px] aspect-square relative pb-4">
                <Image 
                  source={{ uri: sysConfig?.qrImageUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuARdRblaaTR1LF77j-uNlnxUlxFwkA5NJU_PamhAdnQ0SP3zg_QiEgM2bePjhjCwdDXtTGuVK-Bcl9mumTFKVrzzNW7tv-3JXXarw0kY6wxi1AKoJNaELO9kh0ynhyG3etyPNjxwN4XNP7JEXIi-jtoY9Zv93zG3sDxnwy26mWGdYUlgrbA6FTqRPuEQarzokjwETNmwFTGuFUdKyu4b_Sv4jSZbii6XL9o54OFBGI8axIjhwj9zIgmLqhbPkASUTXVxvDXwFrrXpU' }} 
                  className="w-full h-full" resizeMode="contain" 
                />
              </View>
            </View>

            {/* Bank Detail */}
            <View className="bg-white rounded-xl p-4 border border-slate-100 mb-6">
              <View className="flex-row justify-between py-3 border-b border-slate-50">
                <Text className="text-slate-500">Ngân hàng</Text>
                <Text className="font-semibold text-slate-800">{sysConfig?.bankName || 'Vietcombank'}</Text>
              </View>
              <View className="flex-row justify-between py-3 border-b border-slate-50">
                <Text className="text-slate-500">Chủ tài khoản</Text>
                <Text className="font-semibold text-slate-800 uppercase">{sysConfig?.accountName || 'NGUYEN VAN A'}</Text>
              </View>
              <View className="flex-row justify-between py-3 border-b border-slate-50">
                <Text className="text-slate-500">Số tài khoản</Text>
                <Text className="font-mono font-bold text-slate-800">{sysConfig?.accountNumber || '1234567890'}</Text>
              </View>
              {content ? (
                <View className="flex-row justify-between py-3">
                  <Text className="text-slate-500">Nội dung</Text>
                  <Text className="font-mono font-bold text-purple-600">{content}</Text>
                </View>
              ) : null}
            </View>


          </ScrollView>

          {/* Action */}
          <Button
            disabled={isPending}
            loading={isPending}
            onPress={handleConfirm}
            label={isPending ? 'Đang xử lý...' : 'ĐÃ NHẬN'}
            leftIcon={!isPending ? Check : undefined}
            iconSize={24}
            className={`w-full rounded-xl border-0 h-14 ${isPending ? 'bg-slate-400' : 'bg-green-500'}`}
            textClassName="text-white font-bold text-lg"
          />
        </View>
      </View>
    </Modal>
  );
});

QRPaymentModal.displayName = 'QRPaymentModal';
