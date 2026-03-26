import { AppHeader } from '@/shared/components/ui';
import {
  ReportDashboardMenu,
  ReportDashboardOverview,
} from '@/shared/features/reports/components';
import React from 'react';
import { ScrollView, View } from 'react-native';

export default function ReportsDashboard() {
  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <AppHeader 
        title="Báo cáo" 
        showLeftButton={false} 
      />
      
      <ScrollView className="flex-1 px-md">
        <ReportDashboardOverview />
        <ReportDashboardMenu />
      </ScrollView>
    </View>
  );
}
