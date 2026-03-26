import { Card } from '@/shared/components/ui';
import { format } from 'date-fns';
import React from 'react';
import { Text, View } from 'react-native';

interface ShiftDetailTransactionsProps {
  list: any[];
  type: 'IN' | 'OUT';
}

export const ShiftDetailTransactions = ({ list, type }: ShiftDetailTransactionsProps) => (
  <View className="py-md">
    {list.length === 0 ? (
      <View className="items-center py-xl">
        <Text className="text-slate-600">Không có giao dịch nào</Text>
      </View>
    ) : (
      list.map((item) => (
        <View key={item.id} className="mb-sm">
          <Card className="p-md" shadow>
            <View className="flex-row justify-between items-start">
              <View>
                <Text className="text-slate-900 font-bold text-base">{item.plateText || item.exitPlate}</Text>
                <Text className="text-slate-400 text-xs mt-xs">
                  {format(new Date(type === 'IN' ? item.entryTime : item.exitTime), 'HH:mm:ss')}
                </Text>
              </View>
              <View className="items-end">
                <View className="px-sm py-px bg-slate-100 rounded">
                  <Text className="text-slate-300 text-[10px] uppercase">
                    {item.vehicleType === 'motorbike' ? 'Xe máy' : item.vehicleType === 'car' ? 'Ô tô' : 'Xe điện'}
                  </Text>
                </View>
                {type === 'OUT' && (
                  <Text className="text-slate-900 font-bold mt-xs">
                    {(item.feeAmount || 0).toLocaleString('vi-VN')}đ
                  </Text>
                )}
              </View>
            </View>
          </Card>
        </View>
      ))
    )}
  </View>
);
