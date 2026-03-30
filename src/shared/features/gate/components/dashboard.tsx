import { Button } from '@/shared/components/ui';
import { useShiftStore } from '@/shared/features/shift/store/useShiftStore';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  CreditCard,
  LucideArrowLeftToLine,
  LucideArrowRightToLine,
  LucideScanQrCode
} from 'lucide-react-native';
import React, { useCallback } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { toastQueue } from '@/shared/utils/toast.util';
import { getCardStatus } from '../apis/gate.api';
import { useDashboardStats, useNfc } from '../hooks';
import { ExpiredMonthlyCardModal, ExpiredMonthlyCardModalRef } from './expired-monthly-card-modal';


export const Dashboard = () => {
  const { currentShift } = useShiftStore();
  const { data: stats } = useDashboardStats(currentShift?.id);
  const { startListening, stopListening, isReading } = useNfc();
  const router = useRouter();
  
  const modalRef = React.useRef<ExpiredMonthlyCardModalRef>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      startListening(async (tag) => {
        if (!isActive) return;
        
        const tagUid = tag?.id || '';
        if (!tagUid) return;
        
        // Dynamically determine mode from DB
        const mode = await getCardStatus(tagUid);
        
        if (mode === 'expired') {
          modalRef.current?.show(tagUid);
          return;
        }
        
        const params = new URLSearchParams({ mode });
        if (tagUid) params.append('tagUid', tagUid);
        
        router.push(`/gate/scan-plate?${params.toString()}` as any);
      });

      return () => {
        isActive = false;
        stopListening();
      };
    }, [startListening, stopListening, router])
  );
  // ... (useFocusEffect setup)

  const handleModalSuccess = (tagUid: string, type: 'renew' | 'convert') => {
    // Auto-navigate to scan-plate after action
    const params = new URLSearchParams({ mode: 'in', tagUid });
    router.push(`/gate/scan-plate?${params.toString()}` as any);
    
    if (type === 'renew') {
      toastQueue.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'Đã gia hạn thẻ tháng thành công.',
      });
    } else {
      toastQueue.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'Đã chuyển thành thẻ lượt.',
      });
    }
  };

  const handleNfcRead = () => {
    // Left for manual click fallback but functionally replaced by auto-scan
  };


  // Format currency
  const formatCurrency = (val: number) => {
    return val.toLocaleString('vi-VN');
  };

  return (
    <View className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-white px-5 pt-14 pb-4 border-b border-slate-200">
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center gap-3">
            <View className="size-10 rounded-full bg-blue-50 items-center justify-center border border-blue-100">
              <Text className="text-blue-500 font-bold">
                {currentShift?.staffName?.split(' ').map(n => n[0]).join('').slice(-2) || 'NV'}
              </Text>
            </View>
            <View>
              <Text className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                Nhân viên trực
              </Text>
              <Text className="text-lg font-extrabold text-slate-900 leading-tight">
                {currentShift?.staffName || '---'}
              </Text>
            </View>
          </View>
          <View className="items-end">
            <View className="flex-row items-center bg-green-50 px-2 py-0.5 rounded-md border border-green-200 gap-1">
              <View className="size-1.5 bg-green-500 rounded-full" />
              <Text className="text-green-500 text-[10px] font-bold uppercase">Online</Text>
            </View>
            <Text className="text-[10px] font-semibold text-slate-400 mt-1">
              Bắt đầu: {currentShift?.startTime ? new Date(currentShift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Stats Row */}
        <View className="flex-row gap-3 px-4 mt-4">
          <View className="flex-1 bg-white p-3 rounded-lg shadow-sm border border-slate-200">
            <Text className="text-[10px] font-bold text-slate-400 uppercase">Trong bãi</Text>
            <Text className="text-2xl font-extrabold text-blue-500 font-mono">{stats?.inYard || 0}</Text>
          </View>
          <View className="flex-1 bg-white p-3 rounded-lg shadow-sm border border-slate-200">
            <Text className="text-[10px] font-bold text-slate-400 uppercase">Xe vào</Text>
            <Text className="text-2xl font-extrabold text-green-500 font-mono">{stats?.entries || 0}</Text>
          </View>
          <View className="flex-1 bg-white p-3 rounded-lg shadow-sm border border-slate-200">
            <Text className="text-[10px] font-bold text-slate-400 uppercase">Xe ra</Text>
            <Text className="text-2xl font-extrabold text-orange-500 font-mono">{stats?.exits || 0}</Text>
          </View>
        </View>

        {/* Revenue Card */}
        <View className="px-4 mt-4">
          <View className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex-col gap-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Tổng doanh thu ca
              </Text>
              <View className="px-2 py-0.5 bg-green-50 rounded-md border border-green-100">
                <Text className="text-green-500 text-[10px] font-bold">CA HIỆN TẠI</Text>
              </View>
            </View>
            <View className="flex-row items-baseline justify-center gap-1">
              <Text className="text-3xl font-extrabold text-green-500 tracking-tight font-mono">
                {formatCurrency(stats?.revenue || 0)}
              </Text>
              <Text className="text-lg font-bold text-green-500">đ</Text>
            </View>
          </View>
        </View>

        {/* Interaction Area */}
        <View className="items-center justify-center py-12 px-6">
          <Pressable 
            onPress={handleNfcRead}
            disabled={isReading}
            className="size-[100px] items-center justify-center relative"
          >
            <View 
              className={`z-10 size-44 rounded-full bg-white shadow-xl shadow-blue-500/20 items-center justify-center border border-blue-500/10 ${isReading ? 'opacity-50' : ''}`}
            >
              <View className="size-32 bg-blue-500 rounded-full items-center justify-center shadow-lg">
                <LucideScanQrCode size={64} color="white" strokeWidth={1.5} />
              </View>
            </View>
          </Pressable>

          <View className="mt-8 items-center">
            <Text className="text-xl font-black text-slate-900 tracking-tight">
              {'CHẠM THẺ NFC'}
            </Text>
          </View>
        </View>

        {/* Manual Actions */}
        <View className="px-5 pb-10 gap-4">
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Button 
                label="Xe vào"
                onPress={() => router.push('/gate/scan-plate?mode=in' as any)}
                leftIcon={LucideArrowRightToLine}
                className="h-20 bg-primary border-primary/90"
                iconSize={28}
                textClassName="text-lg"
              />
            </View>
            <View className="flex-1">
              <Button 
                label="Xe ra"
                onPress={() => router.push('/gate/scan-plate?mode=out' as any)}
                rightIcon={LucideArrowLeftToLine}
                className="h-20 bg-brand-orange border-brand-orange/90"
                iconSize={28}
                textClassName="text-lg"
              />
            </View>
          </View>
          
          <Button 
            label="Đăng ký thẻ tháng"
            variant="outline"
            onPress={() => router.push('/gate/monthly-register' as any)}
            leftIcon={CreditCard}
          />
        </View>
      </ScrollView>

      <ExpiredMonthlyCardModal 
        ref={modalRef}
        onSuccess={handleModalSuccess}
      />
    </View>
  );
};
