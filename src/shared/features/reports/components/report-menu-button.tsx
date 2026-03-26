import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ChevronRight, LucideIcon } from 'lucide-react-native';
import { Card } from '@/shared/components/ui';

interface ReportMenuButtonProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconBg: string;
  onPress: () => void;
}

export const ReportMenuButton = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  iconBg, 
  onPress 
}: ReportMenuButtonProps) => (
  <TouchableOpacity onPress={onPress} className="mb-sm">
    <Card className="p-md flex-row items-center">
      <View 
        className="p-md rounded-xl mr-md" 
        style={{ backgroundColor: `${iconBg}20` }}
      >
        <Icon size={24} color={iconBg} />
      </View>
      <View className="flex-1">
        <Text className="text-slate-900 font-bold text-base">{title}</Text>
        <Text className="text-slate-400 text-xs">{subtitle}</Text>
      </View>
      <ChevronRight size={20} color="#475569" />
    </Card>
  </TouchableOpacity>
);
