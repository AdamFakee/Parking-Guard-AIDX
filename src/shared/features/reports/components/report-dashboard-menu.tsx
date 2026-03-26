import { router } from 'expo-router';
import { Clock, DollarSign } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import { ReportMenuButton } from './report-menu-button';

export const ReportDashboardMenu = () => {
  return (
    <View className="mt-md">
      <Text className="text-slate-900 text-lg font-bold mb-md">Xem báo cáo chi tiết</Text>
      
      <ReportMenuButton 
        title="Lịch sử ca làm việc"
        subtitle="Xem chi tiết giao dịch xe vào/ra theo từng ca"
        icon={Clock}
        iconBg="#3b82f6"
        onPress={() => router.push('/reports/shifts')}
      />

      <ReportMenuButton 
        title="Báo cáo doanh thu"
        subtitle="Phân tích doanh thu theo ngày và tháng"
        icon={DollarSign}
        iconBg="#10b981"
        onPress={() => router.push('/reports/revenue')}
      />
    </View>
  );
};
