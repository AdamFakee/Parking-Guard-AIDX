import { ErrorFallback } from '@/shared/components/common'
import { db } from '@/shared/db'
import { onAppStateChange, queryClient, setupReactQueryMobile, useDevTools } from '@/shared/lib'
import { useAuthStore } from '@/shared/store/useAuthStore'
import { QueryClientProvider } from '@tanstack/react-query'
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator'
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { AppState, Text, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { useShiftStore } from '@/shared/features/shift'
import migrations from '../../drizzle/migrations'
import './global.css'

setupReactQueryMobile()

/**
 * Hook xử lý redirect dựa trên auth state.
 * Phải được gọi bên trong component con của NavigationContainer (Stack).
 */
function useProtectedRoute() {
  const { isAuthenticated, _hasHydrated: authHydrated } = useAuthStore();
  const { currentShift, _hasHydrated: shiftHydrated } = useShiftStore();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    // Đợi navigation mount xong
    if (!navigationState?.key) return;
    if (!authHydrated || !shiftHydrated) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated) {
      // Chưa đăng nhập -> redirect tới login
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else if (!currentShift) {
      // Đã đăng nhập nhưng chưa chọn ca -> redirect tới select-role
      if (segments[1] !== 'select-role') {
        router.replace('/(auth)/select-role');
      }
    } else {
      // Đã đăng nhập + có ca -> thoát auth group nếu đang ở đó
      if (inAuthGroup) {
        router.replace('/');
      }
    }
  }, [navigationState?.key, authHydrated, shiftHydrated, isAuthenticated, currentShift, segments, router]);
}

function RootLayoutNav() {
  useProtectedRoute();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tab)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="gate" />
    </Stack>
  );
}

export default function RootLayout() {
  useDevTools(queryClient);

  const { success, error } = useMigrations(db, migrations);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange)
    return () => subscription.remove()
  }, [])

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-red-500 font-bold mb-2">Lỗi khởi tạo Database:</Text>
        <Text>{error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Đang khởi tạo Database...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />

        <ErrorBoundary 
          FallbackComponent={ErrorFallback}
          onReset={() => {
          }}
        >
          <RootLayoutNav />
        </ErrorBoundary>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}