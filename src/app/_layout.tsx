import { ErrorFallback } from '@/shared/components/common'
import { AlertHost, toastConfig } from '@/shared/components/providers'
import { db } from '@/shared/db'
import { useLicense } from '@/shared/features/app'
import { SyncStatusIndicator } from '@/shared/features/sync'
import { useAppInit, useAppGate } from '@/shared/hooks'
import { onAppStateChange, queryClient, setupReactQueryMobile, useDevTools } from '@/shared/lib'
import { QueryClientProvider } from '@tanstack/react-query'
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { AppState, Text, View } from 'react-native'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import migrations from '../../drizzle/migrations.js'
import './global.css'

SplashScreen.preventAutoHideAsync()
setupReactQueryMobile()

function AppBootstrapper() {
  useAppInit()
  useAppGate()
  return null
}

/** Auto-sync chỉ khi license online */
function ConditionalSync() {
  const { isOnline } = useLicense()
  if (!isOnline) return null
  return <SyncStatusIndicator />
}

export default function RootLayout() {
  useDevTools(queryClient)
  const { success, error } = useMigrations(db, migrations)

  useEffect(() => {
    if (success || error) {
      SplashScreen.hideAsync()
    }
  }, [success, error])

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
    )
  }

  if (!success) return null

  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <QueryClientProvider client={queryClient}>
          <AppBootstrapper />
          <StatusBar style="dark" />
          <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => {}}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tab)" />
              <Stack.Screen name="gate" />
            </Stack>
            <ConditionalSync />
          </ErrorBoundary>
          <AlertHost />
          <Toast config={toastConfig} />
        </QueryClientProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  )
}
