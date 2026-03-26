import { SHADOW } from '@/shared/constants'
import { cn } from '@/shared/utils'
import { View, ViewProps } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface CardProps extends ViewProps {
  /**
   * If true, applies padding to respect the device's safe area insets (notch, home indicator, etc.).
   * Useful for top-level screens or modals.
   */
  safeArea?: boolean
  /**
   * If true, centers the children content both vertically and horizontally.
   */
  centered?: boolean
  /**
   * If true, applies a shadow effect to the container.
   * Defaults to `true`.
   */
  shadow?: boolean
}

/**
 * A wrapper component that provides basic layout styling, including background color and padding.
 * It supports safe area handling and content centering via props.
 */
export const Card = ({
  children,
  className,
  shadow = false,
  safeArea = false,
  centered = false,
  ...props
}: CardProps) => {
  const insets = useSafeAreaInsets()

  return (
    <View
      className={cn(
        'bg-white rounded-2xl',
        'border border-slate-100',
        centered && 'items-center justify-center',
        className,
      )}
      style={[
        safeArea && {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
        shadow && SHADOW.bottom,
        props.style,
      ]}
      {...props}
    >
      {children}
    </View>
  )
}