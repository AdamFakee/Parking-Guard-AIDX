import { ErrorFallback } from '@/shared/components/common'
import { db } from '@/shared/db'
import { onAppStateChange, queryClient, setupReactQueryMobile, useDevTools } from '@/shared/lib'
import { QueryClientProvider } from '@tanstack/react-query'
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator'
import { Stack, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { AppState, Text, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useAuthStore } from '@/shared/store/useAuthStore'

import migrations from '../../drizzle/migrations'
import './global.css'

setupReactQueryMobile()

export default function RootLayout() {
  useDevTools(queryClient);

  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const { success, error } = useMigrations(db, migrations);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange)
    return () => subscription.remove()
  }, [])

  useEffect(() => {
    if (!success || !_hasHydrated) return;

    if (isAuthenticated) {
      router.replace('/(auth)/select-role');
    } else {
      router.replace('/(auth)');
    }
  }, [success, _hasHydrated, isAuthenticated, router]);

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
          <Stack screenOptions={{ headerShown: false, }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tab)" />
          </Stack>
        </ErrorBoundary>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}