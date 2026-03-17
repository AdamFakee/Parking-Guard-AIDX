import { AppTabBar } from '@/shared/components/common/app-tab-bar';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="in-yard" />
      <Tabs.Screen name="reports" />
      <Tabs.Screen name="cards" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
