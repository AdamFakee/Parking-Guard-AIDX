import { AppHeader } from '@/shared/components/ui';
import { SummaryCard } from '@/shared/features/reports/components/summary-card';
import { useReportOverview } from '@/shared/features/reports/hooks/use-report-overview';
import { format } from 'date-fns';
import { useLocalSearchParams } from 'expo-router';
import {
  AlertTriangle,
  ArrowRightLeft,
  Car,
  CreditCard,
  DollarSign,
  ShieldAlert,
  TrendingUp,
  Users,
  XCircle
} from 'lucide-react-native';
import React from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

export default function OverviewDetailScreen() {
  const { start, end, label } = useLocalSearchParams<{ 
    start: string; 
    end: string; 
    label: string;
  }>();

  const startDate = start ? new Date(parseInt(start)) : undefined;
  const endDate = end ? new Date(parseInt(end)) : undefined;

  const { data: overview, isLoading, refetch } = useReportOverview(startDate, endDate);

  const renderSectionHeader = (title: string) => (
    <Text className="text-slate-900 text-lg font-bold mb-md mt-lg px-md">{title}</Text>
  );

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <AppHeader title={label || 'Chi tiết tổng quan'} />
      
      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#3b82f6" />
        }
      >
        <View className="p-md">
            <Text className="text-slate-500 text-sm mb-md px-md">
                {startDate && endDate ? (
                    `Thời gian: ${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`
                ) : 'Thời gian: Hôm nay'}
            </Text>

            {/* FINANCE */}
            {renderSectionHeader('Tài chính')}
            <View className="flex-row flex-wrap justify-between gap-md mb-md">
                <SummaryCard
                    title="Tổng doanh thu"
                    value={`${(overview?.finance?.total || 0).toLocaleString('vi-VN')}đ`}
                    icon={DollarSign}
                    iconColor="#10b981"
                    className="w-full"
                    isLoading={isLoading}
                />
                <SummaryCard
                    title="Tiền mặt"
                    value={`${(overview?.finance?.cash || 0).toLocaleString('vi-VN')}đ`}
                    icon={DollarSign}
                    iconColor="#3b82f6"
                    isLoading={isLoading}
                />
                <SummaryCard
                    title="Chuyển khoản (QR)"
                    value={`${(overview?.finance?.qr || 0).toLocaleString('vi-VN')}đ`}
                    icon={CreditCard}
                    iconColor="#8b5cf6"
                    isLoading={isLoading}
                />
                <SummaryCard
                    title="Thẻ tháng"
                    value={`${(overview?.finance?.monthly || 0).toLocaleString('vi-VN')}đ`}
                    icon={Users}
                    iconColor="#f59e0b"
                    isLoading={isLoading}
                />
                <SummaryCard
                    title="Phí mất thẻ"
                    value={`${(overview?.finance?.lostCardFee || 0).toLocaleString('vi-VN')}đ`}
                    icon={AlertTriangle}
                    iconColor="#ef4444"
                    isLoading={isLoading}
                />
                {/* Dummy view to prevent the last card from stretching */}
                <SummaryCard
                    title=""
                    value=""
                    icon={AlertTriangle}
                    iconColor="#ef4444"
                    className="invisible"
                />
            </View>

            {/* OPERATIONS */}
            {renderSectionHeader('Vận hành')}
            <View className="flex-row flex-wrap justify-between gap-md mb-md">
                <SummaryCard
                    title="Xe trong bãi (Hiện tại)"
                    value={overview?.traffic?.inYard || 0}
                    icon={Car}
                    iconColor="#3b82f6"
                    className="w-full"
                    isLoading={isLoading}
                />
                <SummaryCard
                    title="Lượt vào"
                    value={overview?.traffic?.entries || 0}
                    icon={TrendingUp}
                    iconColor="#10b981"
                    isLoading={isLoading}
                />
                <SummaryCard
                    title="Lượt ra"
                    value={overview?.traffic?.exits || 0}
                    icon={ArrowRightLeft}
                    iconColor="#f59e0b"
                    isLoading={isLoading}
                />
                {/* Dummy view to prevent the last card from stretching */}
                <SummaryCard
                    title=""
                    value=""
                    icon={AlertTriangle}
                    iconColor="#ef4444"
                    className="invisible"
                />
            </View>

            {/* SECURITY */}
            {renderSectionHeader('An ninh & Rủi ro')}
            <View className="flex-row flex-wrap justify-between gap-md mb-md">
                <SummaryCard
                    title="Biển số không khớp"
                    value={overview?.security?.mismatchCount || 0}
                    icon={ShieldAlert}
                    iconColor="#ef4444"
                    isLoading={isLoading}
                />
                <SummaryCard
                    title="Lượt hủy (VOID)"
                    value={overview?.security?.voidCount || 0}
                    icon={XCircle}
                    iconColor="#64748b"
                    isLoading={isLoading}
                />
                <SummaryCard
                    title="Vụ mất thẻ"
                    value={overview?.security?.lostCardsCount || 0}
                    icon={AlertTriangle}
                    iconColor="#f59e0b"
                    isLoading={isLoading}
                />
                {/* Dummy view to prevent the last card from stretching */}
                <SummaryCard
                    title=""
                    value=""
                    icon={AlertTriangle}
                    iconColor="#ef4444"
                    className="invisible"
                />
            </View>
        </View>
      </ScrollView>
    </View>
  );
}
