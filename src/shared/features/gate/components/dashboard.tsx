import { useShiftStore } from '@/shared/features/shift';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  LucideArrowLeftToLine,
  LucideArrowRightToLine,
  LucideScanQrCode
} from 'lucide-react-native';
import React, { useCallback, useEffect } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming
} from 'react-native-reanimated';
import { getCardStatus } from '../apis/gate.api';
import { useDashboardStats, useNfc } from '../hooks';

const PulseRing = ({ delay = 0 }: { delay?: number }) => {
  const scale = useSharedValue(0.33);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(2.2, { duration: 3000, easing: Easing.out(Easing.quad) }),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0, { duration: 3000, easing: Easing.out(Easing.quad) }),
        -1,
        false
      )
    );
  }, [delay, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View 
      style={animatedStyle}
      className="absolute size-[240px] border-2 border-blue-500 rounded-full"
    />
  );
};

export const Dashboard = () => {
  const { currentShift } = useShiftStore();
  const { data: stats } = useDashboardStats(currentShift?.id);
  const { startListening, stopListening, isReading } = useNfc();
  const router = useRouter();

  const coreScale = useSharedValue(0.95);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      startListening(async (tag) => {
        if (!isActive) return;
        
        const tagUid = tag?.id || '';
        if (!tagUid) return;
        
        // Dynamically determine mode from DB
        const mode = await getCardStatus(tagUid);
        
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

  const handleNfcRead = () => {
    // Left for manual click fallback but functionally replaced by auto-scan
  };

  useEffect(() => {
    coreScale.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [coreScale]);

  const coreAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: coreScale.value }],
  }));

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
            <Text className="text-[10px] font-bold text-slate-400 uppercase">Vào</Text>
            <Text className="text-2xl font-extrabold text-green-500 font-mono">{stats?.entries || 0}</Text>
          </View>
          <View className="flex-1 bg-white p-3 rounded-lg shadow-sm border border-slate-200">
            <Text className="text-[10px] font-bold text-slate-400 uppercase">Ra</Text>
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
            <PulseRing delay={0} />
            <PulseRing delay={1000} />
            <PulseRing delay={2000} />
            
            <Animated.View 
              style={coreAnimatedStyle}
              className={`z-10 size-44 rounded-full bg-white shadow-xl shadow-blue-500/20 items-center justify-center border border-blue-500/10 ${isReading ? 'opacity-50' : ''}`}
            >
              <View className="size-32 bg-blue-500 rounded-full items-center justify-center shadow-lg">
                <LucideScanQrCode size={64} color="white" strokeWidth={1.5} />
              </View>
            </Animated.View>
          </Pressable>

          <View className="mt-8 items-center">
            <Text className="text-xl font-black text-slate-900 tracking-tight">
              {'CHẠM THẺ NFC'}
            </Text>
          </View>
        </View>

        {/* Manual Actions */}
        <View className="px-6 pb-12 flex-row gap-4">
          <Pressable 
            onPress={() => router.push('/gate/scan-plate?mode=in' as any)}
            className="flex-1 flex-col items-center justify-center gap-2 py-4 bg-blue-500 rounded-lg shadow-md active:scale-95"
          >
            <LucideArrowRightToLine size={24} color="white" />
            <Text className="text-white font-bold">XE VÀO</Text>
          </Pressable>
          <Pressable 
            onPress={() => router.push('/gate/scan-plate?mode=out' as any)}
            className="flex-1 flex-col items-center justify-center gap-2 py-4 bg-orange-500 rounded-lg shadow-md active:scale-95"
          >
            <LucideArrowLeftToLine size={24} color="white" />
            <Text className="text-white font-bold">XE RA</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};
