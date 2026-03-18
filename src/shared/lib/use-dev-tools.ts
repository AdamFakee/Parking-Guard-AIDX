import { QueryClient } from '@tanstack/react-query';

/**
 * Custom hook to initialize React Query DevTools in development mode.
 *
 * @dev-plugins/react-query chỉ dùng được trong Expo Go / dev-client,
 * KHÔNG dùng được trong production build (APK release) vì nó phụ thuộc
 * vào Expo Dev Client APIs không có trong production bundle.
 *
 * @param queryClient The TanStack Query Client instance.
 */
export const useDevTools = (_queryClient: QueryClient) => {
  // DevTools bị disable để tránh crash trên máy thật (production/release build).
  // Để bật lại trong môi trường dev, uncomment đoạn code bên dưới và
  // đảm bảo chỉ chạy với expo-dev-client (không phải APK release).
  //
  // if (__DEV__) {
  //   // eslint-disable-next-line react-hooks/rules-of-hooks
  //   const { useReactQueryDevTools } = require('@dev-plugins/react-query');
  //   useReactQueryDevTools(_queryClient);
  // }
};