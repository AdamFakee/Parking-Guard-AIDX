import { AppHeader, Button } from '@/shared/components/ui';
import { SystemConfigModal, SystemConfigModalRef } from '@/shared/features/gate/components';
import { useShiftStore } from '@/shared/features/shift';
import { ShiftHistoryModal, ShiftHistoryModalRef } from '@/shared/features/shift/components';
import { CloseShiftModal, CloseShiftModalRef } from '@/shared/features/shift/components/close-shift-modal';
import { useAuthStore } from '@/shared/store';
import { useSyncStore } from '@/shared/features/sync/store/use-sync-store';
import { syncManager } from '@/shared/features/sync/services/sync-manager';
import NetInfo from '@react-native-community/netinfo';
import { useRouter } from 'expo-router';
import {
  CloudUpload,
  History,
  LogOut,
  Settings2,
  User,
  Users
} from 'lucide-react-native';
import React, { useRef } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  View
} from 'react-native';

import { toastQueue } from '@/shared/utils/toast.util';

export default function SettingsScreen() {
  const router = useRouter();
  const logoutAuth = useAuthStore((state) => state.logout);
  const { currentShift } = useShiftStore();
  const modalRef = useRef<CloseShiftModalRef>(null);
  const configModalRef = useRef<SystemConfigModalRef>(null);
  const historyModalRef = useRef<ShiftHistoryModalRef>(null);
  const { isSyncing, lastSyncTime } = useSyncStore();
  
  const isStaff = currentShift?.role === 'staff';
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

  const handleCloseShift = () => {
    modalRef.current?.open();
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('vi-VN') + ' đ';
  };

  const handleManualSync = async () => {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      toastQueue.show({
        type: 'warning',
        text1: 'Không có mạng',
        text2: 'Vui lòng kiểm tra kết nối internet để đồng bộ dữ liệu.',
      });
      return;
    }

    try {
      await syncManager.startSync();
      toastQueue.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'Dữ liệu đã được đồng bộ lên Google Drive.',
      });
    } catch (error) {
      toastQueue.show({
        type: 'error',
        text1: 'Thất bại',
        text2: 'Có lỗi xảy ra trong quá trình đồng bộ.',
      });
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <AppHeader title="Cài đặt" showLeftButton={false}/>

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

        {/* Admin Settings */}
        {!isStaff && (
          <View className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm mb-4">
            <Button
              label="Cấu hình hệ thống"
              variant="outline"
              className="border-b border-slate-100 rounded-none h-14"
              leftIcon={Settings2}
              onPress={() => configModalRef.current?.open()}
            />
            <Button
              label="Quản lý nhân viên"
              variant="outline"
              className="border-b border-slate-100 rounded-none h-14"
              leftIcon={Users}
              onPress={() => router.push('/settings/staff-management' as any)}
            />
            <Button
              label="Lịch sử ca làm"
              variant="outline"
              className="border-0 rounded-none h-14"
              leftIcon={History}
              onPress={() => historyModalRef.current?.open()}
            />
          </View>
        )}

        {/* Sync Data Section */}
        <View className="bg-white p-4 rounded-xl border border-slate-100 mb-4 shadow-sm">
          <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Dữ liệu & Đồng bộ</Text>
          <Button
            label={isSyncing ? "Đang đồng bộ..." : "Đồng bộ lên Google Drive"}
            loading={isSyncing}
            variant="primary"
            leftIcon={CloudUpload}
            onPress={handleManualSync}
            className="h-12 rounded-lg"
          />
          {lastSyncTime && (
            <Text className="text-center text-slate-400 text-xs mt-2">
              Đồng bộ lần cuối: {lastSyncTime.toLocaleString()}
            </Text>
          )}
        </View>

        {/* Actions */}
        <View className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm mb-6">
          <Button
            label="Kết thúc ca làm"
            variant="outline"
            className="border-0 rounded-none h-14"
            textClassName="text-red-500 font-bold"
            leftIcon={LogOut}
            onPress={handleCloseShift}
          />
        </View>
      </ScrollView>

      {/* RA CA MODAL - Managed via Ref */}
      <CloseShiftModal ref={modalRef} />
      <SystemConfigModal ref={configModalRef} />
      <ShiftHistoryModal ref={historyModalRef} />
    </View>
  );
}
