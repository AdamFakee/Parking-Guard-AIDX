import {
  Clock,
  Coins,
  CreditCard,
  History,
  TrendingDown,
  TrendingUp,
  User,
  X,
} from 'lucide-react-native';
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Text,
  TouchableOpacity,
  View,
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
      <View key={item.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-3">
        {/* Card Header: Staff & Status */}
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center gap-3">
            <View className="size-9 bg-white rounded-xl items-center justify-center border border-slate-200">
              <User size={18} color="#64748B" />
            </View>
            <View>
              <Text className="font-bold text-slate-800">{item.staff?.name || 'Hệ thống'}</Text>
              <Text className="text-[10px] text-slate-400 font-medium">
                {new Date(item.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • {new Date(item.startTime).toLocaleDateString('vi-VN')}
              </Text>
            </View>
          </View>
          <View className={`px-2 py-0.5 rounded-md ${item.status === 'open' ? 'bg-green-100' : 'bg-slate-200'}`}>
            <Text className={`text-[9px] font-bold uppercase ${item.status === 'open' ? 'text-green-600' : 'text-slate-500'}`}>
              {item.status === 'open' ? 'Hoạt động' : 'Đã đóng'}
            </Text>
          </View>
        </View>

        {/* Revenue Stats */}
        <View className="flex-row gap-3">
          <View className="flex-1">
             <Text className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Tiền mặt</Text>
             <Text className="font-bold text-slate-900">{formatCurrency(item.cashRevenue || 0)}</Text>
          </View>
          <View className="flex-1">
             <Text className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Chuyển khoản</Text>
             <Text className="font-bold text-slate-900">{formatCurrency(item.qrRevenue || 0)}</Text>
          </View>
        </View>

        {item.status === 'closed' && (
          <View className="mt-2 pt-2 border-t border-slate-200">
            <View className="flex-row justify-between items-center">
              <Text className="text-[10px] font-bold text-slate-400 uppercase">Thực nhận</Text>
              <Text className="font-bold text-slate-900">{formatCurrency(item.actualCash || 0)}</Text>
            </View>
            {isDiscrepancy && (
              <Text className={`text-[10px] font-bold mt-1 ${diff < 0 ? 'text-red-500' : 'text-amber-500'}`}>
                Chênh lệch: {formatCurrency(diff)}
              </Text>
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
        <View className="bg-white rounded-t-3xl min-h-[95%] flex-col">
          {/* Header */}
          <View className="flex-row items-center justify-between p-6 border-b border-slate-100">
            <View className="flex-row items-center gap-3">
              <View className="size-10 bg-blue-50 rounded-xl items-center justify-center">
                <History size={24} color="#3B82F6" />
              </View>
              <View>
                <Text className="text-xl font-bold text-slate-900">Lịch sử ca làm việc</Text>
                <Text className="text-slate-500 text-xs">Thống kê doanh thu & Bàn giao</Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => setVisible(false)}
              className="size-10 bg-slate-50 rounded-full items-center justify-center"
            >
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Body Content */}
          <View className="flex-1">
            {isLoading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="mt-4 text-slate-400 font-bold text-xs uppercase tracking-widest">Đang tải dữ liệu...</Text>
              </View>
            ) : (
              <FlatList
                data={history}
                renderItem={renderShiftItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View className="py-24 px-12 items-center justify-center">
                    <View className="size-20 bg-slate-50 rounded-3xl items-center justify-center mb-6 border border-slate-100">
                      <History size={40} color="#CBD5E1" />
                    </View>
                    <Text className="text-slate-900 font-bold text-lg text-center mb-1">Chưa có lịch sử</Text>
                    <Text className="text-slate-400 text-center text-sm">
                      Dữ liệu ca làm việc sẽ xuất hiện ở đây sau khi kết thúc ca.
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
});

ShiftHistoryModal.displayName = 'ShiftHistoryModal';