import { AppHeader, Button } from '@/shared/components/ui';
import { COLORS } from '@/shared/constants/color.const';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LucidePlay, LucideUser } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStartShift } from '../hooks';
import { useShiftStore } from '../store';

export const StartShift = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { staffId, name, role } = useLocalSearchParams<{ staffId: string; name: string; role: 'admin' | 'staff' }>();
  const [openingCash, setOpeningCash] = useState('');
  
  const { mutate: startShift, isPending } = useStartShift();
  const setCurrentShift = useShiftStore((state) => state.setCurrentShift);

  const handleStartShift = () => {
    if (!openingCash || isNaN(Number(openingCash))) return;
    if (!staffId) return;

    startShift(
      { staffId, openingCash: Number(openingCash) },
      {
        onSuccess: (data) => {
          // data should match the shift object from DB
          setCurrentShift({
            id: data.id,
            staffId: data.staffId,
            staffName: name || '',
            openingCash: data.openingCash,
            startTime: data.startTime.toISOString(),
            status: data.status as 'open' | 'closed',
            role: role || 'staff',
          });
          
          // Navigate to main tabs after starting shift
          router.replace('/(tab)');
        },
        onError: (err: any) => {
          console.error('Failed to start shift:', err);
          // Handle error (e.g., show alert)
        }
      }
    );
  };

  const isButtonDisabled = !openingCash || Number(openingCash) <= 0 || isPending;

  const handleDevQuickOpen = () => {
    if (!staffId || isPending) return;
    const cash = 500_000;
    setOpeningCash(String(cash));
    startShift(
      { staffId, openingCash: cash },
      {
        onSuccess: (data) => {
          setCurrentShift({
            id: data.id,
            staffId: data.staffId,
            staffName: name || '',
            openingCash: data.openingCash,
            startTime: data.startTime.toISOString(),
            status: data.status as 'open' | 'closed',
            role: role || 'staff',
          });
          router.replace('/(tab)');
        },
        onError: (err: any) => {
          console.error('Failed to start shift:', err);
        },
      }
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-50"
    >
      <AppHeader title="Mở ca trực" variant="white" onLeftPress={() => router.back()} />

      <ScrollView className="flex-1 p-4" contentContainerStyle={{ gap: 24 }}>
        <View className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-blue-500 flex-row items-center">
          <View className="w-12 h-12 rounded-full bg-slate-100 items-center justify-center">
            <LucideUser size={24} color={COLORS.brand.blue} />
          </View>
          <View className="ml-4">
            <Text className="text-xs text-slate-500 font-medium">Nhân viên trực</Text>
            <Text className="text-lg font-bold text-slate-800">{name}</Text>
          </View>
        </View>

        <View className="gap-3">
          <Text className="text-sm font-semibold text-slate-700 ml-1">
            Tiền mặt đầu ca <Text className="text-brand-red font-normal">(bắt buộc)</Text>
          </Text>
          <View className="relative">
            <TextInput
              className="w-full px-4 py-5 bg-white border-2 border-slate-200 rounded-2xl focus:border-green-500 text-3xl font-bold text-slate-800"
              placeholder="0"
              keyboardType="numeric"
              value={openingCash}
              onChangeText={setOpeningCash}
            />
            <View className="absolute inset-y-0 right-0 pr-5 items-center justify-center z-10">
              <Text className="text-2xl font-bold text-brand-orange">VND</Text>
            </View>
          </View>
          <Text className="text-xs text-slate-500 italic ml-1">
            * Nhập tổng số tiền mặt hiện có tại quầy khi bắt đầu
          </Text>
        </View>

        {__DEV__ && (
          <View className="p-3 rounded-2xl border border-dashed border-brand-orange/40 bg-orange-50 gap-2">
            <Text className="text-[10px] font-black text-brand-orange uppercase tracking-widest text-center">
              Dev only
            </Text>
            <Button
              label="Mở ca nhanh (500.000đ)"
              onPress={handleDevQuickOpen}
              disabled={isPending || !staffId}
              loading={isPending}
              className="h-12 bg-brand-orange border-0"
              textClassName="text-white text-sm font-bold"
            />
          </View>
        )}
      </ScrollView>

      <View
        style={{ paddingBottom: Math.max(insets.bottom, 20) }}
        className="p-4 bg-white/80 border-t border-slate-100"
      >
        <Button
          label="BẮT ĐẦU CA TRỰC"
          onPress={handleStartShift}
          disabled={isButtonDisabled}
          loading={isPending}
          leftIcon={LucidePlay}
          className="h-16"
          textClassName="text-white font-black text-lg"
        />
      </View>
    </KeyboardAvoidingView>
  );
};
