import { AppHeader } from '@/shared/components/ui';
import { COLORS } from '@/shared/constants';
import { TParkingEntry, TSearchVehicleType, TVehicleType } from '@/shared/features/gate';
import { useInYardEntries } from '@/shared/features/in-yard';
import { ParkingEntryCard } from '@/shared/features/in-yard/components/parking-entry-card';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, Text, View } from 'react-native';

const TypedFlashList: any = FlashList;

export default function InYardScreen() {
  const [vehicleType, setVehicleType] = useState<TVehicleType | 'all'>('all');

  const { 
    data, 
    isLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    refetch, 
    isRefetching 
  } = useInYardEntries({ vehicleType });

  const entries = useMemo<TParkingEntry[]>(() => {
    return data?.pages.flatMap((page) => page) || [];
  }, [data]);

  const vehicleFilters: { label: string; value: TSearchVehicleType }[] = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Xe máy', value: 'motorbike' },
    { label: 'Ô tô', value: 'car' },
    { label: 'Xe điện', value: 'ebike' },
  ];

  const router = useRouter();

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const renderItem = useCallback(({ item }: { item: TParkingEntry }) => (
    <ParkingEntryCard 
      entry={item} 
      onPress={(entry) => router.push(`/gate/entry-detail?id=${entry.id}`)}
    />
  ), [router]);

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <AppHeader title="Xe trong bãi" showLeftButton={false} />

      {/* Filter Tabs */}
      <View className="px-4 pb-4 bg-white border-b border-slate-100">
        <View className="flex-row gap-2 mt-2">
          {vehicleFilters.map((filter) => {
            const isSelected = vehicleType === filter.value;
            return (
              <Pressable
                key={filter.value}
                onPress={() => setVehicleType(filter.value)}
                className={`flex-row items-center px-4 h-9 rounded-full border ${
                  isSelected
                    ? 'bg-blue-500 border-blue-500'
                    : 'bg-white border-slate-200'
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    isSelected ? 'text-white' : 'text-slate-600'
                  }`}
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Main Content */}
      <View className="flex-1 p-4">
        <View className="flex-row items-center justify-between mb-3 px-1">
          <Text className="text-slate-500 font-medium text-xs uppercase tracking-wider">
            Đang hiển thị: {entries.length} xe
          </Text>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={COLORS.brand.blue} />
          </View>
        ) : (
          <TypedFlashList
            data={entries}
            keyExtractor={(item: TParkingEntry) => item.id}
            renderItem={renderItem}
            estimatedItemSize={104}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.3}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            ItemSeparatorComponent={() => <View className="h-3" />}
            refreshControl={
              <RefreshControl 
                refreshing={isRefetching} 
                onRefresh={() => refetch()} 
                colors={[COLORS.brand.blue]} 
                tintColor={COLORS.brand.blue}
              />
            }
            ListFooterComponent={
              isFetchingNextPage ? (
                <View className="py-4">
                  <ActivityIndicator size="small" color={COLORS.brand.blue} />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View className="items-center justify-center py-20">
                <Text className="text-slate-400 text-sm">
                  Không có xe nào khớp với tìm kiếm.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}
