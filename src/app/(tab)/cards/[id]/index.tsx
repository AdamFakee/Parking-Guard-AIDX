import { AppHeader } from '@/shared/components/ui';
import { COLORS } from '@/shared/constants';
import { useGetCardEntries, useGetCards } from '@/shared/features/cards';
import { formatDisplayPlate, TVehicleType, VEHICLE_TYPE_LABELS } from '@/shared/features/gate';
import { format } from 'date-fns/format';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, Calendar, Car, Clock, CreditCard, Phone, User } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

export default function CardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const { data: cardData, isLoading: isCardLoading } = useGetCards({ searchQuery: id });
  const { 
    data: historyData, 
    isLoading: isHistoryLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching
  } = useGetCardEntries({ cardUid: id });
  
  const card = useMemo(() => {
    return cardData?.pages.flat().find(c => c.serialId === id);
  }, [cardData, id]);

  const history = useMemo(() => {
    return historyData?.pages.flat() || [];
  }, [historyData]);

  if (isCardLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={COLORS.brand.blue} />
      </View>
    );
  }

  if (!card) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-slate-400">Không tìm thấy thông tin thẻ</Text>
      </View>
    );
  }

  const renderHeader = () => (
    <View className="p-4">
      {/* Card Identity Card */}
      <View className="bg-white rounded-3xl p-6 mb-6 shadow-sm border border-slate-100">
        <View className="flex-row items-center gap-4 mb-6">
          <View className={`w-14 h-14 rounded-2xl items-center justify-center ${card.type === 'monthly' ? 'bg-blue-50' : 'bg-amber-50'}`}>
            <CreditCard size={28} color={card.type === 'monthly' ? COLORS.brand.blue : COLORS.brand.orange} />
          </View>
          <View className="flex-1">
            <Text className="text-slate-900 font-bold text-xl">{card.serialId}</Text>
            <View className="flex-row items-center gap-2 mt-1">
              <View className="px-2 py-0.5 rounded-full bg-slate-100">
                 <Text className="text-[10px] font-bold text-slate-500 uppercase">{card.type === 'monthly' ? 'Thẻ tháng' : 'Thẻ vãng lai'}</Text>
              </View>
              <View className="px-2 py-0.5 rounded-full bg-emerald-50">
                 <Text className="text-[10px] font-bold text-emerald-600 uppercase">Hợp lệ</Text>
              </View>
            </View>
          </View>
        </View>

        <View className="h-[1px] bg-slate-100 w-full mb-6" />

        {/* Owner Details */}
        <View className="gap-4">
          <View className="flex-row items-center gap-3">
            <User size={18} color={COLORS.slate[400]} />
            <View>
              <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Chủ thẻ</Text>
              <Text className="text-slate-800 font-semibold">{card.holderName}</Text>
            </View>
          </View>

          {card.phoneNumber ? (
            <View className="flex-row items-center gap-3">
              <Phone size={18} color={COLORS.slate[400]} />
              <View>
                <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Số điện thoại</Text>
                <Text className="text-slate-800 font-semibold">{card.phoneNumber}</Text>
              </View>
            </View>
          ) : null}

          {card.expiredAt !== 'N/A' ? (
            <View className="flex-row items-center gap-3">
              <Calendar size={18} color={COLORS.slate[400]} />
              <View>
                <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Hết hạn vào</Text>
                <Text className="text-slate-800 font-semibold">{card.expiredAt}</Text>
              </View>
            </View>
          ) : null}
        </View>
      </View>

      <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-3 px-2">Lịch sử quẹt thẻ</Text>
    </View>
  );

  const renderItem = ({ item }: { item: any }) => (
    <Pressable 
      onPress={() => router.push(`/gate/entry-detail?id=${item.id}`)}
      className="bg-white rounded-3xl p-5 mb-3 mx-4 shadow-sm border border-slate-100"
    >
       <View className="gap-4">
          <View className="flex-row justify-between items-start">
             <View className="flex-1">
                 <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Biển số</Text>
                 <Text className="text-slate-800 font-bold text-base">{formatDisplayPlate(item.plateText)}</Text>
             </View>
             <View className={`px-2 py-1 rounded-lg ${item.status === 'IN' ? 'bg-blue-50' : 'bg-slate-100'}`}>
                <Text className={`text-[10px] font-bold ${item.status === 'IN' ? 'text-blue-600' : 'text-slate-400'}`}>
                   {item.status === 'IN' ? 'ĐANG TRONG BÃI' : 'ĐÃ RỜI BÃI'}
                </Text>
             </View>
          </View>
          
          <View className="flex-row justify-between">
              <View className="flex-1">
                  <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Thời gian vào</Text>
                  <View className="flex-row items-center gap-1">
                     <Clock size={12} color={COLORS.slate[400]} />
                     <Text className="text-slate-800 text-xs font-semibold">{format(new Date(item.entryTime), 'HH:mm - dd/MM')}</Text>
                  </View>
              </View>
              
              {item.status === 'OUT' ? (
                <View className="flex-1 items-end">
                    <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Thời gian ra</Text>
                    <View className="flex-row items-center gap-1">
                       <Clock size={12} color={COLORS.slate[400]} />
                       <Text className="text-slate-800 text-xs font-semibold">{format(new Date(item.exitTime), 'HH:mm - dd/MM')}</Text>
                    </View>
                </View>
              ) : null}
          </View>

          <View>
              <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Loại phương tiện</Text>
              <Text className="text-slate-600 text-xs font-semibold">{VEHICLE_TYPE_LABELS[item.vehicleType as TVehicleType] || item.vehicleType}</Text>
          </View>

          <View className="mt-1 flex-row items-center justify-between">
             <View className="bg-blue-50 px-4 py-1.5 rounded-full border border-blue-50">
                <Text className="text-blue-600 font-bold text-[10px]">Xem chi tiết</Text>
             </View>
             <ArrowRight size={16} color={COLORS.slate[200]} />
          </View>
       </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-slate-50">
      <AppHeader title="Chi tiết thẻ" />
      
      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => 
          isFetchingNextPage ? <ActivityIndicator className="py-4" color={COLORS.brand.blue} /> : <View className="h-10" />
        }
        ListEmptyComponent={() => (
          !isHistoryLoading && (
            <View className="p-10 items-center justify-center bg-white mx-4 rounded-3xl border border-slate-100">
               <Car size={40} color={COLORS.slate[100]} />
               <Text className="text-slate-400 text-sm mt-3 text-center">Chưa có dữ liệu lượt xe khớp với thẻ này</Text>
            </View>
          )
        )}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      />
    </View>
  );
}
