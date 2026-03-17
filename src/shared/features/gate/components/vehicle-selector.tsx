import { Bike, Car, Zap } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableWithoutFeedback, View } from 'react-native';
import { TVehicleType } from '../types';

interface VehicleSelectorProps {
  value: TVehicleType;
  onChange: (type: TVehicleType) => void;
}

export const VehicleSelector = ({ value, onChange }: VehicleSelectorProps) => {
  return (
    <View>
      <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginLeft: 4, marginBottom: 8 }}>Loại phương tiện</Text>
      <View style={{ flexDirection: 'row' }}>
        <TouchableWithoutFeedback onPress={() => onChange('motorbike')}>
          <View style={{ flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 8, borderWidth: 2, marginRight: 12, backgroundColor: value === 'motorbike' ? '#eff6ff' : '#f8fafc', borderColor: value === 'motorbike' ? '#3b82f6' : '#e2e8f0' }}>
            <Bike size={32} color={value === 'motorbike' ? '#3b82f6' : '#64748b'} style={{ marginBottom: 8 }} />
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: value === 'motorbike' ? '#2563eb' : '#64748b' }}>Xe máy</Text>
          </View>
        </TouchableWithoutFeedback>
        
        <TouchableWithoutFeedback onPress={() => onChange('car')}>
          <View style={{ flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 8, borderWidth: 2, marginRight: 12, backgroundColor: value === 'car' ? '#eff6ff' : '#f8fafc', borderColor: value === 'car' ? '#3b82f6' : '#e2e8f0' }}>
            <Car size={32} color={value === 'car' ? '#3b82f6' : '#64748b'} style={{ marginBottom: 8 }} />
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: value === 'car' ? '#2563eb' : '#64748b' }}>Ô tô</Text>
          </View>
        </TouchableWithoutFeedback>
        
        <TouchableWithoutFeedback onPress={() => onChange('ebike')}>
          <View style={{ flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 8, borderWidth: 2, backgroundColor: value === 'ebike' ? '#eff6ff' : '#f8fafc', borderColor: value === 'ebike' ? '#3b82f6' : '#e2e8f0' }}>
            <Zap size={32} color={value === 'ebike' ? '#3b82f6' : '#64748b'} style={{ marginBottom: 8 }} />
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: value === 'ebike' ? '#2563eb' : '#64748b' }}>Xe điện</Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
};
