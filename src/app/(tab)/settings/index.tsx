import { AppHeader, Button, Card } from '@/shared/components/ui'
import { COLORS } from '@/shared/constants'
import { useAppStore, useLicense } from '@/shared/features/app'
import { AuthAPI } from '@/shared/features/auth'
import { SystemConfigModal, SystemConfigModalRef } from '@/shared/features/gate/components'
import { useShiftRole, useShiftStore } from '@/shared/features/shift'
import { ShiftHistoryModal, ShiftHistoryModalRef } from '@/shared/features/shift/components'
import { CloseShiftModal, CloseShiftModalRef } from '@/shared/features/shift/components/close-shift-modal'
import { syncManager } from '@/shared/features/sync/services/sync-manager'
import { useSyncStore } from '@/shared/features/sync/store/use-sync-store'
import { toast } from '@/shared/store/use-alert-store'
import { toastQueue } from '@/shared/utils/toast.util'
import NetInfo from '@react-native-community/netinfo'
import { useRouter } from 'expo-router'
import {
  CloudUpload,
  History,
  LogOut,
  Settings2,
  Trash2,
  Users,
} from 'lucide-react-native'
import React, { useRef } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'

function staffInitials(name?: string) {
  if (!name) return 'NV'
  return (
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(-2) || 'NV'
  )
}

