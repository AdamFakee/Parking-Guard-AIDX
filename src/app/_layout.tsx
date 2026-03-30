import { ErrorFallback } from '@/shared/components/common'
import { db } from '@/shared/db'
import { onAppStateChange, queryClient, setupReactQueryMobile, useDevTools } from '@/shared/lib'
import { useAuthStore } from '@/shared/store/useAuthStore'
import { QueryClientProvider } from '@tanstack/react-query'
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator'
import { Redirect, Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { AppState, Text, View } from 'react-native'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

import { toastConfig } from '@/shared/components/providers'
import { useShiftStore } from '@/shared/features/shift'
import { SyncStatusIndicator } from '@/shared/features/sync'
import * as SplashScreen from 'expo-splash-screen'
import migrations from '../../drizzle/migrations.js'
import './global.css'

SplashScreen.preventAutoHideAsync()

setupReactQueryMobile()

function useProtectedRoute() {
  const { isAuthenticated, _hasHydrated: authHydrated } = useAuthStore();
  const { currentShift, _hasHydrated: shiftHydrated } = useShiftStore();
  const segments = useSegments();
  const router = useRouter()
  const navigationState = useRootNavigationState();

  // Đợi navigation mount và hydration xong
  if (!navigationState?.key || !authHydrated || !shiftHydrated) return null;

  const inAuthGroup = segments[0] === '(auth)';

  if (!isAuthenticated) {
    if (!inAuthGroup) {
      return <Redirect href="/(auth)/login" />;
    }
  } else if (!currentShift) {
    if (!inAuthGroup || segments[1] === 'login') {
      router.replace('/(auth)/select-role')
      return;
    }
  } else {
    if (inAuthGroup) {
      router.replace('/')
      return;
    }
  }

  return null;
}

function RootLayoutNav() {
  const redirect = useProtectedRoute();

  if (redirect) return redirect;

  return (
    <Stack 
      screenOptions={{ headerShown: false }} 
    >
      <Stack.Screen name="(tab)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="gate" />
    </Stack>
  );
}

export default function RootLayout() {
  useDevTools(queryClient);

  const { success, error } = useMigrations(db, migrations);

  const { _hasHydrated: authHydrated } = useAuthStore();
  const { _hasHydrated: shiftHydrated } = useShiftStore();

  useEffect(() => {
    if ((success || error) && authHydrated && shiftHydrated) {
      SplashScreen.hideAsync()
    }
  }, [success, error, authHydrated, shiftHydrated])

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

  if (!success || !authHydrated || !shiftHydrated) return null;

  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />

          <ErrorBoundary 
            FallbackComponent={ErrorFallback}
            onReset={() => {
            }}
          >
            <RootLayoutNav />
            <SyncStatusIndicator />
          </ErrorBoundary>
          
          <Toast config={toastConfig} />
        </QueryClientProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  )
}
