import { AppHeader } from '@/shared/components/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LucidePlay, LucideUser } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useStartShift } from '../hooks';
import { useShiftStore } from '../store';

export const StartShift = () => {
  const router = useRouter();
  const { staffId, name } = useLocalSearchParams<{ staffId: string; name: string }>();
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

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-50"
    >
      <AppHeader title="Mở ca trực" variant="white" onLeftPress={() => router.back()} />
      
      <ScrollView className="flex-1 p-4" contentContainerStyle={{ gap: 24 }}>
        {/* Staff Info Card */}
        <View className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-blue-500 flex-row items-center">
          <View className="w-12 h-12 rounded-full bg-slate-100 items-center justify-center">
            <LucideUser size={24} color="#3B82F6" />
          </View>
          <View className="ml-4">
            <Text className="text-xs text-slate-500 font-medium">Nhân viên trực</Text>
            <Text className="text-lg font-bold text-slate-800">{name}</Text>
          </View>
        </View>

        {/* Cash Input Section */}
        <View className="gap-3">
          <Text className="text-sm font-semibold text-slate-700 ml-1">
            Tiền mặt đầu ca <Text className="text-red-500 font-normal">(bắt buộc)</Text>
          </Text>
          <View className="relative">
            <View className="absolute inset-y-0 left-0 pl-5 items-center justify-center z-10">
              <Text className="text-2xl font-bold text-orange-500">₫</Text>
            </View>
            <TextInput
              className="w-full pl-12 pr-4 py-5 bg-white border-2 border-slate-200 rounded-2xl focus:border-green-500 text-3xl font-bold text-slate-800"
              placeholder="0"
              keyboardType="numeric"
              value={openingCash}
              onChangeText={setOpeningCash}
            />
          </View>
          <Text className="text-xs text-slate-500 italic ml-1">
            * Nhập tổng số tiền mặt hiện có tại quầy khi bắt đầu
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View className="p-4 bg-white/80 border-t border-slate-100">
        <Pressable 
          onPress={handleStartShift}
          disabled={isButtonDisabled}
          className={`w-full py-4 bg-green-500 rounded-2xl items-center justify-center flex-row shadow-lg ${isButtonDisabled ? 'opacity-50 grayscale' : ''}`}
        >
          <LucidePlay size={20} color="white" fill="white" className="mr-2" />
          <Text className="text-white font-black text-lg tracking-wider">
            BẮT ĐẦU CA TRỰC
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};
