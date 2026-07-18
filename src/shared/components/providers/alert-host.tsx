import { Button } from '@/shared/components/ui'
import { COLORS } from '@/shared/constants'
import { useAlertStore } from '@/shared/store/use-alert-store'
import { AlertCircle, Check, Info, X } from 'lucide-react-native'
import { Modal, Pressable, Text, View } from 'react-native'

const ICONS = {
  success: Check,
  error: X,
  warning: AlertCircle,
  info: Info,
} as const

const ICON_COLOR = {
  success: COLORS.brand.green,
  error: COLORS.brand.red,
  warning: COLORS.brand.orange,
  info: COLORS.brand.blue,
} as const

/** Mount 1 lần ở root _layout — dialog confirm/info global. */
export function AlertHost() {
  const visible = useAlertStore((s) => s.visible)
  const type = useAlertStore((s) => s.type)
  const title = useAlertStore((s) => s.title)
  const message = useAlertStore((s) => s.message)
  const popupType = useAlertStore((s) => s.popupType)
  const confirmLabel = useAlertStore((s) => s.confirmLabel)
  const cancelLabel = useAlertStore((s) => s.cancelLabel)
  const destructive = useAlertStore((s) => s.destructive)
  const onConfirm = useAlertStore((s) => s.onConfirm)
  const onCancel = useAlertStore((s) => s.onCancel)
  const hide = useAlertStore((s) => s.hide)

  const Icon = ICONS[type]
  const color = ICON_COLOR[type]
  const isConfirm = popupType === 'confirm'

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (isConfirm) onCancel?.()
        else hide()
      }}
    >
      <Pressable
        className="flex-1 bg-black/50 items-center justify-center px-6"
        onPress={() => {
          if (isConfirm) onCancel?.()
          else hide()
        }}
      >
        <Pressable
          className="w-full max-w-md rounded-2xl bg-white p-5 border border-slate-200"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="flex-row items-start gap-3 mb-4">
            <View
              className="size-10 rounded-full items-center justify-center"
              style={{ backgroundColor: `${color}20` }}
            >
              <Icon size={20} color={color} />
            </View>
            <View className="flex-1 min-w-0 pt-0.5">
              <Text className="text-lg font-extrabold text-slate-900 tracking-tight">
                {title}
              </Text>
              {message ? (
                <Text className="mt-1.5 text-sm text-slate-500 leading-5">{message}</Text>
              ) : null}
            </View>
          </View>

          <View className={isConfirm ? 'flex-row gap-2' : undefined}>
            {isConfirm ? (
              <View className="flex-1">
                <Button
                  label={cancelLabel}
                  variant="outline"
                  onPress={() => onCancel?.()}
                  className="h-12 rounded-xl border-slate-200 bg-white px-4"
                  textClassName="text-sm font-bold text-slate-700"
                />
              </View>
            ) : null}
            <View className={isConfirm ? 'flex-1' : undefined}>
              <Button
                label={confirmLabel}
                onPress={() => onConfirm?.()}
                className={`h-12 rounded-xl px-4 ${
                  destructive ? 'bg-brand-red border-brand-red' : ''
                }`}
                textClassName="text-sm font-bold"
              />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
