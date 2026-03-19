import { OptionCard } from '@/shared/components/ui';
import { Bike, Car, Zap } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import { TVehicleType } from '../types';

interface VehicleSelectorProps {
  value: TVehicleType;
  onChange: (type: TVehicleType) => void;
}

export const VehicleSelector = ({ value, onChange }: VehicleSelectorProps) => {
  return (
    <View>
      <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginLeft: 4, marginBottom: 8 }}>Loại phương tiện</Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <OptionCard 
          onPress={() => onChange('motorbike')}
          isSelected={value === 'motorbike'}
          className="flex-1 flex-col items-center justify-center p-4 mb-0"
        >
          <Bike size={32} color={value === 'motorbike' ? '#3b82f6' : '#64748b'} />
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: value === 'motorbike' ? '#2563eb' : '#64748b', marginTop: 8 }}>Xe máy</Text>
        </OptionCard>
        
        <OptionCard 
          onPress={() => onChange('car')}
          isSelected={value === 'car'}
          className="flex-1 flex-col items-center justify-center p-4 mb-0"
        >
          <Car size={32} color={value === 'car' ? '#3b82f6' : '#64748b'} />
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: value === 'car' ? '#2563eb' : '#64748b', marginTop: 8 }}>Ô tô</Text>
        </OptionCard>
        
        <OptionCard 
          onPress={() => onChange('ebike')}
          isSelected={value === 'ebike'}
          className="flex-1 flex-col items-center justify-center p-4 mb-0"
        >
          <Zap size={32} color={value === 'ebike' ? '#3b82f6' : '#64748b'} />
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: value === 'ebike' ? '#2563eb' : '#64748b', marginTop: 8 }}>Xe điện</Text>
        </OptionCard>
      </View>
    </View>
  );
};
