import { AppHeader, Card, LoadingIndicator } from '@/shared/components/ui';
import { useRevenueReport } from '@/shared/features/reports/hooks';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Banknote, CreditCard, TrendingUp } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { FlatList, RefreshControl, Text, View, ActivityIndicator } from 'react-native';

export default function RevenueReportScreen() {
  const { 
    data, 
    isLoading, 
    refetch, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useRevenueReport();

  const revenueData = useMemo(() => data?.pages.flat() || [], [data]);

  const totals = useMemo(() => revenueData.reduce((acc, curr) => ({
    total: acc.total + (curr.total || 0),
    cash: acc.cash + (curr.cash || 0),
    qr: acc.qr + (curr.qr || 0),
    count: acc.count + (curr.count || 0),
  }), { total: 0, cash: 0, qr: 0, count: 0 }), [revenueData]);

  if (isLoading && !data) return <View className="flex-1 items-center justify-center"><LoadingIndicator /></View>;

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <AppHeader title="Báo cáo doanh thu" />
      
      <FlatList
        data={revenueData}
        keyExtractor={(item) => item.date}
        contentContainerClassName="pb-xl"
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
                <View className="py-md">
                    <ActivityIndicator color="#3b82f6" />
                </View>
            ) : null
        }
        ListHeaderComponent={
          <View className="p-md">
            <Card className="p-md bg-blue-600 mb-md overflow-hidden" shadow>
              <View className="flex-row items-center mb-xs">
                <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
                    <TrendingUp size={18} color="white" />
                </View>
                <Text className="text-white/80 text-xs ml-xs uppercase font-bold tracking-wider">Tổng doanh thu kỳ này</Text>
              </View>
              <Text className="text-white text-3xl font-black mb-md">
                {totals.total.toLocaleString('vi-VN')}đ
              </Text>
              
              <View className="flex-row gap-sm pt-md border-t border-white/20">
                <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                        <Banknote size={12} color="rgba(255,255,255,0.7)" />
                        <Text className="text-white/70 text-[10px] ml-1 uppercase font-bold">Tiền mặt</Text>
                    </View>
                    <Text className="text-white font-bold text-sm">{totals.cash.toLocaleString('vi-VN')}đ</Text>
                </View>
                <View className="flex-1 border-l border-white/20 pl-sm">
                    <View className="flex-row items-center mb-1">
                        <CreditCard size={12} color="rgba(255,255,255,0.7)" />
                        <Text className="text-white/70 text-[10px] ml-1 uppercase font-bold">Chuyển khoản</Text>
                    </View>
                    <Text className="text-white font-bold text-sm">{totals.qr.toLocaleString('vi-VN')}đ</Text>
                </View>
              </View>
            </Card>
            
            <View className="flex-row items-center justify-between mb-sm">
                <Text className="text-slate-900 text-lg font-bold">Doanh thu theo ngày</Text>
                <View className="bg-slate-200 px-2 py-1 rounded-full">
                    <Text className="text-slate-600 text-[10px] font-bold uppercase">{totals.count} lượt xe</Text>
                </View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View className="px-md mb-sm">
            <Card className="p-md" shadow>
              <View className="flex-row items-center justify-between mb-sm">
                <View>
                  <Text className="text-slate-900 font-bold text-base">
                    {format(new Date(item.date), 'eeee, dd/MM', { locale: vi })}
                  </Text>
                  <Text className="text-slate-500 text-xs">{item.count} lượt xe ra</Text>
                </View>
                <View className="items-end">
                  <Text className="text-blue-600 font-black text-lg">
                    {(item.total || 0).toLocaleString('vi-VN')}đ
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center pt-sm border-t border-slate-100 mt-xs">
                <View className="flex-row items-center mr-md">
                    <View className="w-5 h-5 rounded bg-green-100 items-center justify-center mr-xs">
                        <Banknote size={12} color="#10b981" />
                    </View>
                    <Text className="text-slate-600 text-xs font-medium">
                        {(item.cash || 0).toLocaleString('vi-VN')}đ
                    </Text>
                </View>
                <View className="flex-row items-center">
                    <View className="w-5 h-5 rounded bg-blue-100 items-center justify-center mr-xs">
                        <CreditCard size={12} color="#3b82f6" />
                    </View>
                    <Text className="text-slate-600 text-xs font-medium">
                        {(item.qr || 0).toLocaleString('vi-VN')}đ
                    </Text>
                </View>
              </View>
            </Card>
          </View>
        )}
        ListEmptyComponent={
            <View className="px-md py-xl items-center">
                <Text className="text-slate-400">Chưa có dữ liệu doanh thu</Text>
            </View>
        }
      />
    </View>
  );
}
