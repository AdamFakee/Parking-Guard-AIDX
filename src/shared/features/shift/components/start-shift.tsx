import { Button } from '@/shared/components/ui'
import { COLORS } from '@/shared/constants/color.const'
import { useAppContext } from '@/shared/features/app/hooks/use-app-context'
import { useAppStore } from '@/shared/features/app/store/use-app-store'
import type { Employee } from '@/shared/features/app'
import { AuthCard, AuthDevBox, AuthScreen } from '@/shared/features/auth'
import { toast } from '@/shared/store/use-alert-store'
import { useLocalSearchParams } from 'expo-router'
import { LucidePlay } from 'lucide-react-native'
import React, { useState } from 'react'
import { Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useStartShift } from '../hooks'
import { useShiftStore } from '../store'

export const StartShift = () => {
  const insets = useSafeAreaInsets()
  const { staffId, name, role } = useLocalSearchParams<{
    staffId: string
    name: string
    role: 'admin' | 'staff'
  }>()
  const ctx = useAppContext()
  const appService = useAppStore((s) => s.appService)
  const [openingCash, setOpeningCash] = useState('')

  const { mutate: startShift, isPending } = useStartShift()
  const setCurrentShift = useShiftStore((state) => state.setCurrentShift)

  const resolvedStaffId = staffId || ctx.employee?.id
  const resolvedName = name || ctx.employee?.displayName || ''
  const resolvedRole = (role || ctx.employee?.role || 'staff') as 'admin' | 'staff'

  const onOpened = (data: {
    id: string
    staffId: string
    openingCash: number
    startTime: Date
    status: string | null
  }) => {
    setCurrentShift({
      id: data.id,
      staffId: data.staffId,
      staffName: resolvedName,
      openingCash: data.openingCash,
      startTime: data.startTime.toISOString(),
      status: data.status as 'open' | 'closed',
      role: resolvedRole,
    })

    const employee: Employee = {
      id: data.staffId,
      employeeCode: resolvedName,
      displayName: resolvedName,
      role: resolvedRole,
      status: 'active',
    }

    if (!appService?.getSnapshot().context.employee) {
      const device = appService?.getSnapshot().context.device
      if (device) {
        appService.send({
          type: 'LOGIN_SUCCESS',
          accessToken: 'local',
          employee,
          device,
        })
      }
    }
    appService?.send({ type: 'SHIFT_OPENED', cashSessionId: data.id })
  }

  const openShift = (cash: number) => {
    if (!resolvedStaffId || isPending) return
    startShift(
      { staffId: resolvedStaffId, openingCash: cash },
      {
        onSuccess: onOpened,
        onError: (err: unknown) => {
          console.error('Failed to start shift:', err)
        },
      },
    )
  }

  const handleStartShift = () => {
    const cash = Number(openingCash)
    if (!openingCash || isNaN(cash) || cash <= 0 || !resolvedStaffId) return

    toast.confirm({
      title: 'Xác nhận mở ca',
      message: `${resolvedName || 'NV'} · tiền đầu ca ${cash.toLocaleString('vi-VN')} đ`,
      confirmLabel: 'Mở ca',
      onConfirm: () => openShift(cash),
    })
  }

  const isButtonDisabled = !openingCash || Number(openingCash) <= 0 || isPending

  const handleDevQuickOpen = () => {
    if (!resolvedStaffId || isPending) return
    const cash = 500_000
    setOpeningCash(String(cash))
    openShift(cash)
  }

  return (
    <View className="flex-1 bg-slate-50">
      <AuthScreen
        title="Mở ca trực"
        subtitle={`${resolvedName || '---'} · ${
          resolvedRole === 'admin' ? 'Quản trị' : 'Nhân viên'
        }`}
      >
        <AuthCard>
          <Text className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
            Tiền mặt đầu ca
          </Text>
          <View>
            <TextInput
              className="w-full h-16 px-4 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-3xl font-extrabold text-slate-900 font-mono"
              placeholder="0"
              placeholderTextColor={COLORS.slate[400]}
              keyboardType="numeric"
              value={openingCash}
              onChangeText={setOpeningCash}
              accessibilityLabel="Tiền mặt đầu ca"
            />
            <View className="absolute right-4 top-0 bottom-0 justify-center">
              <Text className="text-base font-bold text-slate-400">đ</Text>
            </View>
          </View>
          <Text className="text-xs text-slate-500">
            Tổng tiền mặt tại quầy khi bắt đầu ca.
          </Text>
        </AuthCard>

        {__DEV__ ? (
          <AuthDevBox>
            <Button
              label="Mở ca nhanh (500.000đ)"
              onPress={handleDevQuickOpen}
              disabled={isPending || !resolvedStaffId}
              loading={isPending}
              className="h-11 bg-brand-orange border-brand-orange rounded-xl px-4"
              textClassName="text-white text-sm font-bold"
            />
          </AuthDevBox>
        ) : null}
      </AuthScreen>

      <View
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        className="px-5 pt-3 pb-1 bg-white border-t border-slate-200"
      >
        <Button
          label="Bắt đầu ca trực"
          onPress={handleStartShift}
          disabled={isButtonDisabled}
          loading={isPending}
          leftIcon={LucidePlay}
          className="h-14 rounded-xl px-6"
          textClassName="text-base font-bold"
        />
      </View>
    </View>
  )
}
