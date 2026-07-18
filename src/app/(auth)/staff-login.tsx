import { Button } from '@/shared/components/ui'
import { ControlledInput } from '@/shared/components/ui/form/controlled-input'
import { ControlledPasswordInput } from '@/shared/components/ui/form/controlled-password-input'
import { useAppStore, useLicense, type Employee } from '@/shared/features/app'
import {
  applyLocalBootstrap,
  AuthAPI,
  AuthCard,
  AuthDevBox,
  AuthScreen,
  LoginSchema,
  type TLoginForm,
} from '@/shared/features/auth'
import { getAllStaff } from '@/shared/features/shift/apis/staff.api'
import { toastQueue } from '@/shared/utils/toast.util'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { useForm } from 'react-hook-form'
import { Text } from 'react-native'

export default function StaffLoginScreen() {
  const { device, isOffline } = useLicense()
  const appService = useAppStore((s) => s.appService)
  const saveRefreshToken = useAppStore((s) => s.saveRefreshToken)

  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting, errors },
  } = useForm<TLoginForm>({
    resolver: valibotResolver(LoginSchema),
    defaultValues: {
      employeeCode: __DEV__ ? (isOffline ? 'Admin' : '0901234567') : '',
      pin: __DEV__ ? '1234' : '',
    },
  })

  const loginOffline = async (data: TLoginForm): Promise<Employee> => {
    const code = data.employeeCode.trim().toLowerCase()
    const list = await getAllStaff()
    const match = list.find((s) => {
      const pinOk = s.pinHash === data.pin
      const codeOk =
        s.name.toLowerCase() === code ||
        s.id.toLowerCase() === code ||
        s.name.toLowerCase().includes(code)
      return pinOk && codeOk
    })
    if (!match) throw new Error('Mã NV hoặc PIN không đúng')
    return {
      id: match.id,
      employeeCode: match.name,
      displayName: match.name,
      role: match.role,
      status: 'active',
    }
  }

  const onSubmit = async (data: TLoginForm) => {
    try {
      if (!device?.id) throw new Error('Thiết bị chưa kích hoạt')

      if (isOffline) {
        const employee = await loginOffline(data)
        appService?.send({
          type: 'LOGIN_SUCCESS',
          accessToken: 'local',
          employee,
          device,
        })
        return
      }

      const res = await AuthAPI.login({
        deviceId: device.id,
        employeeCode: data.employeeCode,
        pin: data.pin,
      })
      saveRefreshToken(res.refreshToken)
      await applyLocalBootstrap(res.bootstrap)
      appService?.send({
        type: 'LOGIN_SUCCESS',
        accessToken: res.accessToken,
        employee: res.employee,
        device: {
          ...device,
          ...res.device,
          licenseType: device.licenseType,
          expiredAt: res.device.expiredAt || device.expiredAt,
          lotName: res.device.lotName || device.lotName,
        },
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Đăng nhập thất bại'
      setError('root', { type: 'server', message })
      toastQueue.show({ type: 'error', text1: 'Lỗi', text2: message })
    }
  }

  return (
    <AuthScreen
      title="Đăng nhập"
      centered
    >
      <AuthCard>
        <ControlledInput
          control={control}
          name="employeeCode"
          label={isOffline ? 'Tên / mã nhân viên' : 'SĐT / mã NV'}
          autoCapitalize="none"
          className="h-12 rounded-xl text-base"
        />
        <ControlledPasswordInput
          control={control}
          name="pin"
          label="Mã PIN"
          keyboardType="number-pad"
          className="h-12 rounded-xl text-base"
        />

        {errors.root?.message ? (
          <Text className="text-xs font-medium text-red-500">{errors.root.message}</Text>
        ) : null}

        <Button
          label={'Đăng nhập'}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          loading={isSubmitting}
        />
      </AuthCard>

      {__DEV__ ? (
        <AuthDevBox>
          <Button
            label={isOffline ? 'Admin + 1234' : 'Điền form demo'}
            variant="outline"
            onPress={() =>
              onSubmit({
                employeeCode: isOffline ? 'Admin' : '0901234567',
                pin: '1234',
              })
            }
            disabled={isSubmitting}
            className="h-11 rounded-xl border-orange-300 bg-white px-4"
            textClassName="text-sm text-slate-700"
          />
        </AuthDevBox>
      ) : null}
    </AuthScreen>
  )
}
