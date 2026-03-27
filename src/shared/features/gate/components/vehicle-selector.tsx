import { Card } from '@/shared/components/ui';
import { cn } from '@/shared/utils';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { VEHICLE_TYPE_LABELS } from '../const/parking.const';
import { TVehicleType } from '../types';

interface VehicleSelectorProps {
  value: TVehicleType;
  onSelect: (type: TVehicleType) => void;
  label?: string;
  showLabel?: boolean;
}

export const VehicleSelector = ({ 
  value, 
  onSelect,
  label = 'Loại phương tiện',
  showLabel = true
}: VehicleSelectorProps) => {
  return (
    <View>
      {showLabel && (
        <Text style={{ 
          fontSize: 14, 
          fontWeight: 'bold', 
          color: '#64748b', 
          textTransform: 'uppercase', 
          marginLeft: 4, 
          marginBottom: 8 
        }}>
          {label}
        </Text>
      )}
      
      <View className="flex-row flex-wrap gap-3">
        {(Object.entries(VEHICLE_TYPE_LABELS) as [TVehicleType, string][]).map(([type, labelText]) => {
          const isSelected = value === type;
          return (
            <Pressable
              key={type}
              onPress={() => onSelect(type)}
              className="w-[48%]"
            >
              <Card 
                centered
                shadow={!isSelected}
                className={cn(
                  'py-4',
                  isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-200'
                )}
              >
                <Text className={cn('font-bold text-xs', isSelected ? 'text-white' : 'text-slate-500')}>
                  {labelText}
                </Text>
              </Card>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
