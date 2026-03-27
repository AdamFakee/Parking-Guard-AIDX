import { cn } from '@/shared/utils';
import { CheckCircle2, Scan } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const styles = {
  shadowSm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
};

interface NfcScannerCardProps {
  uid: string | null;
  isReading: boolean;
  onPress: () => void;
}

export const NfcScannerCard = ({ 
  uid, 
  isReading, 
  onPress 
}: NfcScannerCardProps) => (
  <View className="gap-4">
    <Text className="text-sm font-bold text-slate-900 pl-1">1. Xác thực thẻ NFC</Text>
    <TouchableOpacity 
      onPress={onPress}
      disabled={isReading}
      className={cn(
        "h-28 border-2 border-dashed rounded-3xl items-center justify-center gap-3",
        uid ? "bg-green-50 border-green-500" : "bg-white border-blue-200"
      )}
      style={!uid ? styles.shadowSm : undefined}
    >
      {uid ? (
        <>
          <View className="size-12 bg-green-500 rounded-full items-center justify-center">
            <CheckCircle2 size={24} color="white" />
          </View>
          <Text className="text-green-600 font-black tracking-tight text-base">Thẻ: {uid}</Text>
        </>
      ) : (
        <>
          <View className="size-12 bg-blue-50 rounded-full items-center justify-center">
            <Scan size={24} color="#3B82F6" />
          </View>
          <Text className="text-blue-500 font-bold">{isReading ? 'Đang chờ quét thẻ...' : 'Chạm thẻ vào đầu đọc'}</Text>
        </>
      )}
    </TouchableOpacity>
  </View>
);
