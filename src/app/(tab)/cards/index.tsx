import { AppHeader } from '@/shared/components/ui';
import { COLORS } from '@/shared/constants';
import { CARD_FILTERS, CardItem, useGetCards } from '@/shared/features/cards';
import { useNfc } from '@/shared/features/gate/hooks/use-nfc';
import { ExpiredMonthlyCardModal, ExpiredMonthlyCardModalRef } from '@/shared/features/gate/components/expired-monthly-card-modal';
import { useCardStore } from '@/shared/store/useCardStore';
import { FlashList } from '@shopify/flash-list';
import { CreditCard, Scan, Search } from 'lucide-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import { useDebounce } from 'use-debounce';

export default function CardsScreen() {
  const { statusFilter, setStatusFilter } = useCardStore();
  const [localSearch, setLocalSearch] = useState('');
  const [debouncedSearch] = useDebounce(localSearch, 500);
  const { readTag, isReading } = useNfc();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useGetCards({
    searchQuery: debouncedSearch,
    statusFilter: statusFilter,
  });

  const cards = useMemo(() => data?.pages.flat() || [], [data]);

  const handleNfcScan = useCallback(async () => {
    try {
      const tag = await readTag();
      if (tag && tag.id) {
        setLocalSearch(tag.id);
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể đọc thẻ NFC');
    }
  }, [readTag]);

  const renderFilterItem = (item: typeof CARD_FILTERS[0]) => {
    const isSelected = statusFilter === item.value;
    return (
      <Pressable
        key={item.value}
        onPress={() => setStatusFilter(item.value)}
        className={`px-4 py-2 rounded-full mr-2 h-10 border ${
          isSelected ? 'bg-primary border-primary' : 'bg-white border-slate-200'
        }`}
      >
        <Text className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-600'}`}>
          {item.label}
        </Text>
      </Pressable>
    );
  };

  const modalRef = useRef<ExpiredMonthlyCardModalRef>(null);

  const handleRenew = useCallback((card: any) => {
    modalRef.current?.show(card.serialId);
  }, []);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <CardItem card={item} onRenew={handleRenew} />
  ), [handleRenew]);

  const keyExtractor = useCallback((item: any, index: number) => `${item.id}-${index}`, []);

  const renderHeader = () => (
    <View className="bg-white">
      <AppHeader title="Quản lý thẻ" showLeftButton={false} />
      
      {/* Search & NFC Scan */}
      <View className="px-4 py-3 flex-row items-center gap-2">
        <View className="flex-1 flex-row items-center bg-slate-100 rounded-xl px-3 h-12 border border-slate-200">
          <Search size={20} color={COLORS.slate[400]} />
          <TextInput
            className="flex-1 ml-2 text-sm text-slate-800"
            placeholder="Tìm biển số, tên, SĐT..."
            value={localSearch}
            onChangeText={setLocalSearch}
            placeholderTextColor={COLORS.slate[400]}
          />
        </View>
        <Pressable 
          onPress={handleNfcScan}
          disabled={isReading}
          className={`w-12 h-12 rounded-xl items-center justify-center border ${
            isReading ? 'bg-slate-50 border-slate-100' : 'bg-blue-50 border-blue-100'
          }`}
        >
          {isReading ? (
            <ActivityIndicator size="small" color={COLORS.brand.blue} />
          ) : (
            <Scan size={24} color={COLORS.brand.blue} />
          )}
        </Pressable>
      </View>

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        className="px-4 pb-4"
        contentContainerStyle={{ paddingRight: 32 }}
      >
        {CARD_FILTERS.map(renderFilterItem)}
      </ScrollView>
    </View>
  );

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <SafeAreaView className="bg-white" />
      
      <FlashList
        data={cards}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListHeaderComponent={renderHeader()}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => 
          isFetchingNextPage ? <ActivityIndicator className="py-4" color={COLORS.brand.blue} /> : <View className="h-10" />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center justify-center py-20">
              <CreditCard size={48} color={COLORS.slate[200]} />
              <Text className="text-slate-400 text-sm mt-4 text-center px-10">
                Không tìm thấy dữ liệu thẻ nào khớp với yêu cầu của bạn.
              </Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={isLoading && !!cards.length}
            onRefresh={refetch}
            colors={[COLORS.brand.blue]}
          />
        }
        removeClippedSubviews={true}
      />

      <ExpiredMonthlyCardModal 
        ref={modalRef}
        onSuccess={() => refetch()}
      />
    </View>
  );
}
