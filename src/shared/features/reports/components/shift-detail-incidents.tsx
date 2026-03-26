import { Card } from '@/shared/components/ui';
import { AlertCircle } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface ShiftDetailIncidentsProps {
  list: any[];
}

export const ShiftDetailIncidents = ({ list }: ShiftDetailIncidentsProps) => (
  <View className="py-md">
    {list.length === 0 ? (
      <View className="items-center py-xl">
        <Text className="text-slate-600">Không có sự cố nào</Text>
      </View>
    ) : (
      list.map((item) => (
        <View key={item.id} className="mb-sm">
          <Card className="p-md border-red-500/30" shadow>
            <View className="flex-row items-center mb-xs">
              <AlertCircle size={16} color="#ef4444" />
              <Text className="text-red-400 font-bold ml-xs">Báo cáo mất thẻ</Text>
            </View>
            <Text className="text-slate-900 text-sm font-medium">Xe: {item.reportedPlate}</Text>
            <Text className="text-slate-400 text-xs mt-xs">
              Phí đền bù: {item.compensationFee.toLocaleString('vi-VN')}đ
            </Text>
          </Card>
        </View>
      ))
    )}
  </View>
);
