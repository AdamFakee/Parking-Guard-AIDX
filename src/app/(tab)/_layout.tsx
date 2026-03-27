import { AppTabBar } from '@/shared/components/common/app-tab-bar';
import { getTabBarStyle } from '@/shared/utils/tab-bar';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="in-yard" />
      <Tabs.Screen 
        name="reports" 
        options={({ route }) => ({
          tabBarStyle: getTabBarStyle(route, insets) as any,
        })}
      />
      <Tabs.Screen name="cards" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
