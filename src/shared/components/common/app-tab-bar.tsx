import { cn } from '@/shared/utils';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
    LucideBarChart3,
    LucideCreditCard,
    LucideLayoutGrid,
    LucideParkingCircle,
    LucideSettings
} from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const AppTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();

  const getIcon = (routeName: string, color: string) => {
    switch (routeName) {
      case 'index':
        return <LucideLayoutGrid size={24} color={color} />;
      case 'in-yard':
        return <LucideParkingCircle size={24} color={color} />;
      case 'reports':
        return <LucideBarChart3 size={24} color={color} />;
      case 'cards':
        return <LucideCreditCard size={24} color={color} />;
      case 'settings':
        return <LucideSettings size={24} color={color} />;
      default:
        return <LucideLayoutGrid size={24} color={color} />;
    }
  };

  const getLabel = (routeName: string) => {
    switch (routeName) {
      case 'index':
        return 'Dashboard';
      case 'in-yard':
        return 'Trong bãi';
      case 'reports':
        return 'Báo cáo';
      case 'cards':
        return 'Thẻ xe';
      case 'settings':
        return 'Cài đặt';
      default:
        return routeName;
    }
  };

  const { options } = descriptors[state.routes[state.index].key] as any;

  if (options.tabBarStyle?.display === 'none') {
    return null;
  }

  return (
    <View 
      style={{ paddingBottom: insets.bottom || 24 }}
      className="bg-white border-t border-slate-200 pt-3 px-2 flex-row justify-around items-center"
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const color = isFocused ? '#3B82F6' : '#94A3B8';

        return (
          <Pressable
            key={route.name}
            onPress={onPress}
            className="flex-1 items-center justify-center gap-1"
          >
            {getIcon(route.name, color)}
            <Text 
              className={cn(
                "text-[10px] font-bold",
                isFocused ? "text-blue-500" : "text-slate-400"
              )}
            >
              {getLabel(route.name)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};
