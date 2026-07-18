import { Card } from '@/shared/components/ui'
import { cn } from '@/shared/utils'
import { ReactNode } from 'react'
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const logo = require('@/assets/images/logo.png')

type AuthScreenProps = {
  title: string
  subtitle?: string
  badge?: ReactNode
  children: ReactNode
  footer?: ReactNode
  /** Center content vertically (locked / short screens) */
  centered?: boolean
}

/** Light auth chrome: logo + title + white card area. Matches app slate-50 DNA. */
export function AuthScreen({
  title,
  subtitle,
  badge,
  children,
  footer,
  centered,
}: AuthScreenProps) {
  const insets = useSafeAreaInsets()

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: Math.max(insets.bottom, 12) + 16,
            justifyContent: centered ? 'center' : 'flex-start',
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center mb-5">
            <Image
              source={logo}
              style={{ width: 56, height: 56 }}
              resizeMode="contain"
              accessibilityLabel="Parking Guard"
            />
            <Text className="mt-2 text-sm font-extrabold text-slate-900 tracking-tight">
              Parking Guard
            </Text>
          </View>

          <Text className="text-xl font-extrabold text-slate-900 text-center tracking-tight">
            {title}
          </Text>
          {subtitle ? (
            <Text className="mt-1.5 text-sm text-slate-500 text-center leading-5 px-2">
              {subtitle}
            </Text>
          ) : null}
          {badge ? <View className="mt-2.5 items-center">{badge}</View> : null}

          <View className={cn('mt-5', centered && 'w-full')}>{children}</View>
          {footer ? <View className="mt-3">{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

export function AuthCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <Card className={cn('gap-3', className)}>{children}</Card>
}

export function AuthDevBox({ children }: { children: ReactNode }) {
  return (
    <View className="mt-3 p-2.5 rounded-xl border border-dashed border-orange-200 bg-orange-50 gap-2">
      <Text className="text-[10px] font-extrabold text-orange-500 uppercase tracking-widest">
        Dev only
      </Text>
      {children}
    </View>
  )
}