export default function SettingsScreen() {
  const router = useRouter()
  const { device, isOffline: isOfflineLicense } = useLicense()
  const appService = useAppStore((s) => s.appService)
  const getRefreshToken = useAppStore((s) => s.getRefreshToken)
  const clearRefreshToken = useAppStore((s) => s.clearRefreshToken)
  const { currentShift, clearShift } = useShiftStore()
  const { isStaff } = useShiftRole()
  const modalRef = useRef<CloseShiftModalRef>(null)
  const configModalRef = useRef<SystemConfigModalRef>(null)
  const historyModalRef = useRef<ShiftHistoryModalRef>(null)
  const { isSyncing, lastSyncTime } = useSyncStore()

  const openingCash = currentShift?.openingCash || 0

  const handleLogout = () => {
    toast.confirm({
      title: 'Đăng xuất',
      message: 'Bạn có chắc chắn muốn đăng xuất?',
      confirmLabel: 'Đăng xuất',
      destructive: true,
      onConfirm: () => {
        const rt = getRefreshToken()
        if (rt) void AuthAPI.logout(rt)
        clearRefreshToken()
        clearShift()
        appService?.send({ type: 'LOGGED_OUT' })
      },
    })
  }

  const handleCloseShift = () => {
    modalRef.current?.open()
  }

  const formatCurrency = (val: number) => val.toLocaleString('vi-VN') + ' đ'

  const runManualSync = async () => {
    if (isOfflineLicense) {
      toastQueue.show({
        type: 'info',
        text1: 'Gói Offline',
        text2: 'Gói offline không đồng bộ lên cloud.',
      })
      return
    }
    const state = await NetInfo.fetch()
    if (!state.isConnected) {
      toastQueue.show({
        type: 'warning',
        text1: 'Không có mạng',
        text2: 'Vui lòng kiểm tra kết nối internet để đồng bộ dữ liệu.',
      })
      return
    }

    try {
      await syncManager.startSync()
      toastQueue.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'Dữ liệu đã được đồng bộ lên Google Drive.',
      })
    } catch {
      toastQueue.show({
        type: 'error',
        text1: 'Thất bại',
        text2: 'Có lỗi xảy ra trong quá trình đồng bộ.',
      })
    }
  }

  const handleManualSync = () => {
    if (isSyncing) return
    if (isOfflineLicense) {
      void runManualSync()
      return
    }
    toast.confirm({
      title: 'Đồng bộ Google Drive',
      message: 'Đẩy dữ liệu chưa sync lên Drive ngay bây giờ?',
      confirmLabel: 'Đồng bộ',
      onConfirm: () => void runManualSync(),
    })
  }

  return (
    <View className="flex-1 bg-slate-50">
      <AppHeader title="Cài đặt" showLeftButton={false} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <Card className="flex-row items-center gap-3">
          <View className="size-12 rounded-full bg-blue-50 border border-blue-100 items-center justify-center">
            <Text className="text-blue-500 font-extrabold text-sm">
              {staffInitials(currentShift?.staffName)}
            </Text>
          </View>
          <View className="flex-1 min-w-0">
            <Text className="text-lg font-extrabold text-slate-900" numberOfLines={1}>
              {currentShift?.staffName || '---'}
            </Text>
            <Text className="text-xs font-semibold text-slate-500 mt-0.5">
              {isStaff ? 'Nhân viên' : 'Quản trị viên'}
            </Text>
          </View>
        </Card>

        {currentShift ? (
          <Card title="Ca hiện tại" className="gap-3">
            <View className="flex-row justify-between">
              <Text className="text-sm text-slate-500">Bắt đầu</Text>
              <Text className="text-sm font-semibold text-slate-800">
                {new Date(currentShift.startTime).toLocaleString('vi-VN')}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-slate-500">Tiền đầu ca</Text>
              <Text className="text-sm font-semibold text-blue-600">
                {formatCurrency(openingCash)}
              </Text>
            </View>
          </Card>
        ) : null}

        {!isStaff ? (
          <Card noPadding className="overflow-hidden">
            <SettingsRow
              label="Cấu hình hệ thống"
              icon={Settings2}
              onPress={() => configModalRef.current?.open()}
              bordered
            />
            <SettingsRow
              label="Quản lý nhân viên"
              icon={Users}
              onPress={() => router.push('/settings/staff-management' as any)}
              bordered
            />
            <SettingsRow
              label="Lịch sử ca làm"
              icon={History}
              onPress={() => historyModalRef.current?.open()}
            />
          </Card>
        ) : null}

        {!isOfflineLicense ? (
          <Card title="Đồng bộ" className="gap-3">
            <Button
              label={isSyncing ? 'Đang đồng bộ…' : 'Đồng bộ Google Drive'}
              loading={isSyncing}
              leftIcon={CloudUpload}
              onPress={handleManualSync}
              disabled={isSyncing}
              className="h-14 rounded-xl px-6"
              textClassName="text-base font-bold"
            />
            {lastSyncTime ? (
              <Text className="text-center text-slate-400 text-xs">
                Lần cuối: {lastSyncTime.toLocaleString('vi-VN')}
              </Text>
            ) : null}
          </Card>
        ) : null}

        <Card noPadding className="overflow-hidden">
          <SettingsRow
            label="Dọn dữ liệu cũ"
            icon={Trash2}
            onPress={() => router.push('/settings/data-cleanup' as any)}
            danger
          />
        </Card>

        {device ? (
          <Card
            title="License"
            titleRight={
              <View
                className={`px-2 py-0.5 rounded-md border ${
                  isOfflineLicense
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-green-50 border-green-200'
                }`}
              >
                <Text
                  className={`text-[10px] font-bold uppercase ${
                    isOfflineLicense ? 'text-orange-500' : 'text-green-500'
                  }`}
                >
                  {isOfflineLicense ? 'Offline' : 'Online'}
                </Text>
              </View>
            }
            className="gap-2"
          >
            {device.lotName ? (
              <Text className="text-base font-extrabold text-slate-900" numberOfLines={1}>
                {device.lotName}
              </Text>
            ) : null}
            <View className="flex-row justify-between">
              <Text className="text-sm text-slate-500">Mã thiết bị</Text>
              <Text className="text-sm font-semibold text-slate-800 font-mono">
                {device.deviceCode}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-slate-500">HSD</Text>
              <Text className="text-sm font-semibold text-slate-800">
                {new Date(device.expiredAt).toLocaleDateString('vi-VN')}
              </Text>
            </View>
          </Card>
        ) : null}

        <Card noPadding className="overflow-hidden">
          <SettingsRow
            label="Kết thúc ca làm"
            icon={LogOut}
            onPress={handleCloseShift}
            danger
            bordered={!isOfflineLicense}
          />
          {!isOfflineLicense ? (
            <SettingsRow label="Đăng xuất" onPress={handleLogout} danger />
          ) : null}
        </Card>
      </ScrollView>

      <CloseShiftModal ref={modalRef} />
      <SystemConfigModal ref={configModalRef} />
      <ShiftHistoryModal ref={historyModalRef} />
    </View>
  )
}

function SettingsRow({
  label,
  icon: Icon,
  onPress,
  bordered,
  danger,
}: {
  label: string
  icon?: React.ComponentType<{ size?: number; color?: string }>
  onPress: () => void
  bordered?: boolean
  danger?: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      className={`min-h-14 px-4 py-3 flex-row items-center gap-3 ${
        bordered ? 'border-b border-slate-100' : ''
      }`}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      {Icon ? (
        <Icon size={20} color={danger ? COLORS.brand.red : COLORS.brand.blue} />
      ) : null}
      <Text
        className={`flex-1 text-base font-semibold ${
          danger ? 'text-red-500' : 'text-slate-800'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  )
}
