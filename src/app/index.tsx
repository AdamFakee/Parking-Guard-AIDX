import { COLORS } from '@/shared/constants'
import { ActivityIndicator, Image, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const logo = require('@/assets/images/logo.png')

/** Splash/loading while appMachine transient states + gate redirect. */
export default function Index() {
  const insets = useSafeAreaInsets()

  return (
    <View
      className="flex-1 bg-slate-50 items-center justify-center px-5"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      accessibilityRole="progressbar"
      accessibilityLabel="Đang khởi động Parking Guard"
    >
      <Image
        source={logo}
        style={{ width: 88, height: 88 }}
        resizeMode="contain"
        accessibilityLabel="Parking Guard"
      />
      <ActivityIndicator
        size="large"
        color={COLORS.brand.blue}
        style={{ marginTop: 28 }}
      />
    </View>
  )
}
