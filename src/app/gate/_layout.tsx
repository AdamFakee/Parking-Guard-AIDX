import { Stack } from 'expo-router';

export default function GateLayout() {
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
      <Stack.Screen name="qr-payment" />
    </Stack>
  );
}
