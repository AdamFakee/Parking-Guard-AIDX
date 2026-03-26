import { AppHeader } from '@/shared/components/ui';
import {
  ReportDashboardMenu,
  ReportDashboardOverview
} from '@/shared/features/reports/components';
import { useReportOverview } from '@/shared/features/reports/hooks/use-report-overview';
import React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

export default function ReportsDashboard() {
  const { data: overview, isLoading, refetch } = useReportOverview();

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <AppHeader 
        title="Báo cáo" 
        showLeftButton={false} 
      />
      
      <ScrollView 
        className="flex-1 px-md"
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#3b82f6" />
        }
      >
        <ReportDashboardOverview overview={overview} />
        <ReportDashboardMenu />
      </ScrollView>
    </View>
  );
}
