import { format } from 'date-fns';
import { Search, X } from 'lucide-react-native';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { searchActiveEntries } from '../apis/gate.api';
import { TParkingEntry, TSearchVehicleType } from '../types/gate.types';

type ParkingEntry = TParkingEntry;

export interface SearchActiveEntryModalRef {
  open: (initialPlate?: string, onlyNoUid?: boolean) => void;
  close: () => void;
}

interface Props {
  onSelect: (entry: ParkingEntry) => void;
}

export const SearchActiveEntryModal = forwardRef<SearchActiveEntryModalRef, Props>(({ onSelect }, ref) => {
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [outPlate, setOutPlate] = useState('');
  const [searchType, setSearchType] = useState<'out' | 'in'>('out');
  const [onlyNoUid, setOnlyNoUid] = useState(false);
  const [vehicleType, setVehicleType] = useState<TSearchVehicleType>('all');
  const [entries, setEntries] = useState<ParkingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useImperativeHandle(ref, () => ({
    open: (initialPlate, onlyNoUidFlag = false) => {
      setIsVisible(true);
      setOnlyNoUid(onlyNoUidFlag);
      setVehicleType('all');
      if (initialPlate) {
        setOutPlate(initialPlate);
        setSearchType('out');
        setSearchQuery(initialPlate);
        handleSearch(initialPlate, onlyNoUidFlag, 'all');
      } else {
        setSearchType('in');
        setSearchQuery('');
        setEntries([]);
      }
    },
    close: () => setIsVisible(false),
  }));

  const handleSearch = useCallback(async (query: string, filterNoUid?: boolean, vType?: TSearchVehicleType) => {
    if (!query) {
      setEntries([]);
      return;
    }
    setIsLoading(true);
    try {
      const results = await searchActiveEntries(query, filterNoUid ?? onlyNoUid, vType ?? vehicleType);
      setEntries(results as ParkingEntry[]);

      console.log(results.map(e => e.cardUid))
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onlyNoUid, vehicleType]);

  useEffect(() => {
    if (searchType === 'out') return;

    const timer = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      } else {
        setEntries([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, searchType, handleSearch]);

  const renderItem = ({ item }: { item: ParkingEntry }) => (
    <Pressable 
      onPress={() => {
        onSelect(item);
        setIsVisible(false);
      }}
      className="flex-row items-center p-4 border-b border-slate-100 bg-white active:bg-slate-50"
    >
      <View className="w-20 h-16 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
        <Image 
          source={{ uri: item.photoIn1 }} 
          className="w-full h-full" 
          resizeMode="cover" 
        />
      </View>
      <View className="flex-1 ml-4">
        <Text className="text-lg font-bold text-slate-800">{item.plateText}</Text>
        <Text className="text-xs text-slate-500">
          Vào: {format(item.entryTime, 'HH:mm dd/MM/yyyy')}
        </Text>
        <Text className="text-[10px] text-slate-400 mt-1 uppercase">
          {item.vehicleType === 'car' ? '🚗 Ô tô' : item.vehicleType === 'motorbike' ? '🏍️ Xe máy' : '🚲 Xe điện'}
        </Text>
      </View>
      <View className="bg-blue-50 px-2 py-1 rounded">
        <Text className="text-blue-600 text-[10px] font-bold">CHỌN</Text>
      </View>
    </Pressable>
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={() => setIsVisible(false)}
    >
      <View className="flex-1 bg-slate-50">
        {/* Header */}
        <View className="pt-12 pb-4 px-4 bg-white border-b border-slate-100 flex-row items-center">
          <Pressable onPress={() => setIsVisible(false)} className="p-2 -ml-2">
            <X size={24} color="#475569" />
          </Pressable>
          <Text className="flex-1 text-center text-lg font-bold text-slate-800 mr-8">Tìm xe trong bãi</Text>
        </View>

        {/* Options */}
        <View className="flex-row p-4 gap-2 bg-white">
          <Pressable 
            onPress={() => {
              setSearchType('out');
              setSearchQuery(outPlate);
              handleSearch(outPlate);
            }}
            className={`flex-1 flex-row items-center justify-center py-3 px-2 rounded-xl border ${searchType === 'out' ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}
          >
            <View className={`w-4 h-4 rounded-full border items-center justify-center mr-2 ${searchType === 'out' ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
              {searchType === 'out' && <View className="w-1.5 h-1.5 rounded-full bg-white" />}
            </View>
            <Text className={`text-xs font-bold ${searchType === 'out' ? 'text-blue-600' : 'text-slate-500'}`}>Biển số RA</Text>
          </Pressable>
          
          <Pressable 
            onPress={() => {
              setSearchType('in');
              setSearchQuery('');
              setEntries([]);
            }}
            className={`flex-1 flex-row items-center justify-center py-3 px-2 rounded-xl border ${searchType === 'in' ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}
          >
            <View className={`w-4 h-4 rounded-full border items-center justify-center mr-2 ${searchType === 'in' ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
              {searchType === 'in' && <View className="w-1.5 h-1.5 rounded-full bg-white" />}
            </View>
            <Text className={`text-xs font-bold ${searchType === 'in' ? 'text-blue-600' : 'text-slate-500'}`}>Biển số VÀO</Text>
          </Pressable>
        </View>

        {/* Search Input / Display */}
        <View className="px-4 pb-4 bg-white">
          {searchType === 'out' ? (
            <View className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <Text className="text-xs text-slate-400 mb-1">Nhận diện biển số ra:</Text>
              <Text className="text-2xl font-black text-slate-800 tracking-wider font-mono">
                {outPlate || 'CHƯA NHẬN DIỆN'}
              </Text>
              {!outPlate && (
                <Text className="text-[10px] text-red-500 mt-1 italic">* Không tìm thấy biển số từ camera ra</Text>
              )}
            </View>
          ) : (
            <View className="flex-row items-center bg-slate-100 rounded-xl px-4 py-2 border border-blue-200">
              <Search size={20} color="#3b82f6" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Nhập biển số vào..."
                className="flex-1 ml-2 text-xl font-bold text-slate-800 h-12"
                autoFocus
                autoCapitalize="characters"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <X size={20} color="#94a3b8" />
                </Pressable>
              )}
            </View>
          )}
        </View>

        {/* Vehicle Type Filter */}
        <View className="flex-row px-4 pb-4 bg-white gap-2">
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
               className={`flex-1 py-2 rounded-lg border items-center justify-center ${vehicleType === item.id ? 'bg-[#eff6ff] border-blue-500' : 'bg-[#F8FAFC] border-slate-200'}`}
             >
               <Text className={`text-[11px] font-bold ${vehicleType === item.id ? 'text-blue-600' : 'text-slate-500'}`}>{item.label}</Text>
             </Pressable>
           ))}
        </View>

        {/* List */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center bg-white">
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            className="flex-1 bg-white"
            contentContainerStyle={{ paddingBottom: 24 }}
            ListEmptyComponent={
              <View className="items-center justify-center p-12">
                <Text className="text-slate-400 text-center text-sm">
                  {searchQuery 
                    ? `Không tìm thấy xe ${onlyNoUid ? 'không thẻ ' : ''}đang trong bãi khớp với biển số này` 
                    : (searchType === 'in' ? 'Vui lòng nhập biển số để tìm kiếm' : 'Không có dữ liệu nhận diện')}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </Modal>
  );
});

SearchActiveEntryModal.displayName = 'SearchActiveEntryModal';
