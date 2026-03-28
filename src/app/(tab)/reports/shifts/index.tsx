import { AppHeader } from '@/shared/components/ui';
import { ShiftListItem } from '@/shared/features/reports/components';
import { useShifts } from '@/shared/features/reports/hooks/use-shifts';
import { LocateFixedIcon } from 'lucide-react-native';
import React from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';

export default function ShiftHistoryScreen() {
  const { 
    data, 
    isLoading, 
    refetch, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useShifts();

  const shifts = React.useMemo(() => {
    return data?.pages.flatMap(page => page) ?? [];
  }, [data]);

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <AppHeader title="Lịch sử ca làm việc" />
      
      <FlatList
        data={shifts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ShiftListItem shift={item} />}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#3b82f6" />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="py-md items-center">
              <LocateFixedIcon/>
            </View>
          ) : null
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
