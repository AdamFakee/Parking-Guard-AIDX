import { format } from 'date-fns';
import { Search, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, Text, TextInput, View } from 'react-native';
import { searchActiveEntries } from '../apis/gate.api';
import { VEHICLE_TYPE_LABELS } from '../const';
import { TParkingEntry, TSearchVehicleType, TVehicleType } from '../types/gate.types';

interface Props {
  onSelect: (entry: TParkingEntry) => void;
  initialPlate?: string;
  initialOnlyNoUid?: boolean;
  autoFocus?: boolean;
}

export const VehicleSearch = ({ 
  onSelect, 
  initialPlate = '', 
  initialOnlyNoUid = false,
  autoFocus = false
}: Props) => {
  const [searchQuery, setSearchQuery] = useState(initialPlate);
  const onlyNoUid = initialOnlyNoUid;
  const [vehicleType, setVehicleType] = useState<TSearchVehicleType>('all');
  const [entries, setEntries] = useState<TParkingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = useCallback(async (query: string, filterNoUid?: boolean, vType?: TSearchVehicleType) => {
    if (!query || query.length < 2) {
      setEntries([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const results = await searchActiveEntries(query, filterNoUid ?? onlyNoUid, vType ?? vehicleType);
      setEntries(results as TParkingEntry[]);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onlyNoUid, vehicleType]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery && searchQuery.length >= 2) {
        handleSearch(searchQuery);
      } else if (!searchQuery) {
        setEntries([]);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  const renderItem = ({ item }: { item: TParkingEntry }) => (
    <Pressable 
      onPress={() => onSelect(item)}
      className="flex-row items-center p-4 border-b border-slate-100 bg-white active:bg-slate-50"
    >
      <View className="w-20 h-16 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
        <Image source={{ uri: item.photoIn1 }} className="w-full h-full" resizeMode="cover" />
      </View>
      <View className="flex-1 ml-4">
        <Text className="text-lg font-bold text-slate-800">{item.plateText}</Text>
        <Text className="text-xs text-slate-500">Vào: {format(item.entryTime, 'HH:mm dd/MM/yyyy')}</Text>
        <Text className="text-[10px] text-slate-400 mt-1 uppercase">
          Loại phương tiện: {VEHICLE_TYPE_LABELS[item.vehicleType as TVehicleType] || item.vehicleType}
        </Text>
      </View>
      <View className="bg-blue-50 px-2 py-1 rounded">
        <Text className="text-blue-600 text-[10px] font-bold">CHỌN</Text>
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-white">
      {/* Search Input Section */}
      <View className="px-4 py-4">
        <View className="flex-row items-center bg-slate-50 rounded-2xl px-4 border border-slate-200 focus:border-blue-500">
          <Search size={20} color={searchQuery ? "#3b82f6" : "#94a3b8"} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Nhập biển số để tìm kiếm..."
            className="flex-1 ml-3 text-xl font-bold text-slate-800 h-14"
            autoFocus={autoFocus}
            autoCapitalize="characters"
            placeholderTextColor="#94a3b8"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} className="p-2">
              <X size={20} color="#94a3b8" />
            </Pressable>
          )}
        </View>
        <View className="mt-2 ml-1">
          <Text className="text-[10px] text-slate-400">
            * Định dạng: 2 số tỉnh + 1-2 chữ + 3-5 số (VD: 51A12345, 59G11234)
          </Text>
          {onlyNoUid && (
            <Text className="text-[10px] text-amber-600 font-bold uppercase mt-1">
              * Đang tìm trong danh sách XE KHÔNG THẺ
            </Text>
          )}
        </View>
      </View>

      <View className="flex-row px-4 pb-4 gap-2">
         {[
           { id: 'all', label: 'Tất cả' },
           { id: 'motorbike', label: 'Xe máy' },
           { id: 'car', label: 'Ô tô' },
           { id: 'ebike', label: 'Xe điện' }
         ].map((item) => (
           <Pressable
             key={item.id}
             onPress={() => {
               setVehicleType(item.id as any);
               if (searchQuery) handleSearch(searchQuery, onlyNoUid, item.id as any);
             }}
             className={`flex-1 py-2 rounded-xl border items-center justify-center ${vehicleType === item.id ? 'bg-[#eff6ff] border-blue-500' : 'bg-[#F8FAFC] border-slate-200'}`}
           >
             <Text className={`text-[11px] font-bold ${vehicleType === item.id ? 'text-blue-600' : 'text-slate-500'}`}>{item.label}</Text>
           </Pressable>
         ))}
      </View>

      {/* List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center bg-white">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="mt-4 text-slate-400 text-xs">Đang tìm kiếm...</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <View className="items-center justify-center p-12">
              {searchQuery.length >= 2 ? (
                <>
                  <View className="w-16 h-16 bg-slate-50 rounded-full items-center justify-center mb-4">
                    <Search size={32} color="#cbd5e1" />
                  </View>
                  <Text className="text-slate-500 font-bold text-center">Không tìm thấy xe phù hợp</Text>
                  <Text className="text-slate-400 text-center text-xs mt-1">
                    Thử nhập biển số khác hoặc kiểm tra lại bộ lọc
                  </Text>
                </>
              ) : (
                <Text className="text-slate-400 text-center text-sm italic">
                  Vui lòng nhập ít nhất 2 ký tự để tìm kiếm
                </Text>
              )}
            </View>
          }
        />
      )}
    </View>
  );
};
