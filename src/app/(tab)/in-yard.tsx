import { AppHeader } from '@/shared/components/ui';
import { COLORS } from '@/shared/constants';
import { TParkingEntry, TVehicleType } from '@/shared/features/gate';
import { STATUS_FILTERS, useInYardEntries, VEHICLE_FILTERS } from '@/shared/features/in-yard';
import { ParkingEntryCard } from '@/shared/features/in-yard/components/parking-entry-card';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { useDebounce } from 'use-debounce';

// ✅ Memoized sub-components to prevent re-renders
const StatusFilter = memo(({ 
  filter, 
  isSelected, 
  onPress 
}: { 
  filter: typeof STATUS_FILTERS[0], 
  isSelected: boolean, 
  onPress: () => void 
}) => (
  <Pressable
    onPress={onPress}
    className={`flex-1 items-center justify-center py-3 rounded-xl ${
      isSelected ? 'bg-blue-50' : 'bg-transparent'
    }`}
  >
    <Text className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-slate-400'}`}>
      {filter.label}
    </Text>
    {isSelected && <View className="absolute bottom-0 w-1/2 h-[3px] bg-primary rounded-full" />}
  </Pressable>
));
StatusFilter.displayName = 'StatusFilter';

const VehicleFilter = memo(({ 
  filter, 
  isSelected, 
  onPress 
}: { 
  filter: typeof VEHICLE_FILTERS[0], 
  isSelected: boolean, 
  onPress: () => void 
}) => (
  <Pressable
    onPress={onPress}
    className={`flex-row items-center px-6 h-10 rounded-full border ${
      isSelected ? 'bg-primary border-primary' : 'bg-white border-slate-200'
    }`}
  >
    <Text className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-600'}`}>
      {filter.label}
    </Text>
  </Pressable>
));
VehicleFilter.displayName = 'VehicleFilter';

const TypedFlashList: any = FlashList;
const ITEM_HEIGHT = 116;

export default function InYardScreen() {
  const [vehicleType, setVehicleType] = useState<TVehicleType | 'all'>('all');
  const [status, setStatus] = useState<'IN' | 'OUT' | 'all'>('IN');
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 400);

  const { 
    data, 
    isLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    refetch, 
    isRefetching 
  } = useInYardEntries({ 
    vehicleType, 
    status, 
    query: debouncedSearch 
  });

  // ✅ Memory cleanup
  useEffect(() => {
    return () => {
      Image.clearMemoryCache();
    };
  }, []);

  const entries = useMemo<TParkingEntry[]>(() => {
    return data?.pages.flatMap((page) => page) || [];
  }, [data]);

  const router = useRouter();

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleEntryPress = useCallback((entry: TParkingEntry) => {
    router.push(`/gate/entry-detail?id=${entry.id}`);
  }, [router]);

  const renderItem = useCallback(({ item }: { item: TParkingEntry }) => (
    <ParkingEntryCard entry={item} onPress={handleEntryPress} />
  ), [handleEntryPress]);

  const keyExtractor = useCallback((item: TParkingEntry) => item.id, []);

  const handleStatusChange = useCallback((value: 'IN' | 'OUT' | 'all') => {
    setStatus(value);
  }, []);

  const handleVehicleTypeChange = useCallback((value: TVehicleType | 'all') => {
    setVehicleType(value);
  }, []);

  // ✅ Memoized list components
  const ListEmptyComponent = useMemo(() => (
    <View className="items-center justify-center py-20">
      <Text className="text-slate-400 text-sm">Không có xe nào khớp với tìm kiếm.</Text>
    </View>
  ), []);

  const ListFooterComponent = useMemo(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color={COLORS.brand.blue} />
      </View>
    );
  }, [isFetchingNextPage]);

  const ItemSeparatorComponent = useCallback(() => <View className="h-3" />, []);

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <AppHeader 
        title={status === 'IN' ? 'Xe trong bãi' : status === 'OUT' ? 'Xe đã ra' : 'Lịch sử lượt xe'} 
        showLeftButton={false} 
      />

      <View className="bg-white border-b border-slate-100">
        <View className="px-4 pt-2">
          <View className="flex-row items-center bg-slate-100 rounded-xl px-3 h-11 border border-slate-200">
            <Search size={18} color={COLORS.slate[400]} />
            <TextInput
              className="flex-1 ml-2 text-sm text-slate-800"
              placeholder="Tìm kiếm biển số..."
              placeholderTextColor={COLORS.slate[400]}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="characters"
              clearButtonMode="while-editing"
            />
          </View>
        </View>

        <View className="flex-row px-4 mt-3 mb-2 gap-2">
          {STATUS_FILTERS.map((filter) => (
            <StatusFilter
              key={filter.value}
              filter={filter}
              isSelected={status === filter.value}
              onPress={() => handleStatusChange(filter.value)}
            />
          ))}
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          className="px-4 pb-4"
          contentContainerStyle={{ gap: 8, paddingRight: 32 }}
        >
          {VEHICLE_FILTERS.map((filter) => (
            <VehicleFilter
              key={filter.value}
              filter={filter}
              isSelected={vehicleType === filter.value}
              onPress={() => handleVehicleTypeChange(filter.value)}
            />
          ))}
        </ScrollView>
      </View>

      <View className="flex-1 p-4">
        <View className="flex-row items-center justify-between mb-3 px-1">
          <Text className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">
            {debouncedSearch ? `Kết quả tìm kiếm: ${entries.length}` : `Tổng cộng: ${entries.length} xe`}
          </Text>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={COLORS.brand.blue} />
          </View>
        ) : (
          <TypedFlashList
            data={entries}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            estimatedItemSize={ITEM_HEIGHT}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            ItemSeparatorComponent={ItemSeparatorComponent}
            refreshControl={
              <RefreshControl 
                refreshing={isRefetching} 
                onRefresh={refetch} 
                colors={[COLORS.brand.blue]} 
                tintColor={COLORS.brand.blue}
              />
            }
            ListFooterComponent={ListFooterComponent}
            ListEmptyComponent={ListEmptyComponent}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            initialNumToRender={15}
            windowSize={5}
            drawDistance={500}
          />
        )}
      </View>
    </View>
  );
}
