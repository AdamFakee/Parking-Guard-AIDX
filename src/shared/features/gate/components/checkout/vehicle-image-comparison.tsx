import { COLORS, SHADOW } from '@/shared/constants/color.const';
import { formatDisplayPlate } from '@/shared/features/gate/utils';
import React from 'react';
import { Image, Text, View } from 'react-native';

interface Props {
  entryPlate: string;
  exitPlate: string;
  entryPhoto: string;
  entryPhoto2?: string | null;
  exitPhoto: string;
  exitPhoto2?: string | null;
  plateMatch: boolean;
  children?: React.ReactNode; // For Mismatch Reason input
}

export const VehicleImageComparison = ({ 
  entryPlate, 
  exitPlate, 
  entryPhoto, 
  entryPhoto2, 
  exitPhoto, 
  exitPhoto2, 
  plateMatch,
  children 
}: Props) => {
  return (
    <View 
      className="bg-white rounded-2xl p-5 mb-4 border border-[#F1F5F9]"
      style={[SHADOW.bottom, { elevation: 2 }]}
    >
      {/* Hình ảnh vào */}
      <View className="w-full">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hình ảnh vào</Text>
          <Text className="text-sm font-black text-[#1E293B]">{formatDisplayPlate(entryPlate)}</Text>
        </View>
        <View className="w-full aspect-[16/9] bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
          <Image source={{ uri: entryPhoto }} className="w-full h-full" resizeMode="cover" />
          {entryPhoto2 && entryPhoto2 !== entryPhoto && (
            <View className="absolute bottom-2 left-2 w-1/3 aspect-[3/1] border border-white rounded overflow-hidden">
              <Image source={{ uri: entryPhoto2 }} className="w-full h-full" resizeMode="contain" />
            </View>
          )}
        </View>
      </View>

      {/* Divider with Match Status */}
      <View className="flex-row items-center my-4">
        <View className="flex-1 h-[1px] bg-slate-100" />
        <View 
          className="px-3 py-1.5 rounded-full border mx-4"
          style={{ 
            backgroundColor: plateMatch ? '#f0fdf4' : '#fef2f2', 
            borderColor: plateMatch ? '#bbf7d0' : '#fecaca' 
          }}
        >
          <Text className="text-[10px] font-bold uppercase" style={{ color: plateMatch ? COLORS.brand.green : COLORS.brand.red }}>
            {plateMatch ? 'Biển số trùng khớp ✓' : 'Biển số không khớp ✗'}
          </Text>
        </View>
        <View className="flex-1 h-[1px] bg-slate-100" />
      </View>

      {/* Hình ảnh ra */}
      <View className="w-full">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hình ảnh ra</Text>
          <Text className="text-sm font-black text-[#1E293B]">{formatDisplayPlate(exitPlate) || '---'}</Text>
        </View>
        <View className="w-full aspect-[16/9] bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
          <Image source={{ uri: exitPhoto }} className="w-full h-full" resizeMode="cover" />
          {exitPhoto2 && (
            <View className="absolute bottom-2 right-2 w-1/3 aspect-[3/1] border border-white rounded overflow-hidden">
              <Image source={{ uri: exitPhoto2 }} className="w-full h-full" resizeMode="contain" />
            </View>
          )}
        </View>
      </View>

      {/* Optional Children (Like Mismatch Reason) */}
      {children}
    </View>
  );
};
