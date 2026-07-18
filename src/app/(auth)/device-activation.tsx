import { Button } from '@/shared/components/ui'
import { COLORS } from '@/shared/constants'
import { useAppStore } from '@/shared/features/app'
import {
  AuthAPI,
  applyLocalBootstrap,
  AuthCard,
  AuthDevBox,
  AuthScreen,
} from '@/shared/features/auth'
import { toastQueue } from '@/shared/utils/toast.util'
import { useState } from 'react'
import { Text, TextInput, View } from 'react-native'

export default function DeviceActivationScreen() {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const appService = useAppStore((s) => s.appService)

  const activateWith = async (raw: string) => {
    const trimmed = raw.trim()
    if (trimmed.length < 4) {
      setError('Nhập mã kích hoạt (tối thiểu 4 ký tự)')
      return
    }
    if (busy) return
    setBusy(true)
    setError(null)
    setCode(trimmed)
    try {
      const device = await AuthAPI.activateDevice({ code: trimmed })

      if (device.licenseType === 'offline') {
        const bootstrap = await AuthAPI.getOfflineBootstrap()
        await applyLocalBootstrap(bootstrap)
      }

      appService?.send({ type: 'DEVICE_ACTIVATED', device })
      toastQueue.show({
        type: 'success',
        text1: 'Kích hoạt thành công',
        text2:
          device.licenseType === 'offline'
            ? 'Offline — chọn NV local'
            : 'Online — đăng nhập NV',
      })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Kích hoạt thất bại'
      setError(msg)
      toastQueue.show({ type: 'error', text1: 'Lỗi', text2: msg })
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthScreen
      title="Kích hoạt thiết bị"
      subtitle="Nhập mã license được cấp cho bãi xe."
      centered
    >
      <AuthCard>
        <Text className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
          Mã kích hoạt
        </Text>
        <TextInput
          value={code}
          onChangeText={(t) => {
            setCode(t)
            setError(null)
          }}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="VD: OFF-DEMO"
          placeholderTextColor={COLORS.slate[400]}
          className="h-12 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-base font-bold text-slate-900 tracking-widest"
          editable={!busy}
          onSubmitEditing={() => activateWith(code)}
          returnKeyType="done"
          accessibilityLabel="Mã kích hoạt"
        />
        {error ? <Text className="text-xs font-medium text-red-500">{error}</Text> : null}

        <Button
          label={busy ? 'Đang kích hoạt…' : 'Kích hoạt'}
          onPress={() => activateWith(code)}
          disabled={busy || code.trim().length < 4}
          loading={busy}
          className="h-12 rounded-xl px-6"
          textClassName="text-base font-bold"
        />
      </AuthCard>

      {__DEV__ ? (
        <AuthDevBox>
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button
                label="Offline"
                onPress={() => activateWith('OFF-DEMO')}
                disabled={busy}
                loading={busy}
                className="h-11 bg-brand-green border-brand-green rounded-xl px-4"
                textClassName="text-sm font-bold"
              />
            </View>
            <View className="flex-1">
              <Button
                label="Online"
                onPress={() => activateWith('ON-DEMO')}
                disabled={busy}
                loading={busy}
                className="h-11 rounded-xl px-4"
                textClassName="text-sm font-bold"
              />
            </View>
          </View>
        </AuthDevBox>
      ) : null}
    </AuthScreen>
  )
}
