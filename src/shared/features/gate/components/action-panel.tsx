import { Button } from '@/shared/components/ui';
import { Camera as CameraIcon, RotateCcw } from 'lucide-react-native';
import React, { memo } from 'react';
import { Pressable, useColorScheme, View } from 'react-native';
import { useScanPlateStore } from '../store';

interface ActionPanelProps {
  onCapture: () => void;
  onConfirm: () => void;
}

/** 
 * Panel điều khiển ở dưới màn hình 
 * Hiển thị kết quả nhận diện biển số và các nút bấm hành động
 */
export const ActionPanel = memo(({ onCapture, onConfirm }: ActionPanelProps) => {
  const { isCapturing, reset } = useScanPlateStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  return (
    <View className={`${isDark ? 'bg-[#0f172a]' : 'bg-white'} rounded-t-[32px] p-6 gap-4 shadow-xl`}>
      <View className="flex-row gap-3">
        <Button 
          label="Chụp"
          onPress={onCapture}
          disabled={isCapturing}
          loading={isCapturing}
          leftIcon={CameraIcon}
          className="flex-1 h-[60px] rounded-2xl"
          textClassName="text-lg font-black"
        />
        <Pressable 
          onPress={reset} 
          className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'} w-[60px] h-[60px] rounded-2xl items-center justify-center border`}
        >
          <RotateCcw size={24} color="#94a3b8" />
        </Pressable>
      </View>
    </View>
  );
});

ActionPanel.displayName = 'ActionPanel';
