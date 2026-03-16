/**
 * Tạo UUID ngẫu nhiên sử dụng expo-crypto
 * @returns UUID string
 */
export const generateUUID = (): string => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Crypto = require('expo-crypto');
  return Crypto.randomUUID();
}
