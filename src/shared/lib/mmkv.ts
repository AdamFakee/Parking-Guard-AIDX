import { createMMKV } from 'react-native-mmkv'

/** Singleton MMKV — app machine persist + refresh token */
export const storage = createMMKV({ id: 'parking-guard-app' })
