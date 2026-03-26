import { AppHeader } from '@/shared/components/ui';
import { 
  ShiftDetailIncidents, 
  ShiftDetailSummary, 
  ShiftDetailTransactions, 
  TabButton 
} from '@/shared/features/reports/components';
import { useShiftDetails } from '@/shared/features/reports/hooks/use-shift-details';
import { useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Clock, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

export default function ShiftDetailScreen() {
  const { shiftId } = useLocalSearchParams<{ shiftId: string }>();
  const [activeTab, setActiveTab] = useState<'summary' | 'entries' | 'exits' | 'incidents'>('summary');

  const { data, isLoading, refetch } = useShiftDetails(shiftId!);

  if (isLoading) return <View className="flex-1 bg-[#F8FAFC]"><AppHeader title="Đang tải..." /></View>;
  if (!data) return <View className="flex-1 bg-[#F8FAFC]"><AppHeader title="Không tìm thấy ca làm" /></View>;

  const { shift, transactions } = data;
  const startTime = format(new Date(shift.startTime), 'HH:mm dd/MM/yyyy', { locale: vi });
  const endTime = shift.endTime 
    ? format(new Date(shift.endTime), 'HH:mm dd/MM/yyyy', { locale: vi })
    : 'Đang diễn ra';

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <AppHeader title={`Chi tiết ca #${shift.id.slice(-4)}`} />
      
      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#3b82f6" />
        }
      >
        {/* Người trực & Thời gian */}
        <View className="bg-white p-md border-b border-slate-100">
          <View className="flex-row items-center mb-sm">
            <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-md">
              <User size={20} color="#3b82f6" />
            </View>
            <View>
              <Text className="text-slate-900 font-bold text-base">{shift.staff?.name}</Text>
              <Text className="text-slate-400 text-xs">Phụ trách ca làm việc</Text>
            </View>
            <View className="ml-auto px-sm py-px bg-green-100 rounded">
              <Text className="text-green-600 text-[10px] uppercase font-bold">{shift.status}</Text>
            </View>
          </View>
          
          <View className="flex-row items-center">
            <Clock size={14} color="#64748b" />
            <Text className="text-slate-500 text-xs ml-xs">
              {startTime} — {endTime}
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row bg-white border-b border-slate-100">
          <TabButton 
            label="Tổng quan" 
            active={activeTab === 'summary'} 
            onPress={() => setActiveTab('summary')} 
          />
          <TabButton 
            label="Xe vào" 
            active={activeTab === 'entries'} 
            onPress={() => setActiveTab('entries')} 
            count={transactions.entries.length}
          />
          <TabButton 
            label="Xe ra" 
            active={activeTab === 'exits'} 
            onPress={() => setActiveTab('exits')} 
            count={transactions.exits.length}
          />
          <TabButton 
            label="Sự cố" 
            active={activeTab === 'incidents'} 
            onPress={() => setActiveTab('incidents')} 
            count={transactions.lostCards.length}
          />
        </View>

        <View className="px-md">
          {activeTab === 'summary' && <ShiftDetailSummary shift={shift} />}
          {activeTab === 'entries' && (
            <ShiftDetailTransactions list={transactions.entries} type="IN" />
          )}
          {activeTab === 'exits' && (
            <ShiftDetailTransactions list={transactions.exits} type="OUT" />
          )}
          {activeTab === 'incidents' && (
            <ShiftDetailIncidents list={transactions.lostCards} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
