import { Button } from '@/shared/components/ui'
import { useAppStore } from '@/shared/features/app'
import { AuthAPI, AuthCard, AuthScreen } from '@/shared/features/auth'
import { toast } from '@/shared/store/use-alert-store'
import { toastQueue } from '@/shared/utils/toast.util'
import { useState } from 'react'

export default function DeviceLockedScreen() {
  const [busy, setBusy] = useState(false)
  const appService = useAppStore((s) => s.appService)

  const onRecheck = async () => {
    setBusy(true)
    try {
      const ctx = await AuthAPI.getDeviceContext()
      if (ctx.isActive) {
        appService?.send({ type: 'DEVICE_UNLOCKED' })
      } else {
        toastQueue.show({
          type: 'warning',
          text1: 'Vẫn bị khóa',
          text2: 'Liên hệ quản trị để mở lại thiết bị.',
        })
      }
    } catch {
      toastQueue.show({
        type: 'error',
        text1: 'Không kiểm tra được',
        text2: 'Kiểm tra mạng và thử lại.',
      })
    } finally {
      setBusy(false)
    }
  }

  const onResetDevice = () => {
    toast.confirm({
      title: 'Xóa kích hoạt thiết bị?',
      message: 'Máy sẽ về trạng thái chưa kích hoạt. Cần mã license để kích hoạt lại.',
      confirmLabel: 'Xóa kích hoạt',
      destructive: true,
      onConfirm: () => appService?.send({ type: 'DEVICE_RESET' }),
    })
  }

  return (
    <AuthScreen
      title="Thiết bị bị khóa"
      subtitle="Server đã vô hiệu hóa thiết bị này. Liên hệ admin hoặc kiểm tra lại sau khi được mở."
      centered
    >
      <AuthCard>
        <Button
          label="Kiểm tra lại"
          onPress={onRecheck}
          disabled={busy}
          loading={busy}
          className="h-14 rounded-xl px-6"
          textClassName="text-base font-bold"
        />
        <Button
          label="Xóa kích hoạt (máy khác)"
          variant="outline"
          onPress={onResetDevice}
          disabled={busy}
          className="h-14 rounded-xl border-slate-200 bg-white px-6"
          textClassName="text-sm text-slate-700"
        />
      </AuthCard>
    </AuthScreen>
  )
}
