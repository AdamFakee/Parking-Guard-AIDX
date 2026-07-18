import { useTensorflowStore } from '@/shared/store/useTensorflowStore';
import { Stack } from 'expo-router';
import { useEffect } from 'react';

/**
 * Gate stack — preload YOLO in background, don't block navigation.
 */
export default function GateLayout() {
  const loadModel = useTensorflowStore((s) => s.loadModel);

  useEffect(() => {
    void loadModel();
  }, [loadModel]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="scan-plate" />
      <Stack.Screen name="entry-detail" />
      <Stack.Screen name="lost-card" />
      <Stack.Screen name="monthly-register" />
    </Stack>
  );
}
