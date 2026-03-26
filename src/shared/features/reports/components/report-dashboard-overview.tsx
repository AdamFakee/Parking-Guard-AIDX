import { cn } from '@/shared/utils';
import {
  endOfDay,
  endOfMonth,
  startOfDay,
  startOfMonth,
  subDays
} from 'date-fns';
import { useRouter } from 'expo-router';
import { ArrowRightLeft, Car, ChevronRight, DollarSign, TrendingUp } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { RANGES, RANGE_LABELS } from '../constants';
import { useReportOverview } from '../hooks/use-report-overview';
import { DateRangeType } from '../types';
import { SummaryCard } from './summary-card';

export const ReportDashboardOverview = () => {
  const [range, setRange] = useState<DateRangeType>('today');
  const [dates, setDates] = useState<{ start: Date; end: Date }>({
    start: startOfDay(new Date()),
    end: endOfDay(new Date()),
  });

  const { data: overview, isLoading } = useReportOverview(dates.start, dates.end);

  const router = useRouter();
  const label = RANGE_LABELS[range];

  const handleRangePress = (newRange: DateRangeType) => {
    const now = new Date();
    let start = startOfDay(now);
    let end = endOfDay(now);

    switch (newRange) {
      case 'yesterday':
        start = startOfDay(subDays(now, 1));
        end = endOfDay(subDays(now, 1));
        break;
      case 'last7days':
        start = startOfDay(subDays(now, 6));
        end = endOfDay(now);
        break;
      case 'thisMonth':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
    }

    setRange(newRange);
    setDates({ start, end });
  };

  const handleDetailPress = () => {
    router.push({
      pathname: '/reports/overview-detail',
      params: {
        start: dates.start.getTime(),
        end: dates.end.getTime(),
        label: `Tổng quan ${label.toLowerCase()}`,
      }
    });
  };

  return (
    <View className="py-md">
      <View className="mb-md">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {RANGES.map((r) => {
            const isActive = range === r.value;
            return (
              <TouchableOpacity
                key={r.value}
                onPress={() => handleRangePress(r.value)}
                className={`px-md py-xs rounded-full border ${
                  isActive 
                    ? 'bg-blue-600 border-blue-600' 
                    : 'bg-white border-slate-200'
                }`}
              >
                <Text className={`text-sm font-medium ${
                  isActive ? 'text-white' : 'text-slate-600'
                }`}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View className="flex-row items-center justify-between mb-md">
        <Text className="text-slate-900 text-lg font-bold">Tổng quan {label.toLowerCase()}</Text>
        <Pressable 
          onPress={handleDetailPress}
          hitSlop={10}
          disabled={isLoading}
          className="flex-row items-center"
        >
          <Text className={cn("text-sm font-medium mr-xs", isLoading ? "text-slate-400" : "text-blue-600")}>
            Xem chi tiết
          </Text>
          <ChevronRight size={16} color={isLoading ? "#94a3b8" : "#2563eb"} />
        </Pressable>
      </View>
      
      <View className="flex-row flex-wrap justify-between gap-md mb-md">
        <SummaryCard
          title="Tổng doanh thu"
          value={`${(overview?.finance?.total || 0).toLocaleString('vi-VN')}đ`}
          icon={DollarSign}
          iconColor="#10b981"
          isLoading={isLoading}
        />
        <SummaryCard
          title="Xe trong bãi"
          value={overview?.traffic?.inYard || 0}
          icon={Car}
          iconColor="#3b82f6"
          isLoading={isLoading}
        />
      </View>

      <View className="flex-row flex-wrap justify-between gap-md">
        <SummaryCard
          title="Lượt vào"
          value={overview?.traffic?.entries || 0}
          icon={TrendingUp}
          iconColor="#8b5cf6"
          isLoading={isLoading}
        />
        <SummaryCard
          title="Lượt ra"
          value={overview?.traffic?.exits || 0}
          icon={ArrowRightLeft}
          iconColor="#f59e0b"
          isLoading={isLoading}
        />
      </View>
    </View>
  );
};
