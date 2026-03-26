import { X } from 'lucide-react-native';
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { TParkingEntry } from '../types/gate.types';
import { VehicleSearch } from './vehicle-search';

export interface SearchActiveEntryModalRef {
  open: (initialPlate?: string, onlyNoUid?: boolean) => void;
  close: () => void;
}

interface Props {
  onSelect: (entry: TParkingEntry) => void;
}

export const SearchActiveEntryModal = forwardRef<SearchActiveEntryModalRef, Props>(({ onSelect }, ref) => {
  const [isVisible, setIsVisible] = useState(false);
  const [initialPlate, setInitialPlate] = useState('');
  const [onlyNoUid, setOnlyNoUid] = useState(false);
  const [searchKey, setSearchKey] = useState(0);

  useImperativeHandle(ref, () => ({
    open: (plate = '', filterNoUid = false) => {
      setInitialPlate(plate);
      setOnlyNoUid(filterNoUid);
      setSearchKey(prev => prev + 1);
      setIsVisible(true);
    },
    close: () => setIsVisible(false),
  }));

  const handleSelect = (entry: TParkingEntry) => {
    onSelect(entry);
    setIsVisible(false);
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={() => setIsVisible(false)}
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="pt-12 pb-4 px-4 bg-white border-b border-slate-100 flex-row items-center">
          <Pressable onPress={() => setIsVisible(false)} className="p-2 -ml-2">
            <X size={24} color="#475569" />
          </Pressable>
          <Text className="flex-1 text-center text-lg font-bold text-slate-800 mr-8">Tìm xe trong bãi</Text>
        </View>

        <VehicleSearch 
          key={searchKey}
          onSelect={handleSelect}
          initialPlate={initialPlate}
          initialOnlyNoUid={onlyNoUid}
          autoFocus={true}
        />
      </View>
    </Modal>
  );
});

SearchActiveEntryModal.displayName = 'SearchActiveEntryModal';
