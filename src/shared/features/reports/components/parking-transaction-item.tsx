import { formatDisplayPlate } from '@/shared/features/gate/utils';
import { ParkingEntry } from '@/shared/db';
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  motorbike: 'Xe máy',
  car: 'Ô tô',
  ebike: 'Xe điện',
};

interface ParkingTransactionItemProps {
  item: ParkingEntry;
  onPress?: (item: ParkingEntry) => void;
  plate?: string;
  timeLabel?: string;
  imageUri?: string;
  rightContent?: React.ReactNode;
}

export const ParkingTransactionItem = ({
  item,
  onPress,
  plate,
  timeLabel,
  imageUri,
  rightContent,
}: ParkingTransactionItemProps) => {
  const displayPlate = formatDisplayPlate(plate || item.plateText);
  const displayTime = timeLabel;
  const vehicleLabel = VEHICLE_TYPE_LABELS[item.vehicleType] || item.vehicleType;
  const displayImage = imageUri || item.photoIn1;

  return (
    <Pressable 
      onPress={onPress ? () => onPress(item) : undefined}
      disabled={!onPress}
      className="flex-row items-center p-4 border-b border-slate-100 bg-white active:bg-slate-50"
    >
      {/* Image Section */}
      <View className="w-20 h-16 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
        <Image source={{ uri: displayImage }} className="w-full h-full" resizeMode="cover" />
      </View>

      {/* Info Section */}
      <View className="flex-1 ml-4">
        <Text className="text-lg font-bold text-slate-800">{displayPlate}</Text>
        {displayTime && (
          <Text className="text-xs text-slate-500">{displayTime}</Text>
        )}
        <Text className="text-[10px] text-slate-400 mt-1 uppercase">
          Loại phương tiện: {vehicleLabel}
        </Text>
      </View>

      {/* Custom Right Content */}
      {rightContent && (
        <View className="ml-2">
          {rightContent}
        </View>
      )}
    </Pressable>
  );
};
