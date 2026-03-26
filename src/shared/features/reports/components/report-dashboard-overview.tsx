import { ArrowRightLeft, Car, DollarSign, TrendingUp } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import { DailyOverview } from '../services/report.service';
import { SummaryCard } from './summary-card';

interface ReportDashboardOverviewProps {
  overview?: DailyOverview;
}

export const ReportDashboardOverview = ({ overview }: ReportDashboardOverviewProps) => {
  return (
    <View className="py-md">
      <Text className="text-slate-900 text-lg font-bold mb-md">Tổng quan hôm nay</Text>
      
      <View className="flex-row flex-wrap justify-between gap-md mb-md">
        <SummaryCard
          title="Tổng doanh thu"
          value={`${(overview?.revenue.total || 0).toLocaleString('vi-VN')}đ`}
          icon={DollarSign}
          iconColor="#10b981"
        />
        <SummaryCard
          title="Xe trong bãi"
          value={overview?.inYard || 0}
          icon={Car}
          iconColor="#3b82f6"
        />
      </View>

      <View className="flex-row flex-wrap justify-between gap-md">
        <SummaryCard
          title="Lượt vào"
          value={overview?.traffic.entries || 0}
          icon={TrendingUp}
          iconColor="#8b5cf6"
        />
        <SummaryCard
          title="Lượt ra"
          value={overview?.traffic.exits || 0}
          icon={ArrowRightLeft}
          iconColor="#f59e0b"
        />
      </View>
    </View>
  );
};
