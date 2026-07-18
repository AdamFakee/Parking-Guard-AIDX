import { Stack } from 'expo-router'

/** Auth: activation → staff-login → open-shift (+ locked) */
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="device-activation" />
      <Stack.Screen name="device-locked" />
      <Stack.Screen name="staff-login" />
      <Stack.Screen name="open-shift" />
    </Stack>
  )
}
