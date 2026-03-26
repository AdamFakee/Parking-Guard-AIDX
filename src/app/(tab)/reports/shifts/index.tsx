import { AppHeader } from '@/shared/components/ui';
import { ShiftListItem } from '@/shared/features/reports/components';
import { useShifts } from '@/shared/features/reports/hooks/use-shifts';
import React from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';

export default function ShiftHistoryScreen() {
  const { data: shifts, isLoading, refetch } = useShifts();

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <AppHeader title="Lịch sử ca làm việc" />
      
      <FlatList
        data={shifts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ShiftListItem shift={item} />}
        contentContainerClassName="p-md"
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#3b82f6" />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center justify-center py-xl">
              <Text className="text-slate-500">Không có dữ liệu ca làm việc</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
