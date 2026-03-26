import { ParkingEntry } from '@/shared/db';
import { format } from 'date-fns';
import { router } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';
import { ParkingTransactionItem } from './parking-transaction-item';

interface ShiftDetailTransactionsProps {
  list: ParkingEntry[];
  type: 'IN' | 'OUT';
}

export const ShiftDetailTransactions = ({ list, type }: ShiftDetailTransactionsProps) => (
  <View className="py-md">
    {list.length === 0 ? (
      <View className="items-center py-xl">
        <Text className="text-slate-600">Không có giao dịch nào</Text>
      </View>
    ) : (
      list.map((item) => {
        const plate = type === 'IN' ? item.plateText : (item.exitPlate || item.plateText);
        const time = type === 'IN' ? item.entryTime : (item.exitTime || item.entryTime);
        const image = type === 'IN' ? item.photoIn1 : (item.photoOut1 || item.photoIn1);

        return (
          <ParkingTransactionItem 
            key={item.id}
            item={item} 
            plate={plate}
            imageUri={image}
            timeLabel={`${type === 'IN' ? 'Vào' : 'Ra'}: ${format(new Date(time), type === 'IN' ? 'HH:mm dd/MM/yyyy' : 'HH:mm:ss dd/MM/yyyy')}`}
            onPress={() => router.push({ pathname: '/gate/entry-detail', params: { id: item.id } })}
            rightContent={
              type === 'OUT' ? (
                <View className="items-end">
                  <View className="bg-emerald-50 px-2 py-1 rounded">
                    <Text className="text-emerald-600 text-[10px] font-bold">HOÀN TẤT</Text>
                  </View>
                  {item.feeAmount !== undefined && (
                    <Text className="text-sm font-bold text-slate-900 mt-1">
                      {(item.feeAmount || 0).toLocaleString('vi-VN')}đ
                    </Text>
                  )}
                </View>
              ) : null
            }
          />
        );
      })
    )}
  </View>
);
