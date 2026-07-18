import { SHADOW } from '@/shared/constants'
import { cn } from '@/shared/utils'
import { ReactNode } from 'react'
import { Text, View, ViewProps } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export interface CardProps extends ViewProps {
  /** Section label (10px uppercase) above content */
  title?: string
  /** Right side of title row (badge, action, …) */
  titleRight?: ReactNode
  /** Content centering */
  centered?: boolean
  /** Safe-area padding (full-screen shells) */
  safeArea?: boolean
  /** Optional elevation — default off */
  shadow?: boolean
  /** Disable default p-4 */
  noPadding?: boolean
  children?: ReactNode
  className?: string
}

/**
 * App surface card — white / slate-200 / rounded-lg.
 * Use for settings blocks, stats panels, auth forms, etc.
 */
export const Card = ({
  children,
  className,
  title,
  titleRight,
  shadow = false,
  safeArea = false,
  centered = false,
  noPadding = false,
  style,
  ...props
}: CardProps) => {
  const insets = useSafeAreaInsets()

  return (
    <View
      className={cn(
        'bg-white rounded-lg border border-slate-200',
        !noPadding && 'p-4',
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
        shadow ? SHADOW.bottom : undefined,
        style,
      ]}
      {...props}
    >
      {(title || titleRight) && (
        <View
          className={cn(
            'flex-row items-center justify-between',
            children != null ? 'mb-3' : null,
          )}
        >
          {title ? (
            <Text className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
              {title}
            </Text>
          ) : (
            <View />
          )}
          {titleRight}
        </View>
      )}
      {children}
    </View>
  )
}
