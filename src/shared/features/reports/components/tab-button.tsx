import { cn } from '@/shared/utils';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface TabButtonProps {
  label: string;
  active: boolean;
  onPress: () => void;
  count?: number;
}

export const TabButton = ({ label, active, onPress, count }: TabButtonProps) => (
  <TouchableOpacity 
    onPress={onPress}
    className={cn(
      'flex-1 py-sm items-center border-b-2',
      active ? 'border-blue-500' : 'border-transparent'
    )}
  >
    <View className="flex-row items-center">
      <Text className={cn('text-sm font-medium', active ? 'text-blue-600' : 'text-slate-500')}>
        {label}
      </Text>
      {count !== undefined && count > 0 && (
        <View className="ml-xs bg-slate-200 px-xs rounded">
          <Text className="text-[10px] text-slate-300">{count}</Text>
        </View>
      )}
    </View>
  </TouchableOpacity>
);
