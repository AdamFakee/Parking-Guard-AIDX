import { COLORS } from '@/shared/constants';
import { useRouter } from 'expo-router';
import { ChevronRight, Crown, UserCircle } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

/**
 * RoleSelection component allows users to choose their access role (Owner or Staff).
 * Tailored to match the provided ParkGuard design.
 */
export const RoleSelection = () => {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background-light items-center justify-center">
      <ScrollView 
        contentContainerStyle={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} 
        className="px-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-20 pb-6">
          <Text className="text-slate-900 dark:text-slate-100 text-3xl font-bold tracking-tight">
            Chọn vai trò truy cập
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 mt-2 text-base leading-relaxed">
            Vui lòng chọn tài khoản phù hợp với nhiệm vụ của bạn để tiếp tục.
          </Text>
        </View>

        <View className="flex flex-col gap-5 mt-4">
          {/* Owner Role Card */}
          <Pressable 
            className="flex flex-col w-full rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm active:opacity-80 active:border-primary/50 transition-all"
          >
            <View className="flex-row items-center justify-between w-full mb-5">
              <View className="size-14 items-center justify-center rounded-2xl bg-primary/10">
                <Crown size={32} color={COLORS.brand.blue} />
              </View>
              <View className="text-slate-300 dark:text-slate-600">
                <ChevronRight size={24} color={COLORS.slate[200]} />
              </View>
            </View>
            <View>
              <Text className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight">
                Chủ bãi xe
              </Text>
              <Text className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-normal leading-normal">
                Quản lý doanh thu, xem báo cáo chi tiết & cài đặt hệ thống
              </Text>
            </View>
          </Pressable>

          {/* Staff Role Card */}
          <Pressable 
            onPress={() => router.push('/(auth)/select-staff')}
            className="flex flex-col w-full rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm active:opacity-80 active:border-primary/50 transition-all"
          >
            <View className="flex-row items-center justify-between w-full mb-5">
              <View className="size-14 items-center justify-center rounded-2xl bg-primary/10">
                <UserCircle size={32} color={COLORS.brand.blue} />
              </View>
              <View className="text-slate-300 dark:text-slate-600">
                <ChevronRight size={24} color={COLORS.slate[200]} />
              </View>
            </View>
            <View>
              <Text className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight">
                Nhân viên trực
              </Text>
              <Text className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-normal leading-normal">
                Check-in/out cho khách hàng, giám sát bãi & thu phí trực tiếp
              </Text>
            </View>
          </Pressable>
        </View>

        <View className="mt-auto py-8">
          <Text className="text-center text-slate-400 dark:text-slate-500 text-xs">
            Bạn gặp khó khăn khi đăng nhập?{' '}
            <Text className="text-primary font-semibold">Liên hệ hỗ trợ</Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};
