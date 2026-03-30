import { Stack } from 'expo-router';

export default function CardsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]/renew" options={{ headerShown: true, title: 'Gia hạn thẻ' }} />
      <Stack.Screen name="[id]/lock" options={{ headerShown: true, title: 'Khóa / Mở khóa thẻ' }} />
    </Stack>
  );
}
