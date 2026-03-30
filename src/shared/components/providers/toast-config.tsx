import { COLORS } from '@/shared/constants'
import { AlertCircle, Check, Info, X } from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import { Text, View } from 'react-native'
import { BaseToastProps } from 'react-native-toast-message'

interface ToastProps extends BaseToastProps {
  text1?: string
  text2?: string
}

const ToastContent = ({
  type,
  text1,
  text2,
  icon: Icon,
  color,
}: {
  type: 'success' | 'error' | 'warning' | 'info'
  text1?: string
  text2?: string
  icon: any
  color: string
}) => {
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'

  // Determine title color based on type
  // Success/Error/Warning: use the specific color
  // Info: use adaptive theme text color (Black/White)
  const titleColor =
    type === 'info' ? (isDark ? COLORS.text.primary.white : COLORS.text.primary.black) : color

  return (
    <View
      className="mt-4 w-[90%] flex-row items-center rounded-lg border-l-4 bg-white p-4 shadow-sm shadow-black/5 dark:bg-slate-800"
      style={{ borderLeftColor: color }}
    >
      <View
        className="mr-3 h-8 w-8 items-center justify-center rounded-full"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon size={16} color={color} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-bold" style={{ color: titleColor }}>
          {text1}
        </Text>
        {text2 ? (
          <Text
            className="mt-0.5 text-sm"
            style={{
              color: COLORS.text.secondary,
              opacity: isDark ? 0.8 : 1,
            }}
          >
            {text2}
          </Text>
        ) : null}
      </View>
    </View>
  )
}

export const toastConfig = {
  success: (props: ToastProps) => (
    <ToastContent type="success" {...props} icon={Check} color={COLORS.brand.green} />
  ),

  error: (props: ToastProps) => (
    <ToastContent type="error" {...props} icon={X} color={COLORS.brand.red} />
  ),

  warning: (props: ToastProps) => (
    <ToastContent type="warning" {...props} icon={AlertCircle} color={COLORS.brand.orange} />
  ),

  info: (props: ToastProps) => (
    <ToastContent type="info" {...props} icon={Info} color={COLORS.brand.blue} />
  ),
}
