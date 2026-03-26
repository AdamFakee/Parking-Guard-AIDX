import { Card } from '@/shared/components/ui';
import { ShiftWithStaff } from '@/shared/db';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { router } from 'expo-router';
import { ChevronRight, Clock, DollarSign, User } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

interface ShiftListItemProps {
  shift: ShiftWithStaff;
}

export const ShiftListItem = ({ shift }: ShiftListItemProps) => {
  const startTime = format(new Date(shift.startTime), 'HH:mm dd/MM', { locale: vi });
  const endTime = shift.endTime 
    ? format(new Date(shift.endTime), 'HH:mm dd/MM', { locale: vi })
    : 'Đang diễn ra';
  
  const totalRevenue = (shift.cashRevenue || 0) + (shift.qrRevenue || 0);

  return (
    <Pressable 
      onPress={() => router.push(`/reports/shifts/${shift.id}` as any)}
      className="mb-sm"
    >
      <Card className="p-md flex-row items-center" shadow>
        <View className="flex-1">
          <View className="flex-row items-center mb-xs">
            <User size={14} color="#94a3b8" />
            <Text className="text-slate-900 font-semibold ml-xs">
              {shift.staff?.name || 'Nhân viên'}
            </Text>
            <View 
              className={`ml-sm px-xs rounded ${shift.status === 'open' ? 'bg-green-500/20' : 'bg-slate-200'}`}
            >
              <Text className={`text-[10px] ${shift.status === 'open' ? 'text-green-500' : 'text-slate-400'}`}>
                {shift.status === 'open' ? 'TRỰC' : 'ĐÓNG'}
              </Text>
            </View>
          </View>
          
          <View className="flex-row items-center mb-xs">
            <Clock size={12} color="#64748b" />
            <Text className="text-slate-400 text-xs ml-xs">
              {startTime} - {endTime}
            </Text>
          </View>

          <View className="flex-row items-center">
            <DollarSign size={12} color="#3b82f6" />
            <Text className="text-blue-600 text-sm font-medium ml-xs">
              {totalRevenue.toLocaleString('vi-VN')} VNĐ
            </Text>
          </View>
        </View>
        
        <ChevronRight size={20} color="#475569" />
      </Card>
    </Pressable>
  );
};
