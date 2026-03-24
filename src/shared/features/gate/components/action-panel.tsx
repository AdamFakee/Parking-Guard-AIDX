import React, { memo, useMemo } from 'react';
import { View, Text, Pressable, useColorScheme } from 'react-native';
import { Camera as CameraIcon, RotateCcw, ArrowRight } from 'lucide-react-native';
import { Button } from '@/shared/components/ui';
import { useScanPlateStore } from '../store/scan-plate.store';
import { checkLegitPlate, formatDisplayPlate } from '../utils';

interface ActionPanelProps {
  onCapture: () => void;
  onConfirm: () => void;
}

/** 
 * Panel điều khiển ở dưới màn hình 
 * Hiển thị kết quả nhận diện biển số và các nút bấm hành động
 */
export const ActionPanel = memo(({ onCapture, onConfirm }: ActionPanelProps) => {
  const { detectedPlate, isCapturing, reset } = useScanPlateStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const isValid = useMemo(() => checkLegitPlate(detectedPlate), [detectedPlate]);

  return (
    <View className={`${isDark ? 'bg-[#0f172a]' : 'bg-white'} rounded-t-[32px] p-6 gap-4 shadow-xl`}>
      <View className={`${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-100 border-slate-200'} rounded-2xl p-4 items-center border`}>
        <Text className="text-[#64748b] text-[11px] uppercase tracking-widest">Biển số nhận diện</Text>
        <Text className={`text-[40px] font-black tracking-[4px] ${isValid ? 'text-[#22c55e]' : (isDark ? 'text-white' : 'text-slate-900')}`}>
          {formatDisplayPlate(detectedPlate)}
        </Text>
      </View>
      <View className="flex-row gap-3">
        <Button 
          label="Chụp"
          onPress={onCapture}
          disabled={isCapturing}
          loading={isCapturing}
          leftIcon={CameraIcon}
          className="flex-1 h-[60px] rounded-2xl"
          textClassName="text-lg"
        />
        {detectedPlate !== '' && !isCapturing && (
          <Pressable 
            onPress={reset} 
            className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'} w-[60px] h-[60px] rounded-2xl items-center justify-center border`}
          >
            <RotateCcw size={20} color="#94a3b8" />
          </Pressable>
        )}
      </View>
      {isValid && !isCapturing && (
        <Button 
          label="Đi tiếp"
          onPress={onConfirm}
          rightIcon={ArrowRight}
          className="bg-[#22c55e] border-[#22c55e] h-[60px] rounded-2xl"
          textClassName="text-lg"
        />
      )}
    </View>
  );
});

ActionPanel.displayName = 'ActionPanel';
