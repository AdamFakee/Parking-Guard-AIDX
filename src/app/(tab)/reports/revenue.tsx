import { AppHeader, Card } from '@/shared/components/ui';
import { useRevenueReport } from '@/shared/features/reports/hooks';
import { format } from 'date-fns';
import { DollarSign, TrendingUp } from 'lucide-react-native';
import React from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';

export default function RevenueReportScreen() {
  const { data: revenueData, isLoading, refetch } = useRevenueReport();

  const totalAllTime = revenueData?.reduce((acc, curr) => acc + (curr.total || 0), 0) || 0;

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <AppHeader title="Báo cáo doanh thu" />
      
      <FlatList
        data={revenueData}
        keyExtractor={(item) => item.date}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#3b82f6" />
        }
        ListHeaderComponent={
          <View className="p-md">
            <Card className="p-md bg-blue-600 mb-md" shadow>
              <View className="flex-row items-center mb-xs">
                <TrendingUp size={16} color="white" />
                <Text className="text-white/80 text-xs ml-xs uppercase font-bold">Tổng doanh thu lịch sử</Text>
              </View>
              <Text className="text-white text-3xl font-black">
                {totalAllTime.toLocaleString('vi-VN')} VNĐ
              </Text>
            </Card>
            
            <Text className="text-slate-900 text-lg font-bold mb-sm">Doanh thu theo ngày</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="px-md mb-sm">
            <Card className="p-md flex-row items-center justify-between" shadow>
              <View>
                <Text className="text-slate-900 font-bold">{format(new Date(item.date), 'dd/MM/yyyy')}</Text>
                <Text className="text-slate-500 text-xs mt-xs">{item.count} giao dịch</Text>
              </View>
              <View className="items-end">
                <View className="flex-row items-center">
                  <DollarSign size={14} color="#10b981" />
                  <Text className="text-green-600 font-bold text-base ml-xs">
                    {(item.total || 0).toLocaleString('vi-VN')}đ
                  </Text>
                </View>
              </View>
            </Card>
          </View>
        )}
      />
    </View>
  );
}
