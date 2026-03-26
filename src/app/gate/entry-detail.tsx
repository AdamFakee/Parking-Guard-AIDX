import { AppHeader } from '@/shared/components/ui';
import { COLORS, SHADOW } from '@/shared/constants';
import { formatDisplayPlate, getEntryById, VEHICLE_TYPE_LABELS } from '@/shared/features/gate';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { Calendar, Clock, CreditCard, Info, MapPin } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: entry, isLoading, error } = useQuery({
    queryKey: ['entry-detail', id],
    queryFn: () => getEntryById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-50">
        <AppHeader title="Chi tiết lượt xe" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.brand.blue} />
        </View>
      </View>
    );
  }

  if (error || !entry) {
    return (
      <View className="flex-1 bg-slate-50">
        <AppHeader title="Chi tiết lượt xe" />
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-slate-400 text-center text-lg font-medium">
            Không tìm thấy thông tin lượt xe này.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <AppHeader title="Chi tiết lượt xe" />
      
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Photos Section */}
        <View className="bg-white p-4" style={SHADOW.bottom}>
          <Text className="text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest">Ảnh khi vào</Text>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <View className="aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-100">
                <Image source={{ uri: entry.photoIn1 }} style={{width: '100%', height: '100%'}} contentFit="cover" />
              </View>
              <Text className="text-center text-[10px] text-slate-400 mt-1.5 font-medium">Toàn cảnh</Text>
            </View>
            <View className="flex-1">
              <View className="aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-100">
                <Image source={{ uri: entry.photoIn2 }} style={{width: '100%', height: '100%'}} contentFit="contain" />
              </View>
              <Text className="text-center text-[10px] text-slate-400 mt-1.5 font-medium">Biển số</Text>
            </View>
          </View>
          
          {entry.status === 'OUT' && (
            <View className="mt-6 pt-6 border-t border-slate-50">
              <Text className="text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest">Ảnh khi ra</Text>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <View className="aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-100">
                    <Image source={entry.photoOut1 || ''} className="w-full h-full" contentFit="cover" transition={200} />
                  </View>
                  <Text className="text-center text-[10px] text-slate-400 mt-1.5 font-medium">Toàn cảnh</Text>
                </View>
                <View className="flex-1">
                  <View className="aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-100">
                    <Image source={entry.photoOut2 || ''} className="w-full h-full" contentFit="cover" transition={200} />
                  </View>
                  <Text className="text-center text-[10px] text-slate-400 mt-1.5 font-medium">Biển số</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Info Section */}
        <View className="p-4 gap-4">
          {/* Main Status & Plate */}
          <View className="bg-white rounded-3xl p-5 border border-slate-100" style={SHADOW.bottom}>
            <View className="flex-row justify-between items-start mb-4">
              <View>
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Thông tin xe</Text>
                <Text className="text-3xl font-black text-slate-800">{formatDisplayPlate(entry.plateText)}</Text>
              </View>
              <View className={`px-4 py-1.5 rounded-full ${entry.status === 'IN' ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                <Text className={`font-black text-[10px] uppercase ${entry.status === 'IN' ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {entry.status === 'IN' ? 'Đang trong bãi' : 'Đã ra'}
                </Text>
              </View>
            </View>

            <View className="h-[1px] bg-slate-50 w-full mb-4" />

            <View className="gap-3">
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center">
                  <CreditCard size={16} color={COLORS.brand.blue} />
                </View>
                <View>
                  <Text className="text-[10px] text-slate-400 font-bold uppercase">Mã thẻ</Text>
                  <Text className="text-slate-700 font-mono font-bold">{entry.cardUid || 'THẺ LƯỢT'}</Text>
                </View>
              </View>
              
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-indigo-50 items-center justify-center">
                  <Info size={16} color="#6366f1" />
                </View>
                <View>
                  <Text className="text-[10px] text-slate-400 font-bold uppercase">Loại xe</Text>
                  <Text className="text-slate-700 font-bold uppercase">{VEHICLE_TYPE_LABELS[entry.vehicleType]}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Time & History */}
          <View className="bg-white rounded-3xl p-5 border border-slate-100" style={SHADOW.bottom}>
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Lịch sử hoạt động</Text>
            
            <View className="gap-6">
              <View className="flex-row gap-4">
                <View className="items-center">
                  <View className="w-4 h-4 rounded-full bg-emerald-500 border-4 border-emerald-100" />
                  <View className="w-[2px] flex-1 bg-slate-100 my-1" />
                </View>
                <View className="flex-1 pb-1">
                  <View className="flex-row items-center gap-2 mb-1">
                    <MapPin size={12} color="#94a3b8" />
                    <Text className="text-xs font-bold text-slate-700">Thời điểm vào</Text>
                  </View>
                  <View className="flex-row gap-4">
                    <View className="flex-row items-center gap-1.5">
                      <Calendar size={14} color="#64748b" />
                      <Text className="text-slate-500 text-xs">{format(new Date(entry.entryTime), 'dd/MM/yyyy')}</Text>
                    </View>
                    <View className="flex-row items-center gap-1.5">
                      <Clock size={14} color="#64748b" />
                      <Text className="text-slate-500 text-xs">{format(new Date(entry.entryTime), 'HH:mm:ss')}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View className="flex-row gap-4">
                <View className="items-center">
                  <View className={`w-4 h-4 rounded-full ${entry.status === 'OUT' ? 'bg-amber-500 border-4 border-amber-100' : 'bg-slate-200'}`} />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-1">
                    <MapPin size={12} color="#94a3b8" />
                    <Text className={`text-xs font-bold ${entry.status === 'OUT' ? 'text-slate-700' : 'text-slate-300'}`}>Thời điểm ra</Text>
                  </View>
                  {entry.status === 'OUT' ? (
                    <View className="flex-row gap-4">
                      <View className="flex-row items-center gap-1.5">
                        <Calendar size={14} color="#64748b" />
                        <Text className="text-slate-500 text-xs">{format(new Date(entry.exitTime!), 'dd/MM/yyyy')}</Text>
                      </View>
                      <View className="flex-row items-center gap-1.5">
                        <Clock size={14} color="#64748b" />
                        <Text className="text-slate-500 text-xs">{format(new Date(entry.exitTime!), 'HH:mm:ss')}</Text>
                      </View>
                    </View>
                  ) : (
                    <Text className="text-slate-300 text-xs italic">Chưa có thông tin xe ra</Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {entry.status === 'OUT' && (
             <View className="bg-white rounded-3xl p-5 border border-slate-100" style={SHADOW.bottom}>
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Thanh toán</Text>
                <View className="flex-row justify-between mb-2">
                    <Text className="text-slate-500 text-xs">Phí gửi xe</Text>
                    <Text className="text-slate-700 font-bold text-xs">{entry.feeAmount?.toLocaleString()}đ</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                    <Text className="text-slate-500 text-xs">Hình thức</Text>
                    <Text className="text-slate-700 font-bold text-xs uppercase">{entry.paymentMethod === 'cash' ? 'Tiền mặt' : entry.paymentMethod === 'monthly' ? 'Thẻ tháng' : 'Chuyển khoản QR'}</Text>
                </View>
             </View>
          )}

          {entry.isLostCard && (
             <View className="bg-red-50 rounded-3xl p-5 border border-red-100">
                <Text className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2">Thông tin mất thẻ</Text>
                <Text className="text-red-700 font-bold mb-1">Ghi chú:</Text>
                <Text className="text-red-600 text-sm leading-relaxed">{entry.lostCardReason || 'Không có ghi chú chi tiết'}</Text>
             </View>
          )}

          {entry.plateMatch === false && (
             <View className="bg-amber-50 rounded-3xl p-5 border border-amber-100">
                <Text className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-2">Cảnh báo sai biển số</Text>
                <Text className="text-amber-700 font-bold mb-1">Lý do xác nhận ra:</Text>
                <Text className="text-amber-600 text-sm leading-relaxed">{entry.mismatchReason || 'Xác nhận biển số không khớp thủ công'}</Text>
             </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
