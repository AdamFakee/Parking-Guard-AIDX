import { Card } from '@/shared/components/ui';
import { cn } from '@/shared/utils';
import { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  trend?: string;
  trendType?: 'up' | 'down' | 'neutral';
  onPress?: () => void;
  className?: string;
}

export const SummaryCard = ({
  title,
  value,
  icon: Icon,
  iconColor = '#3b82f6',
  trend,
  trendType = 'neutral',
  onPress,
  className,
}: SummaryCardProps) => {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container onPress={onPress} className={cn('flex-1 min-w-[150px] mb-md', className)}>
      <Card className="p-md" shadow>
        <View className="flex-row items-center justify-between mb-sm">
          <View 
            className="p-sm rounded-lg" 
            style={{ backgroundColor: `${iconColor}20` }}
          >
            <Icon size={20} color={iconColor} />
          </View>
          {trend && (
            <Text 
              className={cn(
                'text-xs font-medium',
                trendType === 'up' && 'text-green-500',
                trendType === 'down' && 'text-red-500',
                trendType === 'neutral' && 'text-slate-400'
              )}
            >
              {trend}
            </Text>
          )}
        </View>
        <Text className="text-slate-400 text-xs mb-xs">{title}</Text>
        <Text className="text-slate-900 text-xl font-bold">{value}</Text>
      </Card>
    </Container>
  );
};
