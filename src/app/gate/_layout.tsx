import { LoadingIndicator } from '@/shared/components/ui/loading';
import { useTensorflowStore } from '@/shared/store/useTensorflowStore';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

function GateLayoutContent() {
  const { status, loadModel } = useTensorflowStore();

  useEffect(() => {
    // Chỉ kích hoạt load khi vào khu vực gate
    loadModel();
  }, [loadModel]);

  if (status === 'loading' || status === 'idle') {
    return (
      <View className="flex-1 items-center justify-center">
        <LoadingIndicator />
      </View>
    );
  }

  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="scan-plate" />
      <Stack.Screen name="check-in" />
      <Stack.Screen name="check-out" />
      <Stack.Screen name="entry-detail" />
      <Stack.Screen name="lost-card" />
      <Stack.Screen name="monthly-register" />
    </Stack>
  );
}

export default function GateLayout() {
  return (
    <GateLayoutContent />
  );
}
