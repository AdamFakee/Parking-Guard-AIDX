import { 
  Clock, 
  History, 
  X, 
  User, 
  Coins, 
  CreditCard, 
  TrendingDown,
  TrendingUp,
} from 'lucide-react-native';
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import {
  Modal,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useShiftHistory } from '../hooks';

export interface ShiftHistoryModalRef {
  open: () => void;
  close: () => void;
}

export const ShiftHistoryModal = forwardRef<ShiftHistoryModalRef>((_, ref) => {
  const [visible, setVisible] = useState(false);
  const { data: history, isLoading, refetch } = useShiftHistory();

  useImperativeHandle(ref, () => ({
    open: () => {
      setVisible(true);
      refetch();
    },
    close: () => setVisible(false),
  }));

  const formatCurrency = (val: number) => {
    return val.toLocaleString('vi-VN') + ' ₫';
  };

  const renderShiftItem = ({ item }: { item: any }) => {
    const isDiscrepancy = item.actualCash !== null && item.actualCash !== item.expectedCash;
    const diff = item.actualCash !== null ? item.actualCash - item.expectedCash : 0;

    return (
      <View className="bg-white p-4 rounded-2xl border border-slate-100 mb-3 shadow-sm">
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-row items-center gap-2">
            <View className="size-8 bg-blue-50 rounded-full items-center justify-center">
              <User size={16} color="#3B82F6" />
            </View>
            <View>
              <Text className="font-bold text-slate-800">{item.staff?.name || 'Unknown'}</Text>
              <View className="flex-row items-center gap-1">
                <Clock size={10} color="#64748B" />
                <Text className="text-[10px] text-slate-500">
                  {new Date(item.startTime).toLocaleString('vi-VN')}
                </Text>
              </View>
            </View>
          </View>
          <View className={`px-2 py-0.5 rounded-md ${item.status === 'open' ? 'bg-green-100' : 'bg-slate-100'}`}>
            <Text className={`text-[10px] font-bold uppercase ${item.status === 'open' ? 'text-green-600' : 'text-slate-500'}`}>
              {item.status === 'open' ? 'Đang mở' : 'Đã đóng'}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-4 mb-3">
          <View className="flex-1 bg-slate-50 p-2 rounded-xl">
            <View className="flex-row items-center gap-1 mb-1">
              <Coins size={12} color="#64748B" />
              <Text className="text-[10px] text-slate-500">Tiền mặt</Text>
            </View>
            <Text className="font-bold text-slate-800 text-xs">{formatCurrency(item.cashRevenue || 0)}</Text>
          </View>
          <View className="flex-1 bg-slate-50 p-2 rounded-xl">
            <View className="flex-row items-center gap-1 mb-1">
              <CreditCard size={12} color="#64748B" />
              <Text className="text-[10px] text-slate-500">Chuyển khoản</Text>
            </View>
            <Text className="font-bold text-slate-800 text-xs">{formatCurrency(item.qrRevenue || 0)}</Text>
          </View>
        </View>

        {item.status === 'closed' && (
          <View className="border-t border-slate-50 pt-3">
            <View className="flex-row justify-between mb-2">
              <Text className="text-[10px] text-slate-500">Tiền thực tế:</Text>
              <Text className="text-xs font-bold text-slate-800">{formatCurrency(item.actualCash || 0)}</Text>
            </View>
            
            {isDiscrepancy && (
              <View className={`p-2 rounded-lg flex-row items-center gap-2 ${diff < 0 ? 'bg-red-50' : 'bg-orange-50'}`}>
                {diff < 0 ? <TrendingDown size={14} color="#EF4444" /> : <TrendingUp size={14} color="#F59E0B" />}
                <View className="flex-1">
                  <Text className={`text-[10px] font-bold ${diff < 0 ? 'text-red-600' : 'text-orange-600'}`}>
                    Chênh lệch: {formatCurrency(diff)}
                  </Text>
                  {item.discrepancyReason && (
                    <Text className="text-[10px] text-slate-500 italic mt-0.5">
                      Lý do: {item.discrepancyReason}
                    </Text>
                  )}
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={() => setVisible(false)}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-white rounded-t-3xl min-h-[90%] flex-col">
          {/* Header */}
          <View className="flex-row items-center justify-between p-6 border-b border-slate-100">
            <View className="flex-row items-center gap-3">
              <View className="size-10 bg-blue-50 rounded-xl items-center justify-center">
                <History size={24} color="#3B82F6" />
              </View>
              <View>
                <Text className="text-xl font-bold text-slate-900">Lịch sử ca làm</Text>
                <Text className="text-slate-500 text-xs">Thống kê & Đối soát doanh thu</Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => setVisible(false)}
              className="size-10 bg-slate-50 rounded-full items-center justify-center"
            >
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="mt-4 text-slate-400">Đang tải lịch sử...</Text>
            </View>
          ) : (
            <FlatList
              data={history}
              renderItem={renderShiftItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
              ListEmptyComponent={
                <View className="py-20 items-center justify-center">
                  <History size={48} color="#CBD5E1" />
                  <Text className="mt-4 text-slate-400 italic">Chưa có lịch sử ca làm</Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
});

ShiftHistoryModal.displayName = 'ShiftHistoryModal';
