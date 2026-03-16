import * as Crypto from 'expo-crypto'

/**
 * Tạo UUID ngẫu nhiên sử dụng expo-crypto
 * @returns UUID string
 */
export const generateUUID = (): string => {
  return Crypto.randomUUID()
}
