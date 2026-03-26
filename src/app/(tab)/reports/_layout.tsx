import { Stack } from 'expo-router';

export default function ReportsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
      />
      <Stack.Screen
        name="shifts/index"
      />
      <Stack.Screen
        name="revenue"
      />
      <Stack.Screen
        name="overview-detail"
      />
    </Stack>
  );
}
