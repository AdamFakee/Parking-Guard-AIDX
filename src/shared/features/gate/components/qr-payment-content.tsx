import banksData from '@/assets/bank.json';
import { Button } from '@/shared/components/ui';
import { useRouter } from 'expo-router';
import { Settings2 } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { generateVietQROffline } from '@/shared/utils/vietqr';
import { useSystemConfig } from '../hooks';

const normalizeText = (text?: string) => {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/Đ/g, 'D');
};

const getBankBin = (name: string) => {
  if (!name) return;
  return banksData.find(b => b.shortName === name || b.name === name)?.bin;
};

interface QRPaymentContentProps {
  amount: number;
  content: string;
  isExpiredRenew?: boolean;
}

export const QRPaymentContent: React.FC<QRPaymentContentProps> = ({ amount, content, isExpiredRenew }) => {
  const router = useRouter();
  const { data: sysConfig, isLoading } = useSystemConfig();

  const qrString = useMemo(() => {
    if (!sysConfig || (!sysConfig?.bankName || !sysConfig?.accountNumber || !sysConfig?.accountName)) return '';

    let bankBin = getBankBin(sysConfig.bankName);
    
    if(!bankBin) return '';

    try {
      return generateVietQROffline({
        bin: bankBin,
        stk: sysConfig.accountNumber!,
        amount: amount,
        desc: content,
        accountName: normalizeText(sysConfig.accountName!),
      });
    } catch (error) {
      console.error('VietQR Gen Error:', error);
      return '';
    }
  }, [sysConfig, amount, content]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center p-10">
        <ActivityIndicator color="#3B82F6" size="large" />
      </View>
    );
  }

  if (!sysConfig?.bankName || !sysConfig?.accountNumber || !sysConfig?.accountName) {
    return (
      <View className="flex-1 items-center justify-center p-6 gap-6">
        <View className="size-20 bg-amber-50 rounded-full items-center justify-center border-4 border-white shadow-sm">
          <Settings2 size={40} color="#F59E0B" />
        </View>
        <View className="gap-2 items-center">
          <Text className="text-xl font-black text-slate-900 text-center">Thiếu thông tin ngân hàng</Text>
          <Text className="text-slate-500 text-center leading-5 px-4">
            Hệ thống cần thông tin Ngân hàng, Số tài khoản và Tên chủ khoản để tạo mã VietQR tự động.
          </Text>
        </View>
        <Button 
          label="Thiết lập ngay" 
          onPress={() => router.push('/settings' as any)} 
          className="w-full mt-4 h-14"
          leftIcon={Settings2}
        />
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Warning Card - Subtle but Clear */}
      {isExpiredRenew && (
        <View className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/50 p-3 rounded-2xl mb-4 flex-row items-center gap-2">
           <View className="size-2 bg-amber-500 rounded-full" />
           <Text className="text-[10px] text-amber-700 dark:text-amber-500 font-bold uppercase tracking-tight">Vui lòng kiểm tra kỹ số tiền & nội dung chuyển khoản</Text>
        </View>
      )}

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Amount Section - Make it Pop! */}
        <View className="bg-white dark:bg-slate-800 rounded-3xl p-6 mb-5 items-center border border-slate-100 dark:border-slate-800 shadow-sm">
          <Text className="text-[10px] text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-[2px] font-black text-center">Số tiền thanh toán</Text>
          <Text className="text-4xl font-mono font-black text-blue-600 dark:text-blue-400 tracking-tighter">{amount.toLocaleString()}đ</Text>
        </View>

        {/* QR Code Container - High Visibility */}
        <View className="items-center bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 mb-6 w-full">
          <View className="w-full aspect-square relative bg-white rounded-2xl overflow-hidden p-2 items-center justify-center">
            {qrString ? (
              <QRCode 
                value={qrString} 
                size={240} 
                quietZone={10}
              />
            ) : (
              <ActivityIndicator color="#3B82F6" size="large" />
            )}
          </View>
          <View className="mt-6 items-center">
            <Text className="text-[11px] text-slate-900 dark:text-white font-black uppercase tracking-[1.5px]">Quét mã VietQR</Text>
            <Text className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 font-bold">Hỗ trợ tất cả ứng dụng ngân hàng & ví điện tử</Text>
          </View>
        </View>

        {/* Bank Detail Section - Clean Table Layout */}
        <View className="bg-slate-50 dark:bg-slate-800/50 rounded-[28px] p-5 border border-slate-100 dark:border-slate-800 space-y-3">
          <DetailRow label="Ngân hàng" value={sysConfig?.bankName || 'Vietcombank'} />
          <DetailRow label="Chủ tài khoản" value={sysConfig?.accountName || 'CONG TY PARKING'} isUpper />
          <DetailRow label="Số tài khoản" value={sysConfig?.accountNumber || '1234567890'} isMono />
          <DetailRow 
            label="Nội dung" 
            value={content} 
            isMono 
            isHighlighted 
            showBorder={false} 
          />
        </View>
      </ScrollView>
    </View>
  );
};

const DetailRow = ({ 
  label, 
  value, 
  isUpper = false, 
  isMono = false, 
  isHighlighted = false,
  showBorder = true
}: { 
  label: string; 
  value: string; 
  isUpper?: boolean; 
  isMono?: boolean;
  isHighlighted?: boolean;
  showBorder?: boolean;
}) => (
  <View className={`flex-row justify-between items-center py-2.5 ${showBorder ? 'border-b border-slate-200/50 dark:border-slate-700/50' : ''}`}>
    <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">{label}</Text>
    <Text 
      className={`font-black text-[13px] ${isMono ? 'font-mono' : ''} ${isUpper ? 'uppercase text-slate-900 dark:text-white' : ''} ${isHighlighted ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}
      numberOfLines={1}
    >
      {value}
    </Text>
  </View>
);
