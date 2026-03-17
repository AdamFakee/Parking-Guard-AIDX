import { AppHeader, Button } from '@/shared/components/ui';
import { CloseShiftModal, CloseShiftModalRef } from '@/shared/features/shift/components/close-shift-modal';
import { useShiftStore } from '@/shared/features/shift';
import { useAuthStore } from '@/shared/store';
import { useRouter } from 'expo-router';
import {
  LogOut,
  User
} from 'lucide-react-native';
import React, { useRef } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  View
} from 'react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const logoutAuth = useAuthStore((state) => state.logout);
  const { currentShift } = useShiftStore();
  const modalRef = useRef<CloseShiftModalRef>(null);
  
  const isStaff = currentShift?.staffName?.toLowerCase().includes('staff') || true;
  const openingCash = currentShift?.openingCash || 0;

  const handleLogoutAdmin = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: 'Đăng xuất', 
        onPress: () => {
          logoutAuth();
          router.replace('/auth/login' as any);
        }
      },
    ]);
  };

  const handleRaCa = () => {
    modalRef.current?.open();
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('vi-VN') + ' đ';
  };

  return (
    <View className="flex-1 bg-slate-50">
      <AppHeader title="Cài đặt" />

      <ScrollView className="flex-1 p-4">
        {/* User Profile Info */}
        <View className="bg-white p-4 rounded-xl border border-slate-100 mb-4 shadow-sm">
          <View className="flex-row items-center gap-4">
            <View className="size-14 rounded-full bg-blue-500 items-center justify-center">
              <User color="white" size={32} />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-slate-900">{currentShift?.staffName || 'Admin'}</Text>
              <Text className="text-slate-400 text-sm">Vai trò: {isStaff ? 'Nhân viên' : 'Quản trị viên'}</Text>
            </View>
          </View>
        </View>

        {/* Shift Info (If Staff) */}
        {isStaff && currentShift && (
          <View className="bg-white p-4 rounded-xl border border-slate-100 mb-4 shadow-sm">
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Thông tin ca làm</Text>
            <View className="flex-col gap-3">
              <View className="flex-row justify-between">
                <Text className="text-slate-500">Bắt đầu</Text>
                <Text className="font-semibold">{new Date(currentShift.startTime).toLocaleString()}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-slate-500">Tiền đầu ca</Text>
                <Text className="font-semibold text-blue-600">{formatCurrency(openingCash)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Actions */}
        <View className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm mb-6">
          <Button
            label={isStaff ? "Kết thúc ca làm (Ra ca)" : "Đăng xuất tài khoản"}
            variant="outline"
            className="border-0 rounded-none h-14"
            textClassName="text-red-500 font-bold"
            leftIcon={LogOut}
            onPress={() => isStaff ? handleRaCa() : handleLogoutAdmin()}
          />
        </View>
      </ScrollView>

      {/* RA CA MODAL - Managed via Ref */}
      <CloseShiftModal ref={modalRef} />
    </View>
  );
}
