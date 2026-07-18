import banksData from '@/assets/bank.json';
import { Button } from '@/shared/components/ui';
import { COLORS } from '@/shared/constants/color.const';
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
  /** Nhúng trong sheet cha — không bọc ScrollView lồng */
  embedded?: boolean;
}

export const QRPaymentContent: React.FC<QRPaymentContentProps> = ({
  amount,
  content,
  isExpiredRenew,
  embedded = false,
}) => {
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

  const body = (
    <>
      {isExpiredRenew && (
        <View className="bg-amber-50 border border-amber-200 p-3 rounded-2xl mb-4 flex-row items-center gap-2">
          <View className="size-2 bg-amber-500 rounded-full" />
          <Text className="text-[10px] text-amber-700 font-bold uppercase tracking-tight">
            Kiểm tra kỹ số tiền & nội dung CK
          </Text>
        </View>
      )}

      <View className="bg-blue-50 rounded-2xl p-5 mb-4 items-center border border-blue-100">
        <Text className="text-[10px] text-brand-blue mb-1 uppercase tracking-widest font-black">
          Số tiền thanh toán
        </Text>
        <Text className="text-3xl font-mono font-black text-brand-blue">
          {amount.toLocaleString('vi-VN')}đ
        </Text>
      </View>

      <View className="items-center bg-white p-5 rounded-3xl border border-slate-100 mb-4 w-full">
        <View className="bg-white rounded-2xl overflow-hidden p-2 items-center justify-center">
          {qrString ? (
            <QRCode value={qrString} size={embedded ? 200 : 240} quietZone={10} />
          ) : (
            <ActivityIndicator color={COLORS.brand.blue} size="large" />
          )}
        </View>
        <Text className="text-[11px] text-slate-900 font-black uppercase tracking-widest mt-4">
          Quét mã VietQR
        </Text>
        <Text className="text-[9px] text-slate-400 mt-1 font-bold text-center">
          Hỗ trợ app ngân hàng & ví điện tử
        </Text>
      </View>

      <View className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
        <DetailRow label="Ngân hàng" value={sysConfig?.bankName || '—'} />
        <DetailRow label="Chủ tài khoản" value={sysConfig?.accountName || '—'} isUpper />
        <DetailRow label="Số tài khoản" value={sysConfig?.accountNumber || '—'} isMono />
        <DetailRow label="Nội dung" value={content} isMono isHighlighted showBorder={false} />
      </View>
    </>
  );

  if (embedded) {
    return <View>{body}</View>;
  }

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {body}
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
